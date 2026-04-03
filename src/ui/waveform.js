export default class Waveform {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.samples = [];
  }

  addSample(value) {
    this.samples.push(value);
    if (this.samples.length > 240) this.samples.shift();
    this.redraw();
  }

  redraw() {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    this.canvas.width = width * window.devicePixelRatio;
    this.canvas.height = height * window.devicePixelRatio;
    this.ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);

    this.ctx.clearRect(0, 0, width, height);
    this.ctx.strokeStyle = '#00ffa3';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();

    const step = Math.max(1, width / Math.max(1, this.samples.length));

    this.samples.forEach((value, index) => {
      const x = index * step;
      const y = height - (value / 100) * height;
      index === 0 ? this.ctx.moveTo(x, y) : this.ctx.lineTo(x, y);
    });

    this.ctx.stroke();
  }
}
