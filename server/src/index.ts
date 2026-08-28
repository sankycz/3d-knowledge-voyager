import { createServer } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { YoutubeFrameSource, StreamStatus } from "./streamSource.js";
import { TrainDetector, ModelStatus } from "./detector.js";
import { TrainTracker } from "./tracker.js";
import { LaneStore } from "./laneStore.js";
import { clusterLaneLines } from "./laneClustering.js";
import { CrossingKind, DetectedBox, TrackLane } from "./types.js";

const PORT = Number(process.env.PORT ?? 8787);
const VIDEO_ID = process.env.YOUTUBE_VIDEO_ID ?? "tmlE1ct0cYk";
const FPS = Number(process.env.CAPTURE_FPS ?? 1);
const SCORE_THRESHOLD = Number(process.env.SCORE_THRESHOLD ?? 0.4);
const CALIBRATION_MS = 20000;

const laneStore = new LaneStore();
const detector = new TrainDetector();
const tracker = new TrainTracker();
const source = new YoutubeFrameSource(VIDEO_ID, FPS);

let captureStatus: StreamStatus = "connecting";
let modelStatus: ModelStatus = "idle";
let calibrating = false;
let calibrationSamples: { x: number; y: number }[] = [];
let calibrationTimer: NodeJS.Timeout | null = null;

const clients = new Set<WebSocket>();

function broadcast(message: unknown) {
  const data = JSON.stringify(message);
  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) ws.send(data);
  }
}

function broadcastStatus() {
  broadcast({ type: "status", capture: captureStatus, model: modelStatus, calibrating });
}

laneStore.onChange((lanes) => broadcast({ type: "lanes", lanes }));

function handleCrossing(laneId: string, kind: CrossingKind, point: { x: number; y: number }) {
  laneStore.recordCrossing(laneId, kind);
  broadcast({ type: "crossing", laneId, kind, point, timestamp: Date.now() });
}

function startCalibration() {
  if (calibrating) return;
  calibrating = true;
  calibrationSamples = [];
  broadcastStatus();
  calibrationTimer = setTimeout(() => {
    calibrating = false;
    const fitted = clusterLaneLines(calibrationSamples);
    calibrationSamples = [];
    if (fitted.length === 0) {
      broadcast({
        type: "notice",
        message: "Během kalibrace nebyl rozpoznán žádný vlak. Zkuste to znovu, nebo koleje přidejte ručně.",
      });
    } else {
      const existing = laneStore.getAll();
      const next: TrackLane[] = fitted.map((line, i) => {
        const prior = existing[i];
        return {
          id: prior?.id ?? `lane-${i + 1}-${Date.now().toString(36)}`,
          name: prior?.name ?? `Kolej ${i + 1}`,
          x1: line.x1,
          y1: line.y1,
          x2: line.x2,
          y2: line.y2,
          invertDirection: prior?.invertDirection ?? false,
          departures: prior?.departures ?? 0,
          arrivals: prior?.arrivals ?? 0,
          dots: prior?.dots ?? [],
        };
      });
      laneStore.replaceLanes(next);
      broadcast({ type: "notice", message: `Rozpoznáno ${next.length} kolejí podle pohybu vlaků.` });
    }
    broadcastStatus();
  }, CALIBRATION_MS);
}

source.on("status", (status: StreamStatus) => {
  captureStatus = status;
  broadcastStatus();
});

source.on("log", (line: string) => {
  console.log("[stream]", line);
});

let processing = false;
source.on("frame", async (jpeg: Buffer) => {
  broadcast({ type: "frame", jpegBase64: jpeg.toString("base64"), timestamp: Date.now() });

  if (modelStatus !== "ready" || processing) return;
  processing = true;
  try {
    const boxes: DetectedBox[] = await detector.detect(jpeg, SCORE_THRESHOLD);
    broadcast({ type: "detections", boxes });

    if (calibrating) {
      for (const box of boxes) {
        calibrationSamples.push({ x: box.x + box.width / 2, y: box.y + box.height / 2 });
      }
    }

    tracker.process(boxes, () => laneStore.getAll(), handleCrossing);
  } catch (err) {
    console.error("Detection failed:", err);
  } finally {
    processing = false;
  }
});

const server = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: true, capture: captureStatus, model: modelStatus }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  clients.add(ws);
  ws.send(JSON.stringify({ type: "lanes", lanes: laneStore.getAll() }));
  ws.send(JSON.stringify({ type: "status", capture: captureStatus, model: modelStatus, calibrating }));

  ws.on("message", (raw) => {
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }
    switch (msg.type) {
      case "addLane":
        laneStore.addLane(typeof msg.name === "string" ? msg.name : undefined);
        break;
      case "removeLane":
        if (typeof msg.id === "string") laneStore.removeLane(msg.id);
        break;
      case "renameLane":
        if (typeof msg.id === "string" && typeof msg.name === "string") {
          laneStore.updateLane(msg.id, { name: msg.name });
        }
        break;
      case "updateLane":
        if (typeof msg.id === "string" && msg.patch && typeof msg.patch === "object") {
          laneStore.updateLane(msg.id, msg.patch as Partial<TrackLane>);
        }
        break;
      case "resetLane":
        if (typeof msg.id === "string") laneStore.resetLane(msg.id);
        break;
      case "resetAll":
        laneStore.resetAll();
        break;
      case "startCalibration":
        startCalibration();
        break;
    }
  });

  ws.on("close", () => clients.delete(ws));
});

async function main() {
  server.listen(PORT, () => {
    console.log(`Train counter server listening on :${PORT}`);
  });

  source.start();

  try {
    await detector.load();
    modelStatus = "ready";
  } catch (err) {
    modelStatus = "error";
    console.error("Failed to load detection model:", err);
  }
  broadcastStatus();
}

main();
