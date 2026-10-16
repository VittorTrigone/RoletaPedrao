/**
 * Canvas Roulette Wheel Engine for Rossi Tattoo Raffle
 * 60 Numbers, High-DPI support, Dynamic Peg Collision & Realistic Deceleration
 */
class RouletteWheel {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.totalNumbers = options.totalNumbers || 60;
    this.participants = options.participants || {}; // map number -> name
    this.onTick = options.onTick || null;
    this.onFinish = options.onFinish || null;
    this.onNumberPass = options.onNumberPass || null;

    this.rotation = 0; // Current rotation in radians
    this.isSpinning = false;
    this.lastPegIndex = -1;

    // Pointer flipper physics
    this.flipperAngle = 0;
    this.flipperVelocity = 0;

    // Sizing
    this.setupDPI();
    window.addEventListener('resize', () => {
      this.setupDPI();
      this.draw();
    });

    this.draw();
  }

  setupDPI() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    // Set internal resolution for crisp rendering
    const size = Math.min(rect.width || 600, 700);
    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.width = size;
    this.height = size;
    this.radius = size / 2 - 18;
    this.centerX = size / 2;
    this.centerY = size / 2;
    this.dpr = dpr;
  }

  setParticipants(participants) {
    this.participants = participants;
    if (!this.isSpinning) {
      this.draw();
    }
  }

  /**
   * Slices are 0 to totalNumbers - 1
   * Slice i corresponds to number (i + 1)
   */
  getSliceAngle() {
    return (Math.PI * 2) / this.totalNumbers;
  }

  /**
   * Returns current number at the top pointer (12 o'clock, -PI/2)
   */
  getCurrentNumber() {
    const sliceAngle = this.getSliceAngle();
    // Top pointer is at -Math.PI / 2
    // Angle in wheel coordinate system under the top pointer:
    let angleUnderPointer = (-Math.PI / 2 - this.rotation) % (Math.PI * 2);
    if (angleUnderPointer < 0) angleUnderPointer += Math.PI * 2;

    const sliceIndex = Math.floor(angleUnderPointer / sliceAngle) % this.totalNumbers;
    return sliceIndex + 1;
  }

  /**
   * Calculate rotation needed to stop on targetNumber (1 to 60)
   * under the top pointer (-PI/2)
   */
  calculateTargetRotation(targetNumber, extraLaps = 8) {
    const sliceAngle = this.getSliceAngle();
    const targetIndex = targetNumber - 1;

    // Center angle of this slice in initial orientation
    const sliceCenter = (targetIndex + 0.5) * sliceAngle;

    // Slight random variation within slice center (keep within middle 60% of slice)
    const randomJiggle = (Math.random() - 0.5) * (sliceAngle * 0.55);

    // We want: (-PI/2 - finalRotation) % (2PI) === sliceCenter + randomJiggle
    // => finalRotation = -PI/2 - (sliceCenter + randomJiggle) + 2PI * k
    const baseTargetAngle = -Math.PI / 2 - (sliceCenter + randomJiggle);

    // Current normalized rotation
    const currentRot = this.rotation;
    
    // Calculate forward angle
    let target = baseTargetAngle;
    while (target < currentRot + Math.PI * 2 * extraLaps) {
      target += Math.PI * 2;
    }

    return target;
  }

  /**
   * Spin to a specific number
   * @param {number} targetNumber (1 to 60)
   * @param {function} onComplete
   */
  spinTo(targetNumber, onComplete) {
    if (this.isSpinning) return;
    this.isSpinning = true;

    if (window.soundEngine) {
      window.soundEngine.playSpinStart();
    }

    const startRot = this.rotation;
    const endRot = this.calculateTargetRotation(targetNumber, 8 + Math.floor(Math.random() * 3));
    const totalDistance = endRot - startRot;

    const duration = 7.5; // seconds for maximum drama and suspense
    let startTime = null;
    let lastRot = startRot;

    // Animation frame loop using custom deceleration with bouncy pointer
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000;
      const progress = Math.min(1, elapsed / duration);

      // Custom easing: fast start, long cinematic deceleration (Quintic Out)
      // 1 - Math.pow(1 - progress, 5)
      const ease = 1 - Math.pow(1 - progress, 5);
      this.rotation = startRot + totalDistance * ease;

      // Calculate instantaneous rotational speed for sounds
      const deltaRot = this.rotation - lastRot;
      lastRot = this.rotation;
      const speedRatio = Math.min(1, deltaRot / (Math.PI / 10));

      // Peg collision check for top pointer
      const sliceAngle = this.getSliceAngle();
      let angleAtPointer = (-Math.PI / 2 - this.rotation) % (Math.PI * 2);
      if (angleAtPointer < 0) angleAtPointer += Math.PI * 2;
      const currentPeg = Math.floor(angleAtPointer / sliceAngle);

      if (currentPeg !== this.lastPegIndex) {
        this.lastPegIndex = currentPeg;
        // Flipper deflection physics
        this.flipperAngle = -0.35 * Math.min(1.2, speedRatio + 0.4);
        if (this.onTick) this.onTick(speedRatio);
        if (this.onNumberPass) {
          this.onNumberPass(this.getCurrentNumber());
        }
      }

      // Flipper spring recovery
      this.flipperAngle += (0 - this.flipperAngle) * 0.25;

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
    const { ctx, canvas, dpr, width, height, centerX, centerY, radius } = this;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const sliceAngle = this.getSliceAngle();

    // 1. Outer Neon Glow Ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 8, 0, Math.PI * 2);
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#180829';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 4, 0, Math.PI * 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#a855f7';
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = 18;
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
      const hasBuyer = !!this.participants[num];

      // Slice background
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();

      // Alternating deep dark purple / obsidian
      if (hasBuyer) {
        // Bought numbers have special subtle purple glow highlight
        ctx.fillStyle = i % 2 === 0 ? '#3b0764' : '#2e1065';
      } else {
        ctx.fillStyle = i % 2 === 0 ? '#190a2b' : '#0e051a';
      }
      ctx.fill();

      // Subtle slice separator line
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Number text
      ctx.save();
      const textAngle = startAngle + sliceAngle / 2;
      ctx.rotate(textAngle);

      // Distance from center for text
      const textDist = radius * 0.76;
      ctx.translate(textDist, 0);
      ctx.rotate(Math.PI / 2); // Orient radial outwards

      // Format as "01", "02"
      const numStr = num < 10 ? `0${num}` : `${num}`;

      if (hasBuyer) {
        ctx.fillStyle = '#f3e8ff';
        ctx.font = 'bold 11px Montserrat, sans-serif';
        ctx.shadowColor = '#d946ef';
        ctx.shadowBlur = 6;
      } else {
        ctx.fillStyle = 'rgba(216, 180, 254, 0.75)';
        ctx.font = '600 10px Montserrat, sans-serif';
        ctx.shadowBlur = 0;
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(numStr, 0, 0);

      // Mini indicator dot if participant bought this number
      if (hasBuyer) {
        ctx.beginPath();
        ctx.arc(0, 11, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#22c55e'; // Green neon dot
        ctx.shadowColor = '#4ade80';
        ctx.shadowBlur = 5;
        ctx.fill();
      }

      ctx.restore();

      // Perimeter Rivets / Pegs
      const pegX = Math.cos(startAngle) * (radius - 2);
      const pegY = Math.sin(startAngle) * (radius - 2);
      ctx.beginPath();
      ctx.arc(pegX, pegY, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = '#e9d5ff';
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 4;
      ctx.fill();
    }

    ctx.restore(); // Restore wheel rotation

    // 3. Center Hub & Tattoo Crown
    ctx.save();
    ctx.translate(centerX, centerY);

    // Hub outer shadow
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = '#0f051d';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 18;
    ctx.fill();

    // Hub gradient ring
    const hubGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, radius * 0.26);
    hubGrad.addColorStop(0, '#3b0764');
    hubGrad.addColorStop(0.7, '#1e0538');
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

    // Center Crown Icon & Text
    ctx.shadowBlur = 0;
    ctx.font = '22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👑', 0, -6);

    ctx.font = 'bold 9px Montserrat, sans-serif';
    ctx.fillStyle = '#e9d5ff';
    ctx.fillText('ROSSI', 0, 13);
    ctx.restore();

    // 4. Pointer / Flipper (Top at 12 o'clock, pointing down)
    ctx.save();
    ctx.translate(centerX, centerY - radius + 4);
    ctx.rotate(this.flipperAngle);

    // Glowing Arrow
    ctx.beginPath();
    ctx.moveTo(0, 22); // Tip pointing down into the wheel
    ctx.lineTo(-11, -12);
    ctx.lineTo(11, -12);
    ctx.closePath();

    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ec4899';
    ctx.shadowBlur = 15;
    ctx.fill();

    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Small jewel in flipper base
    ctx.beginPath();
    ctx.arc(0, -6, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#d946ef';
    ctx.fill();

    ctx.restore();

    ctx.restore();
  }
}

window.RouletteWheel = RouletteWheel;
