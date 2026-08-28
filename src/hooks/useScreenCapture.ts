"use client";

import { useCallback, useRef, useState } from "react";
import type { RefObject } from "react";

export type CaptureStatus = "idle" | "requesting" | "live" | "denied" | "ended" | "unsupported";

export function useScreenCapture(videoRef: RefObject<HTMLVideoElement | null>) {
  const [status, setStatus] = useState<CaptureStatus>("idle");
  const streamRef = useRef<MediaStream | null>(null);

  const start = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getDisplayMedia) {
      setStatus("unsupported");
      return;
    }
    setStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "browser" } as MediaTrackConstraints,
        audio: false,
        preferCurrentTab: true,
      } as DisplayMediaStreamOptions);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      const [track] = stream.getVideoTracks();
      track.addEventListener("ended", () => {
        setStatus("ended");
        streamRef.current = null;
      });
      setStatus("live");
    } catch {
      setStatus("denied");
    }
  }, [videoRef]);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus("idle");
  }, [videoRef]);

  return { status, start, stop };
}
