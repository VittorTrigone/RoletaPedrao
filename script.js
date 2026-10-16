/**
 * Rossi Tattoo - Raffle Roulette Logic (Single Spin • Pure Numbers 01 to 60)
 * Mobile-First, procedural sound effects, confetti explosion, and Instagram Stories card generator.
 */

// ==========================================================================
// 1. CONFIGURAÇÃO DA NUVEM (Google Cloud Firestore)
// ==========================================================================
const firebaseConfig = {
  apiKey: "AIzaSyAJXyJa1_f_1VuKVzRWFS1r1Fb6o69-J7Q",
  authDomain: "roletapedrao.firebaseapp.com",
  databaseURL: "https://roletapedrao-default-rtdb.firebaseio.com",
  projectId: "roletapedrao",
  storageBucket: "roletapedrao.firebasestorage.app",
  messagingSenderId: "921253886467",
  appId: "1:921253886467:web:c9eb285a6cb983c158ec36"
};

// Documento oficial no Firestore (corresponde exatamente à regra de segurança publicada)
const FIRESTORE_COLLECTION = "raffles";
const FIRESTORE_DOC_ID = "tattoo_v1";

document.addEventListener('DOMContentLoaded', () => {
  const TOTAL_NUMBERS = 60;
  const STORAGE_KEY = 'rossi_tattoo_raffle_v1';
  let latestWinnerNumber = null;

  // DOM Elements
  const btnSpin = document.getElementById('btnSpin');
  const hudNumber = document.getElementById('hudNumber');

  // Modals & Controls
  const winnerModal = document.getElementById('winnerModal');
  const winnerCloseBtn = document.getElementById('winnerCloseBtn');
  const winnerBigNum = document.getElementById('winnerBigNum');
  const btnDownloadStory = document.getElementById('btnDownloadStory');
  const btnNewSpin = document.getElementById('btnNewSpin');
  const btnSoundToggle = document.getElementById('btnSoundToggle');
  const btnFullscreen = document.getElementById('btnFullscreen');

  // Firebase Firestore Setup
  let firestoreDb = null;
  let raffleDocRef = null;

  try {
    if (typeof firebase !== 'undefined') {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      firestoreDb = firebase.firestore();
      raffleDocRef = firestoreDb.collection(FIRESTORE_COLLECTION).doc(FIRESTORE_DOC_ID);
    }
  } catch (err) {
    console.warn('Aviso ao conectar no Cloud Firestore:', err);
  }

  function getSavedDraw() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data && typeof data.winner === 'number' && data.winner >= 1 && data.winner <= TOTAL_NUMBERS) {
        return data;
      }
    } catch (e) {
      console.warn('Erro ao carregar sorteio salvo:', e);
    }
    return null;
  }

  function saveDraw(winnerNum, extraData = {}) {
    try {
      const data = {
        winner: winnerNum,
        timestamp: extraData.timestamp || Date.now(),
        dateFormatted: extraData.dateFormatted || new Date().toLocaleString('pt-BR')
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Erro ao salvar resultado:', e);
    }
  }

  function applyLockedState(savedData) {
    const num = savedData.winner;
    latestWinnerNumber = num;
    wheel.isLocked = true;
    wheel.setNumber(num);

    const formatted = num < 10 ? `0${num}` : `${num}`;
    hudNumber.textContent = formatted;

    btnSpin.disabled = true;
    btnSpin.innerHTML = '<span>🔒 SORTEIO REALIZADO 🔒</span>';
    btnSpin.title = 'Este sorteio é único e já foi realizado.';

    if (btnNewSpin) {
      btnNewSpin.textContent = 'FECHAR';
    }

    winnerBigNum.textContent = formatted;
  }

  // 1. Initialize Particles Background
  initParticlesCanvas();

  // 2. Initialize Roulette Wheel
  let lastHudTime = 0;
  const wheel = new RouletteWheel('rouletteCanvas', {
    totalNumbers: TOTAL_NUMBERS,
    onTick: (speedRatio) => {
      if (window.soundEngine) {
        window.soundEngine.playTick(speedRatio);
      }
    },
    onNumberPass: (num) => {
      const now = performance.now();
      if (now - lastHudTime > 30) {
        lastHudTime = now;
        hudNumber.textContent = num < 10 ? `0${num}` : `${num}`;
      }
    },
    onFinish: (winnerNum) => {
      hudNumber.textContent = winnerNum < 10 ? `0${winnerNum}` : `${winnerNum}`;
      handleWinnerAnnounce(winnerNum);
    }
  });

  // Check Local Storage on Startup (instant display)
  const initialDraw = getSavedDraw();
  if (initialDraw) {
    applyLockedState(initialDraw);
  }

  // Real-time Cloud Sync Listener (Firestore)
  if (raffleDocRef) {
    raffleDocRef.onSnapshot((docSnapshot) => {
      if (docSnapshot && docSnapshot.exists) {
        const cloudData = docSnapshot.data();
        if (cloudData && typeof cloudData.winner === 'number') {
          saveDraw(cloudData.winner, cloudData);
          if (!wheel.isSpinning) {
            applyLockedState(cloudData);
          }
        }
      } else if (docSnapshot && !docSnapshot.exists) {
        // Se a nuvem ainda não tem sorteio gravado, garante que a tela esteja liberada
        localStorage.removeItem(STORAGE_KEY);
        wheel.isLocked = false;
        latestWinnerNumber = null;
        btnSpin.disabled = false;
        btnSpin.innerHTML = '<span>👑 GIRAR ROLETA 👑</span>';
      }
    }, (error) => {
      console.warn('Aviso no monitoramento em tempo real do Firestore:', error);
    });
  }

  // 3. Spin Button Handler (Strict Single-Use Raffle with Cloud Lock)
  btnSpin.addEventListener('click', async () => {
    // If already locked, clicking reopens modal to view result or download story
    if (wheel.isLocked || latestWinnerNumber !== null) {
      if (latestWinnerNumber) {
        winnerBigNum.textContent = latestWinnerNumber < 10 ? `0${latestWinnerNumber}` : `${latestWinnerNumber}`;
        winnerModal.classList.add('active');
      }
      return;
    }

    if (wheel.isSpinning) return;

    // Pick genuinely random target from 1 to 60
    const targetNumber = Math.floor(Math.random() * TOTAL_NUMBERS) + 1;
    const drawData = {
      winner: targetNumber,
      timestamp: Date.now(),
      dateFormatted: new Date().toLocaleString('pt-BR')
    };

    // Start spin immediately without waiting for network roundtrip (zero lag/freeze)
    saveDraw(targetNumber, drawData);
    startSpinExecution(targetNumber, drawData);

    // Sync with Cloud Firestore in background during spin animation
    if (raffleDocRef) {
      raffleDocRef.set(drawData).then(() => {
        console.log('Sorteio gravado com sucesso no Cloud Firestore!');
      }).catch((err) => {
        console.warn('Aviso ao sincronizar no Firestore:', err);
      });
    }
  });

  function startSpinExecution(targetNumber, drawData) {
    btnSpin.disabled = true;
    btnSpin.innerHTML = '<span>⚡ GIRANDO... ⚡</span>';

    wheel.spinTo(targetNumber, () => {
      applyLockedState(drawData);
    });
  }

  // Allow clicking on HUD or spin container when locked to reopen the winner story modal
  const liveHud = document.getElementById('liveHud');
  if (liveHud) {
    liveHud.style.cursor = 'pointer';
    liveHud.addEventListener('click', () => {
      if (wheel.isLocked && latestWinnerNumber) {
        winnerBigNum.textContent = latestWinnerNumber < 10 ? `0${latestWinnerNumber}` : `${latestWinnerNumber}`;
        winnerModal.classList.add('active');
      }
    });
  }

  const spinActions = document.querySelector('.spin-actions');
  if (spinActions) {
    spinActions.addEventListener('click', () => {
      if (wheel.isLocked && latestWinnerNumber) {
        winnerBigNum.textContent = latestWinnerNumber < 10 ? `0${latestWinnerNumber}` : `${latestWinnerNumber}`;
        winnerModal.classList.add('active');
      }
    });
  }


  // 4. Winner Announcement & Celebration
  function handleWinnerAnnounce(num) {
    latestWinnerNumber = num;
    const formatted = num < 10 ? `0${num}` : `${num}`;

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

  // Modal Closures
  winnerCloseBtn.addEventListener('click', () => winnerModal.classList.remove('active'));
  btnNewSpin.addEventListener('click', () => winnerModal.classList.remove('active'));
  window.addEventListener('click', (e) => {
    if (e.target === winnerModal) winnerModal.classList.remove('active');
  });

  // 5. Instagram Story Card Generator (1080x1920 9:16)
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
    ctx.fillText('60 NÚMEROS • SORTEIO AO VIVO', 540, 520);

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

  // 6. Sound & Fullscreen Controls
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

  // 7. Floating Embers Background
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
    const count = window.innerWidth < 600 ? 14 : 26;

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
        pCtx.fill();
        pCtx.restore();
      });

      requestAnimationFrame(loop);
    }
    loop();
  }
});
