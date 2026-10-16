/**
 * Rossi Tattoo - Raffle Roulette Logic (Mobile-Optimized & Pure Numbers)
 * Handles 60 numbers roulette, drawn state persistence, sound effects, confetti, and Instagram Stories generator.
 */

document.addEventListener('DOMContentLoaded', () => {
  const TOTAL_NUMBERS = 60;
  const STORAGE_KEY_DRAWN = 'rossi_tattoo_drawn_numbers_v2';

  let drawnNumbers = loadDrawnNumbers();
  let latestWinnerNumber = null;

  // DOM Elements
  const btnSpin = document.getElementById('btnSpin');
  const hudNumber = document.getElementById('hudNumber');
  const numbersGrid = document.getElementById('numbersGrid');
  const boardCount = document.getElementById('boardCount');
  const excludeWinnersToggle = document.getElementById('excludeWinnersToggle');
  const btnResetDrawn = document.getElementById('btnResetDrawn');

  // Modals & Controls
  const winnerModal = document.getElementById('winnerModal');
  const winnerCloseBtn = document.getElementById('winnerCloseBtn');
  const winnerBigNum = document.getElementById('winnerBigNum');
  const btnDownloadStory = document.getElementById('btnDownloadStory');
  const btnNewSpin = document.getElementById('btnNewSpin');
  const btnSoundToggle = document.getElementById('btnSoundToggle');
  const btnFullscreen = document.getElementById('btnFullscreen');

  // 1. Initialize Particles Background
  initParticlesCanvas();

  // 2. Initialize Roulette Wheel
  const wheel = new RouletteWheel('rouletteCanvas', {
    totalNumbers: TOTAL_NUMBERS,
    drawnNumbers: drawnNumbers,
    onTick: (speedRatio) => {
      if (window.soundEngine) {
        window.soundEngine.playTick(speedRatio);
      }
    },
    onNumberPass: (num) => {
      const formatted = num < 10 ? `0${num}` : `${num}`;
      hudNumber.textContent = formatted;

      // Micro-highlight badge in 10x6 grid
      const chip = document.querySelector(`.number-chip[data-num="${num}"]`);
      if (chip) {
        document.querySelectorAll('.number-chip.highlight').forEach(c => c.classList.remove('highlight'));
        chip.classList.add('highlight');
      }
    },
    onFinish: (winnerNum) => {
      handleWinnerAnnounce(winnerNum);
    }
  });

  // Render initial grid
  renderBoard();

  // 3. Spin Button Handler
  btnSpin.addEventListener('click', () => {
    if (wheel.isSpinning) return;

    const excludeWinners = excludeWinnersToggle.checked;
    let pool = [];

    for (let i = 1; i <= TOTAL_NUMBERS; i++) {
      if (excludeWinners && drawnNumbers.includes(i)) {
        continue;
      }
      pool.push(i);
    }

    if (pool.length === 0) {
      showToast('⚠️ Todos os 60 números já foram sorteados! Clique em Zerar para recomeçar.');
      return;
    }

    // Pick random target from pool
    const randomIndex = Math.floor(Math.random() * pool.length);
    const targetNumber = pool[randomIndex];

    btnSpin.disabled = true;
    btnSpin.innerHTML = '<span>⚡ GIRANDO... ⚡</span>';

    wheel.spinTo(targetNumber, () => {
      btnSpin.disabled = false;
      btnSpin.innerHTML = '<span>👑 GIRAR ROLETA 👑</span>';
    });
  });

  // 4. Winner Announcement & Celebration
  function handleWinnerAnnounce(num) {
    latestWinnerNumber = num;
    const formatted = num < 10 ? `0${num}` : `${num}`;

    // Add to drawn numbers
    if (!drawnNumbers.includes(num)) {
      drawnNumbers.push(num);
      saveDrawnNumbers(drawnNumbers);
      wheel.setDrawnNumbers(drawnNumbers);
      renderBoard();
    }

    // Play Victory Fanfare
    if (window.soundEngine) {
      window.soundEngine.playWinnerFanfare();
    }

    // Explode Confetti
    fireVictoryConfetti();

    // Show Celebration Modal
    winnerBigNum.textContent = formatted;
    winnerModal.classList.add('active');
  }

  function fireVictoryConfetti() {
    if (typeof confetti === 'function') {
      const duration = 4 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 2000 };

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);

        const particleCount = 40 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.15, 0.4), y: Math.random() - 0.2 },
          colors: ['#a855f7', '#c084fc', '#e879f9', '#fbbf24', '#ffffff']
        }));
        confetti(Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.6, 0.85), y: Math.random() - 0.2 },
          colors: ['#a855f7', '#c084fc', '#e879f9', '#fbbf24', '#ffffff']
        }));
      }, 250);
    }
  }

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  // 5. Render Numbers Board (10x6 Grid)
  function renderBoard() {
    numbersGrid.innerHTML = '';

    for (let i = 1; i <= TOTAL_NUMBERS; i++) {
      const formatted = i < 10 ? `0${i}` : `${i}`;
      const isDrawn = drawnNumbers.includes(i);

      const chip = document.createElement('div');
      chip.className = 'number-chip';
      chip.dataset.num = i;

      if (isDrawn) {
        chip.classList.add('drawn');
        chip.title = `Número ${formatted} (Já Sorteado)`;
      }

      chip.innerHTML = `<span class="num-text">${formatted}</span>`;
      numbersGrid.appendChild(chip);
    }

    boardCount.textContent = `${drawnNumbers.length} / ${TOTAL_NUMBERS}`;
  }

  // 6. Reset Drawn Numbers
  btnResetDrawn.addEventListener('click', () => {
    if (drawnNumbers.length === 0) {
      showToast('Nenhum número sorteado para zerar.');
      return;
    }
    drawnNumbers = [];
    saveDrawnNumbers(drawnNumbers);
    wheel.setDrawnNumbers(drawnNumbers);
    renderBoard();
    showToast('Placar de sorteios zerado! 🔄');
  });

  // Modal Closures
  winnerCloseBtn.addEventListener('click', () => winnerModal.classList.remove('active'));
  btnNewSpin.addEventListener('click', () => winnerModal.classList.remove('active'));
  window.addEventListener('click', (e) => {
    if (e.target === winnerModal) winnerModal.classList.remove('active');
  });

  // 7. Instagram Story Card Generator (1080x1920 9:16)
  btnDownloadStory.addEventListener('click', () => {
    if (!latestWinnerNumber) return;
    const formatted = latestWinnerNumber < 10 ? `0${latestWinnerNumber}` : `${latestWinnerNumber}`;

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');

    // Background Gradient & Vignette
    const bgGrad = ctx.createRadialGradient(540, 960, 100, 540, 960, 1050);
    bgGrad.addColorStop(0, '#2d0e52');
    bgGrad.addColorStop(0.5, '#120522');
    bgGrad.addColorStop(1, '#05020a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1920);

    // Decorative Borders
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 14;
    ctx.strokeRect(40, 40, 1000, 1840);

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4;
    ctx.strokeRect(55, 55, 970, 1810);

    // Crowns & Header
    ctx.font = '76px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('👑', 540, 240);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px Montserrat, sans-serif';
    ctx.letterSpacing = '4px';
    ctx.fillText('VOCÊ ESCOLHE A TATTOO!', 540, 330);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 96px Montserrat, sans-serif';
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = 35;
    ctx.fillText('RIFA TATTOO', 540, 450);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#d8b4fe';
    ctx.font = 'bold 36px Montserrat, sans-serif';
    ctx.fillText('60 NÚMEROS • APENAS R$ 10,00', 540, 520);

    // Giant Winner Circle
    const badgeY = 900;
    ctx.save();
    ctx.beginPath();
    ctx.arc(540, badgeY, 240, 0, Math.PI * 2);
    const circleGrad = ctx.createLinearGradient(300, 660, 780, 1140);
    circleGrad.addColorStop(0, '#fbbf24');
    circleGrad.addColorStop(0.5, '#d97706');
    circleGrad.addColorStop(1, '#78350f');
    ctx.fillStyle = circleGrad;
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 70;
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 14;
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px Montserrat, sans-serif';
    ctx.fillText('NÚMERO SORTEADO', 540, 770);

    ctx.fillStyle = '#0f051d';
    ctx.font = 'bold 190px Montserrat, sans-serif';
    ctx.fillText(formatted, 540, 965);

    // Prize Banner
    ctx.fillStyle = '#f5d0fe';
    ctx.font = 'bold 48px Montserrat, sans-serif';
    ctx.shadowColor = '#d946ef';
    ctx.shadowBlur = 20;
    ctx.fillText('PRÊMIO: 1 TATTOO DA SUA ESCOLHA', 540, 1260);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 34px Montserrat, sans-serif';
    ctx.fillText('SORTE + ARTE = TATTOO NOVA', 540, 1330);

    // Footer Signature
    ctx.font = '64px sans-serif';
    ctx.fillText('👑', 340, 1660);
    ctx.fillText('👑', 740, 1660);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic bold 68px Montserrat, sans-serif';
    ctx.fillText('Rossi.tattoo', 540, 1665);

    ctx.fillStyle = '#a855f7';
    ctx.font = '26px Montserrat, sans-serif';
    ctx.fillText('SORTEIO AO VIVO REALIZADO COM SUCESSO', 540, 1735);

    // Trigger Download
    const link = document.createElement('a');
    link.download = `ganhador-rifa-tattoo-${formatted}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('Story baixado com sucesso! 📸');
  });

  // 8. Sound & Fullscreen Controls
  btnSoundToggle.addEventListener('click', () => {
    if (window.soundEngine) {
      const isMuted = window.soundEngine.toggleMute();
      btnSoundToggle.innerHTML = isMuted ? '🔇' : '🔊';
      btnSoundToggle.title = isMuted ? 'Ativar Som' : 'Silenciar';
      showToast(isMuted ? 'Som desativado 🔇' : 'Som ativado 🔊', 1800);
    }
  });

  btnFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  });

  // Toast Helper
  function showToast(message, duration = 3000) {
    let toast = document.querySelector('.app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'app-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span>👑</span> <span>${message}</span>`;
    toast.classList.add('active');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
      toast.classList.remove('active');
    }, duration);
  }

  // LocalStorage Helpers
  function loadDrawnNumbers() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_DRAWN);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveDrawnNumbers(data) {
    try {
      localStorage.setItem(STORAGE_KEY_DRAWN, JSON.stringify(data));
    } catch (e) {}
  }

  // 9. Floating Embers Background
  function initParticlesCanvas() {
    const pCanvas = document.getElementById('fx-canvas');
    if (!pCanvas) return;
    const pCtx = pCanvas.getContext('2d');
    let pWidth = (pCanvas.width = window.innerWidth);
    let pHeight = (pCanvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      pWidth = pCanvas.width = window.innerWidth;
      pHeight = pCanvas.height = window.innerHeight;
    });

    const particles = [];
    const count = 30;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * pWidth,
        y: Math.random() * pHeight,
        radius: Math.random() * 2 + 0.8,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -Math.random() * 0.6 - 0.2,
        alpha: Math.random() * 0.5 + 0.2,
        color: Math.random() > 0.4 ? '#c084fc' : '#e879f9'
      });
    }

    function loop() {
      pCtx.clearRect(0, 0, pWidth, pHeight);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.y < -10) {
          p.y = pHeight + 10;
          p.x = Math.random() * pWidth;
        }
        if (p.x < -10) p.x = pWidth + 10;
        if (p.x > pWidth + 10) p.x = -10;

        pCtx.save();
        pCtx.beginPath();
        pCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        pCtx.fillStyle = p.color;
        pCtx.globalAlpha = p.alpha;
        pCtx.shadowColor = p.color;
        pCtx.shadowBlur = 8;
        pCtx.fill();
        pCtx.restore();
      });

      requestAnimationFrame(loop);
    }
    loop();
  }
});
