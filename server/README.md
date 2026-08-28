# Train counter server

Reads the YouTube live stream directly — no browser, no screen-share click —
and pushes detections/counts to the frontend over a WebSocket. This has to
run somewhere with real, unrestricted internet access; it cannot run inside
the browser (see the main README for why).

**Read this before running it:** pulling a YouTube live stream this way (via
`yt-dlp` + `ffmpeg`, on a loop, indefinitely) sits outside what YouTube's
Terms of Service intend. Treat this as a personal, low-volume tool — don't
expose it publicly, don't run many instances, and expect it to occasionally
need a restart if YouTube changes something. It is not something to build a
product on.

## What it does

1. `yt-dlp -g` resolves the video ID to a direct stream URL.
2. `ffmpeg` reads that URL and re-encodes it as a low-frame-rate MJPEG stream
   on its stdout (default 1 frame/second — plenty for counting trains, and
   light on bandwidth/CPU).
3. Each frame is decoded and run through `coco-ssd` (TensorFlow.js, native
   Node bindings) to find `train` detections.
4. The same centroid-tracking and line-crossing logic as the browser build
   (ported to plain TypeScript) turns detections into arrival/departure
   counts per lane.
5. Everything — the frame, detections, crossing events, lane edits — goes out
   over a WebSocket to any connected browser. Lane layout and counts are
   persisted to `server/data/lanes.json`, so counting keeps running even with
   no browser tab open, and survives a restart.

## Prerequisites

- Node.js 20+
- `ffmpeg` on `PATH`
- `yt-dlp` on `PATH` (`pip install yt-dlp`, or your package manager)

## Run it

```bash
cd server
npm install
npm run build
npm start
```

Or for local development (auto-restarts on file changes):

```bash
npm run dev
```

It listens on `ws://localhost:8787` by default, plus `GET /health` for a
quick status check.

## Configuration (environment variables)

| Variable            | Default          | Meaning                                   |
| -------------------- | ---------------- | ------------------------------------------ |
| `PORT`               | `8787`            | HTTP/WebSocket port                        |
| `YOUTUBE_VIDEO_ID`    | `tmlE1ct0cYk`     | Which live stream to read                  |
| `CAPTURE_FPS`         | `1`               | Frames pulled per second                   |
| `SCORE_THRESHOLD`     | `0.4`             | Minimum confidence to count a detection    |
| `LANES_FILE`          | `server/data/lanes.json` | Where lane layout/counts are persisted |

## Pointing the frontend at it

In the app, switch to the **"Server (automaticky)"** mode and enter this
server's address, e.g. `ws://localhost:8787` for local use.

**If the frontend is deployed on Vercel (HTTPS), the address must be
`wss://`, not `ws://`.** Browsers block a plain `ws://` connection from an
HTTPS page (mixed content) — this isn't optional. That means the server
needs to sit behind a reverse proxy that terminates TLS (Caddy, nginx, or
your host's built-in HTTPS, e.g. Fly.io/Railway both give you a `wss://` URL
for free). Running everything on `localhost` for local development is the
one case where plain `ws://` still works, since the page itself is also
loaded over plain HTTP there.
