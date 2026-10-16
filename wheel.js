/**
 * Canvas Roulette Wheel Engine for Rossi Tattoo Raffle
 * Ultra-Optimized for Mobile: Offscreen Canvas Texture Caching + Zero per-frame overhead
 */
class RouletteWheel {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d', { alpha: true });
    this.totalNumbers = options.totalNumbers || 60;
    this.onTick = options.onTick || null;
    this.onFinish = options.onFinish || null;
    this.onNumberPass = options.onNumberPass || null;

    this.rotation = 0;
    this.isSpinning = false;
    this.isLocked = false;
    this.lastPegIndex = -1;
    this.flipperAngle = 0;

    // Offscreen Canvas for caching static wheel disk (100x faster on mobile)
    this.diskCanvas = document.createElement('canvas');
    this.diskCtx = this.diskCanvas.getContext('2d');

    this.setupDPI();

    window.addEventListener('resize', () => {
      this.setupDPI();
      this.draw();
    });

    this.draw();
  }

  setupDPI() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // 2 is optimal for sharp retina without mobile lag
    const size = Math.max(rect.width || 360, 320);

    this.width = size;
    this.height = size;
    this.radius = size / 2 - 14;
    this.centerX = size / 2;
    this.centerY = size / 2;
    this.dpr = dpr;

    // Main Canvas
    this.canvas.width = Math.round(size * dpr);
    this.canvas.height = Math.round(size * dpr);

    // Offscreen Cached Disk Canvas
    this.diskCanvas.width = Math.round(size * dpr);
    this.diskCanvas.height = Math.round(size * dpr);

    // Pre-render wheel disk texture ONCE
    this.renderWheelDisk();
  }

  getSliceAngle() {
    return (Math.PI * 2) / this.totalNumbers;
  }

  getCurrentNumber() {
    const sliceAngle = this.getSliceAngle();
    let angleUnderPointer = (-Math.PI / 2 - this.rotation) % (Math.PI * 2);
    if (angleUnderPointer < 0) angleUnderPointer += Math.PI * 2;

    const sliceIndex = Math.floor(angleUnderPointer / sliceAngle) % this.totalNumbers;
    return sliceIndex + 1;
  }

  calculateTargetRotation(targetNumber, extraLaps = 7) {
    const sliceAngle = this.getSliceAngle();
    const targetIndex = targetNumber - 1;
    const sliceCenter = (targetIndex + 0.5) * sliceAngle;

    const randomJiggle = (Math.random() - 0.5) * (sliceAngle * 0.45);
    const baseTargetAngle = -Math.PI / 2 - (sliceCenter + randomJiggle);

    const currentRot = this.rotation;
    let target = baseTargetAngle;
    while (target < currentRot + Math.PI * 2 * extraLaps) {
      target += Math.PI * 2;
    }

    return target;
  }

  /**
   * Pre-renders the entire wheel (slices, numbers, rivets, hub, crown)
   * onto the offscreen canvas texture. This only runs once (or on resize),
   * NOT 60 times a second!
   */
  renderWheelDisk() {
    const { diskCtx: ctx, dpr, width, height, centerX, centerY, radius } = this;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const sliceAngle = this.getSliceAngle();

    // 1. Outer Neon Rim
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 6, 0, Math.PI * 2);
    ctx.lineWidth = 11;
    ctx.strokeStyle = '#150624';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 3, 0, Math.PI * 2);
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#a855f7';
    ctx.stroke();

    // 2. Draw Wheel Slices & Numbers
    ctx.save();
    ctx.translate(centerX, centerY);

    for (let i = 0; i < this.totalNumbers; i++) {
      const num = i + 1;
      const startAngle = i * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      // Slice background
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();

      // Alternating deep purple & dark obsidian
      ctx.fillStyle = i % 2 === 0 ? '#3b0e64' : '#19072c';
      ctx.fill();

      // Divider line
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Number text placed near the edge of the slice
      ctx.save();
      const textAngle = startAngle + sliceAngle / 2;
      ctx.rotate(textAngle);

      const textDist = radius * 0.89;
      ctx.translate(textDist, 0);
      ctx.rotate(Math.PI / 2);

      const numStr = num < 10 ? `0${num}` : `${num}`;

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9.5px Montserrat, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(numStr, 0, 0);

      ctx.restore();

      // Perimeter Rivets / Pegs
      const pegX = Math.cos(startAngle) * (radius - 2);
      const pegY = Math.sin(startAngle) * (radius - 2);
      ctx.beginPath();
      ctx.arc(pegX, pegY, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#e9d5ff';
      ctx.fill();
    }

    // 3. Center Hub with Crown
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = '#0c0316';
    ctx.fill();

    const hubGrad = ctx.createRadialGradient(0, 0, 3, 0, 0, radius * 0.26);
    hubGrad.addColorStop(0, '#581c87');
    hubGrad.addColorStop(0.7, '#24083d');
    hubGrad.addColorStop(1, '#090214');

    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = hubGrad;
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2.8;
    ctx.stroke();
    ctx.fill();

    // Center Crown
    ctx.font = `${Math.round(radius * 0.17)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👑', 0, 1);

    ctx.restore();
    ctx.restore();
  }

  setNumber(targetNumber) {
    const sliceAngle = this.getSliceAngle();
    const targetIndex = targetNumber - 1;
    const sliceCenter = (targetIndex + 0.5) * sliceAngle;
    this.rotation = -Math.PI / 2 - sliceCenter;
    this.draw();
  }

  spinTo(targetNumber, onComplete) {
    if (this.isSpinning || this.isLocked) return;
    this.isSpinning = true;

    if (window.soundEngine) {
      window.soundEngine.playSpinStart();
    }

    const startRot = this.rotation;
    const endRot = this.calculateTargetRotation(targetNumber, 7 + Math.floor(Math.random() * 2));
    const totalDistance = endRot - startRot;

    const duration = 6.8; // 6.8 seconds of smooth deceleration
    let startTime = null;
    let lastRot = startRot;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000;
      const progress = Math.min(1, elapsed / duration);

      // Quintic Out easing
      const ease = 1 - Math.pow(1 - progress, 5);
      this.rotation = startRot + totalDistance * ease;

      const deltaRot = this.rotation - lastRot;
      lastRot = this.rotation;
      const speedRatio = Math.min(1, deltaRot / (Math.PI / 10));

      // Peg collision check
      const sliceAngle = this.getSliceAngle();
      let angleAtPointer = (-Math.PI / 2 - this.rotation) % (Math.PI * 2);
      if (angleAtPointer < 0) angleAtPointer += Math.PI * 2;
      const currentPeg = Math.floor(angleAtPointer / sliceAngle);

      if (currentPeg !== this.lastPegIndex) {
        this.lastPegIndex = currentPeg;
        this.flipperAngle = -0.32 * Math.min(1.2, speedRatio + 0.4);
        if (this.onTick) this.onTick(speedRatio);
        if (this.onNumberPass) {
          this.onNumberPass(this.getCurrentNumber());
        }
      }

      // Flipper spring return
      this.flipperAngle += (0 - this.flipperAngle) * 0.32;

      // Draw optimized frame (1 single drawImage call!)
      this.draw();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isSpinning = false;
        this.flipperAngle = 0;
        this.draw();
        if (this.onFinish) this.onFinish(targetNumber);
        if (onComplete) onComplete(targetNumber);
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Fast Blit: Draws cached disk texture + flipper in <0.2ms
   */
  draw() {
    const { ctx, dpr, width, height, centerX, centerY, radius } = this;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // 1. Draw pre-rendered rotating wheel disk
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(this.rotation);
    ctx.drawImage(this.diskCanvas, 0, 0, this.diskCanvas.width, this.diskCanvas.height, -centerX, -centerY, width, height);
    ctx.restore();

    // 2. Pointer / Flipper at 12 o'clock
    ctx.save();
    ctx.translate(centerX, centerY - radius - 5);
    ctx.rotate(this.flipperAngle);

    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.lineTo(-8, -10);
    ctx.lineTo(8, -10);
    ctx.closePath();

    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, -6, 2.6, 0, Math.PI * 2);
    ctx.fillStyle = '#d946ef';
    ctx.fill();

    ctx.restore();
    ctx.restore();
  }
}

window.RouletteWheel = RouletteWheel;
