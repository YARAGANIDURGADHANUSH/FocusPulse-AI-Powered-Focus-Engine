export default class CameraService {
  constructor(videoElement) {
    this.videoElement = videoElement;
    this.stream = null;
  }

  async start() {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Webcam access is not supported in this browser.');
    }
    this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
    this.videoElement.srcObject = this.stream;
    await this.videoElement.play();
    return this.stream;
  }

  stop() {
    if (!this.stream) return;
    this.stream.getTracks().forEach((track) => track.stop());
    this.videoElement.pause();
    this.videoElement.srcObject = null;
    this.stream = null;
  }
}
