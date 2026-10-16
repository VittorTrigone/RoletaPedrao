/**
 * Canvas Roulette Wheel Engine for Rossi Tattoo Raffle
 * 60 Numbers, Mobile-Optimized, High-DPI Canvas & Realistic Deceleration
 */
class RouletteWheel {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.totalNumbers = options.totalNumbers || 60;
    this.drawnNumbers = options.drawnNumbers || []; // list of already drawn numbers
    this.onTick = options.onTick || null;
    this.onFinish = options.onFinish || null;
    this.onNumberPass = options.onNumberPass || null;

    this.rotation = 0; // Current rotation in radians
    this.isSpinning = false;
    this.lastPegIndex = -1;

    // Pointer flipper physics
    this.flipperAngle = 0;

    // Sizing & DPI
    this.setupDPI();
    window.addEventListener('resize', () => {
      this.setupDPI();
      this.draw();
    });

    this.draw();
  }

  setupDPI() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5); // Cap at 2.5 for mobile GPU performance
    const size = Math.max(rect.width || 340, 320);
    
    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.width = size;
    this.height = size;
    this.radius = size / 2 - 14;
    this.centerX = size / 2;
    this.centerY = size / 2;
    this.dpr = dpr;
  }

  setDrawnNumbers(drawnNumbers) {
    this.drawnNumbers = drawnNumbers;
    if (!this.isSpinning) {
      this.draw();
    }
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

  calculateTargetRotation(targetNumber, extraLaps = 8) {
    const sliceAngle = this.getSliceAngle();
    const targetIndex = targetNumber - 1;
    const sliceCenter = (targetIndex + 0.5) * sliceAngle;

    // Slight random jiggle inside slice
    const randomJiggle = (Math.random() - 0.5) * (sliceAngle * 0.5);
    const baseTargetAngle = -Math.PI / 2 - (sliceCenter + randomJiggle);

    const currentRot = this.rotation;
    let target = baseTargetAngle;
    while (target < currentRot + Math.PI * 2 * extraLaps) {
      target += Math.PI * 2;
    }

    return target;
  }

  spinTo(targetNumber, onComplete) {
    if (this.isSpinning) return;
    this.isSpinning = true;

    if (window.soundEngine) {
      window.soundEngine.playSpinStart();
    }

    const startRot = this.rotation;
    const endRot = this.calculateTargetRotation(targetNumber, 7 + Math.floor(Math.random() * 2));
    const totalDistance = endRot - startRot;

    const duration = 7.0; // 7 seconds of suspense
    let startTime = null;
    let lastRot = startRot;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000;
      const progress = Math.min(1, elapsed / duration);

      // Quintic Out easing for realistic heavy friction
      const ease = 1 - Math.pow(1 - progress, 5);
      this.rotation = startRot + totalDistance * ease;

      const deltaRot = this.rotation - lastRot;
      lastRot = this.rotation;
      const speedRatio = Math.min(1, deltaRot / (Math.PI / 10));

      // Peg collision for flipper
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

      this.flipperAngle += (0 - this.flipperAngle) * 0.28;
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

  draw() {
    const { ctx, dpr, width, height, centerX, centerY, radius } = this;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const sliceAngle = this.getSliceAngle();

    // 1. Outer Neon Rim
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 6, 0, Math.PI * 2);
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#150624';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 3, 0, Math.PI * 2);
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#a855f7';
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = 14;
    ctx.stroke();
    ctx.restore();

    // 2. Draw Wheel Slices
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(this.rotation);

    for (let i = 0; i < this.totalNumbers; i++) {
      const num = i + 1;
      const startAngle = i * sliceAngle;
      const endAngle = startAngle + sliceAngle;
      const isDrawn = this.drawnNumbers.includes(num);

      // Slice background
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();

      if (isDrawn) {
        // Gold / dim for already drawn
        ctx.fillStyle = '#451a03';
      } else {
        // Alternating vibrant purple & deep obsidian
        ctx.fillStyle = i % 2 === 0 ? '#380e60' : '#1a072c';
      }
      ctx.fill();

      // Divider line
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Number text
      ctx.save();
      const textAngle = startAngle + sliceAngle / 2;
      ctx.rotate(textAngle);

      const textDist = radius * 0.77;
      ctx.translate(textDist, 0);
      ctx.rotate(Math.PI / 2);

      const numStr = num < 10 ? `0${num}` : `${num}`;

      if (isDrawn) {
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 10px Montserrat, sans-serif';
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px Montserrat, sans-serif';
        ctx.shadowColor = '#d946ef';
        ctx.shadowBlur = 5;
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(numStr, 0, 0);

      ctx.restore();

      // Perimeter Pegs
      const pegX = Math.cos(startAngle) * (radius - 2);
      const pegY = Math.sin(startAngle) * (radius - 2);
      ctx.beginPath();
      ctx.arc(pegX, pegY, 2, 0, Math.PI * 2);
      ctx.fillStyle = isDrawn ? '#fbbf24' : '#e9d5ff';
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 3;
      ctx.fill();
    }

    ctx.restore();

    // 3. Center Hub with Crown
    ctx.save();
    ctx.translate(centerX, centerY);

    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = '#0c0316';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 16;
    ctx.fill();

    const hubGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, radius * 0.26);
    hubGrad.addColorStop(0, '#581c87');
    hubGrad.addColorStop(0.7, '#24083d');
    hubGrad.addColorStop(1, '#090214');

    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = hubGrad;
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.font = `${Math.round(radius * 0.13)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👑', 0, -4);

    ctx.font = `bold ${Math.round(radius * 0.05)}px Montserrat, sans-serif`;
    ctx.fillStyle = '#f5d0fe';
    ctx.fillText('ROSSI', 0, radius * 0.12);
    ctx.restore();

    // 4. Pointer / Flipper at 12 o'clock
    ctx.save();
    ctx.translate(centerX, centerY - radius + 4);
    ctx.rotate(this.flipperAngle);

    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.lineTo(-10, -10);
    ctx.lineTo(10, -10);
    ctx.closePath();

    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ec4899';
    ctx.shadowBlur = 14;
    ctx.fill();

    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, -5, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#d946ef';
    ctx.fill();

    ctx.restore();
    ctx.restore();
  }
}

window.RouletteWheel = RouletteWheel;
