import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export class HandTracking {
  constructor(video) {
    this.video = video;
    this.landmarker = null;
    this.lastVideoTime = -1;
    this.lastHands = [];
  }

  async init() {
    // Build the landmarker once; reuse it across stop/restart cycles.
    if (!this.landmarker) {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );
      this.landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/' +
            'hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 2,
      });
    }

    // Prefer the front camera on phones (falls back to any camera on desktop).
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
    });
    this.video.srcObject = stream;
    await this.video.play();
  }

  // Turn the camera off (stops the stream + the recording indicator).
  stop() {
    const stream = this.video.srcObject;
    if (stream) {
      for (const track of stream.getTracks()) track.stop();
      this.video.srcObject = null;
    }
    this.lastVideoTime = -1;
    this.lastHands = [];
  }

  // Returns an array of detected hands (0..2), each a 21-entry landmark array
  // of {x,y,z}.
  detect(timestampMs) {
    if (!this.landmarker || this.video.readyState < 2) return [];
    if (this.video.currentTime === this.lastVideoTime) return this.lastHands;
    this.lastVideoTime = this.video.currentTime;
    const result = this.landmarker.detectForVideo(this.video, timestampMs);
    this.lastHands = result.landmarks || [];
    return this.lastHands;
  }
}
