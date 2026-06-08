import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export class HandTracking {
  constructor(video) {
    this.video = video;
    this.landmarker = null;
    this.lastVideoTime = -1;
    this.lastLandmarks = null;
  }

  async init() {
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
      numHands: 1,
    });

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    this.video.srcObject = stream;
    await this.video.play();
  }

  // Returns the first hand's 21 landmarks (array of {x,y,z}) or null.
  detect(timestampMs) {
    if (!this.landmarker || this.video.readyState < 2) return null;
    if (this.video.currentTime === this.lastVideoTime) return this.lastLandmarks;
    this.lastVideoTime = this.video.currentTime;
    const result = this.landmarker.detectForVideo(this.video, timestampMs);
    this.lastLandmarks =
      result.landmarks && result.landmarks.length > 0
        ? result.landmarks[0]
        : null;
    return this.lastLandmarks;
  }
}
