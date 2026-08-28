import "@tensorflow/tfjs-node";
import * as tf from "@tensorflow/tfjs-node";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import { DetectedBox } from "./types.js";

export type ModelStatus = "idle" | "loading" | "ready" | "error";

export class TrainDetector {
  private model: cocoSsd.ObjectDetection | null = null;
  status: ModelStatus = "idle";

  async load() {
    this.status = "loading";
    try {
      this.model = await cocoSsd.load({ base: "lite_mobilenet_v2" });
      this.status = "ready";
    } catch (err) {
      this.status = "error";
      throw err;
    }
  }

  /** Runs detection on one JPEG frame, returning normalized (0-1) train boxes. */
  async detect(jpeg: Buffer, scoreThreshold = 0.4): Promise<DetectedBox[]> {
    if (!this.model) return [];
    const image = tf.node.decodeJpeg(jpeg, 3);
    try {
      const [height, width] = image.shape;
      const predictions = await this.model.detect(image as unknown as tf.Tensor3D);
      return predictions
        .filter((p) => p.class === "train" && p.score >= scoreThreshold)
        .map((p) => ({
          x: p.bbox[0] / width,
          y: p.bbox[1] / height,
          width: p.bbox[2] / width,
          height: p.bbox[3] / height,
          score: p.score,
        }));
    } finally {
      image.dispose();
    }
  }
}
