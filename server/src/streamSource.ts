import { spawn } from "node:child_process";
import { EventEmitter } from "node:events";

const JPEG_SOI = Buffer.from([0xff, 0xd8]);
const JPEG_EOI = Buffer.from([0xff, 0xd9]);

export type StreamStatus = "connecting" | "live" | "error";

/**
 * Pulls frames from a YouTube live stream without a browser: `yt-dlp -g`
 * resolves the video ID to a direct HLS manifest URL, then ffmpeg reads that
 * manifest and re-encodes it as a raw MJPEG byte stream on stdout, which we
 * split back into individual JPEG frame buffers.
 *
 * This has to run somewhere with real, unrestricted internet access — it
 * cannot run inside a browser (see the README for why) and downloading a
 * live stream this way sits outside what YouTube's Terms of Service intend,
 * so treat this as a personal, low-volume tool rather than something to
 * expose publicly or run aggressively.
 */
export class YoutubeFrameSource extends EventEmitter {
  private videoId: string;
  private fps: number;
  private ffmpeg: ReturnType<typeof spawn> | null = null;
  private buffer = Buffer.alloc(0);
  private stopped = false;
  private retryDelayMs = 2000;

  constructor(videoId: string, fps = 1) {
    super();
    this.videoId = videoId;
    this.fps = fps;
  }

  start() {
    this.stopped = false;
    this.connect();
  }

  stop() {
    this.stopped = true;
    this.ffmpeg?.kill("SIGTERM");
    this.ffmpeg = null;
  }

  private async connect() {
    if (this.stopped) return;
    this.emit("status", "connecting" satisfies StreamStatus);

    let streamUrl: string;
    try {
      streamUrl = await this.resolveStreamUrl();
    } catch (err) {
      this.emit("status", "error" satisfies StreamStatus);
      this.emit("log", `Nepodařilo se získat adresu streamu z yt-dlp: ${(err as Error).message}`);
      this.scheduleRetry();
      return;
    }

    if (this.stopped) return;

    const ffmpeg = spawn("ffmpeg", [
      "-loglevel",
      "error",
      "-i",
      streamUrl,
      "-vf",
      `fps=${this.fps}`,
      "-f",
      "image2pipe",
      "-vcodec",
      "mjpeg",
      "-q:v",
      "5",
      "pipe:1",
    ]);
    this.ffmpeg = ffmpeg;
    this.buffer = Buffer.alloc(0);

    let sawFrame = false;
    ffmpeg.stdout.on("data", (chunk: Buffer) => {
      this.buffer = Buffer.concat([this.buffer, chunk]);
      this.extractFrames();
      if (!sawFrame && this.buffer.length > 0) {
        sawFrame = true;
        this.emit("status", "live" satisfies StreamStatus);
      }
    });

    ffmpeg.stderr.on("data", (chunk: Buffer) => {
      this.emit("log", chunk.toString("utf-8").trim());
    });

    ffmpeg.on("exit", (code) => {
      this.ffmpeg = null;
      if (this.stopped) return;
      this.emit("log", `ffmpeg skončil (kód ${code}), zkouším znovu…`);
      this.emit("status", "connecting" satisfies StreamStatus);
      this.scheduleRetry();
    });

    ffmpeg.on("error", (err) => {
      this.emit("log", `ffmpeg selhal: ${err.message}`);
    });
  }

  private scheduleRetry() {
    if (this.stopped) return;
    setTimeout(() => this.connect(), this.retryDelayMs);
    this.retryDelayMs = Math.min(this.retryDelayMs * 1.5, 30000);
  }

  private extractFrames() {
    while (true) {
      const start = this.buffer.indexOf(JPEG_SOI);
      if (start === -1) {
        this.buffer = Buffer.alloc(0);
        return;
      }
      const end = this.buffer.indexOf(JPEG_EOI, start + 2);
      if (end === -1) {
        if (start > 0) this.buffer = this.buffer.subarray(start);
        return;
      }
      const frame = this.buffer.subarray(start, end + 2);
      this.buffer = this.buffer.subarray(end + 2);
      this.retryDelayMs = 2000;
      this.emit("frame", Buffer.from(frame));
    }
  }

  private resolveStreamUrl(): Promise<string> {
    return new Promise((resolve, reject) => {
      const url = `https://www.youtube.com/watch?v=${this.videoId}`;
      const proc = spawn("yt-dlp", ["-g", "--no-warnings", "-f", "best", url]);
      let out = "";
      let err = "";
      proc.stdout.on("data", (c) => (out += c));
      proc.stderr.on("data", (c) => (err += c));
      proc.on("close", (code) => {
        const line = out.trim().split("\n").filter(Boolean).pop();
        if (code === 0 && line) resolve(line);
        else reject(new Error(err.trim() || `yt-dlp selhalo s kódem ${code}`));
      });
      proc.on("error", (e) => reject(e));
    });
  }
}
