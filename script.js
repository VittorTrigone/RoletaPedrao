/**
 * Rossi Tattoo - Raffle Roulette Logic & State Management
 * Includes Particles FX, LocalStorage persistence, Wheel integration, and Instagram Story Card Generator
 */

document.addEventListener('DOMContentLoaded', () => {
  // ---------------------------------------------------------
  // 1. STATE & STORAGE
  // ---------------------------------------------------------
  const TOTAL_NUMBERS = 60;
  const STORAGE_KEY_PARTICIPANTS = 'rossi_tattoo_participants_v1';
  const STORAGE_KEY_WINNERS = 'rossi_tattoo_winners_v1';
  const STORAGE_KEY_SETTINGS = 'rossi_tattoo_settings_v1';

  let participants = loadParticipants();
  let winners = loadWinners();
  let activeEditNumber = null;

  // DOM Elements
  const rouletteCanvas = document.getElementById('rouletteCanvas');
  const btnSpin = document.getElementById('btnSpin');
  const hudNumber = document.getElementById('hudNumber');
  const hudParticipant = document.getElementById('hudParticipant');
  const numbersGrid = document.getElementById('numbersGrid');
  const boardCount = document.getElementById('boardCount');
  const onlySoldToggle = document.getElementById('onlySoldToggle');
  const excludeWinnersToggle = document.getElementById('excludeWinnersToggle');
  const historyList = document.getElementById('historyList');

  // Modals
  const participantModal = document.getElementById('participantModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalNumberBadge = document.getElementById('modalNumberBadge');
  const inputBuyerName = document.getElementById('inputBuyerName');
  const inputBuyerContact = document.getElementById('inputBuyerContact');
  const btnSaveParticipant = document.getElementById('btnSaveParticipant');
  const btnDeleteParticipant = document.getElementById('btnDeleteParticipant');
  const btnCancelParticipant = document.getElementById('btnCancelParticipant');

  // Winner Modal
  const winnerModal = document.getElementById('winnerModal');
  const winnerCloseBtn = document.getElementById('winnerCloseBtn');
  const winnerBigNum = document.getElementById('winnerBigNum');
  const winnerBuyerName = document.getElementById('winnerBuyerName');
  const winnerBuyerContact = document.getElementById('winnerBuyerContact');
  const btnDownloadStory = document.getElementById('btnDownloadStory');
  const btnNewSpin = document.getElementById('btnNewSpin');

  // Top Controls
  const btnSoundToggle = document.getElementById('btnSoundToggle');
  const btnFullscreen = document.getElementById('btnFullscreen');
  const btnFillDemo = document.getElementById('btnFillDemo');
  const btnClearAll = document.getElementById('btnClearAll');
  const btnInfo = document.getElementById('btnInfo');
  const infoModal = document.getElementById('infoModal');
  const infoCloseBtn = document.getElementById('infoCloseBtn');

  // ---------------------------------------------------------
  // 2. PARTICLES BACKGROUND FX (CANVAS)
  // ---------------------------------------------------------
  initParticlesCanvas();

  // ---------------------------------------------------------
  // 3. ROULETTE WHEEL INITIALIZATION
  // ---------------------------------------------------------
  const wheel = new RouletteWheel('rouletteCanvas', {
    totalNumbers: TOTAL_NUMBERS,
    participants: participants,
    onTick: (speedRatio) => {
      if (window.soundEngine) {
        window.soundEngine.playTick(speedRatio);
      }
    },
    onNumberPass: (num) => {
      // Update HUD in real time
      const formatted = num < 10 ? `0${num}` : `${num}`;
      hudNumber.textContent = formatted;
      const buyer = participants[num];
      hudParticipant.textContent = buyer ? `👤 ${buyer.name}` : 'Disponível';

      // Micro-highlight chip in grid
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

  // Render initial grid & winners
  renderBoard();
  renderWinners();

  // ---------------------------------------------------------
  // 4. SPIN EVENT HANDLER
  // ---------------------------------------------------------
  btnSpin.addEventListener('click', () => {
    if (wheel.isSpinning) return;

    // Determine candidate pool
    const onlySold = onlySoldToggle.checked;
    const excludeWinners = excludeWinnersToggle.checked;

    let pool = [];
    for (let i = 1; i <= TOTAL_NUMBERS; i++) {
      if (excludeWinners && winners.some(w => w.number === i)) {
        continue;
      }
      if (onlySold) {
        if (participants[i] && participants[i].name.trim() !== '') {
          pool.push(i);
        }
      } else {
        pool.push(i);
      }
    }

    if (pool.length === 0) {
      if (onlySold) {
        showToast('⚠️ Nenhum número comprado disponível para sorteio! Cadastre participantes ou desmarque a opção.');
      } else {
        showToast('⚠️ Todos os 60 números já foram sorteados! Limpe o histórico para recomeçar.');
      }
      return;
    }

    // Pick random winner from pool
    const randomIndex = Math.floor(Math.random() * pool.length);
    const targetNumber = pool[randomIndex];

    // Disable spin button during animation
    btnSpin.disabled = true;
    btnSpin.innerHTML = '<span>⚡ GIRANDO... ⚡</span>';

    // Start spin
    wheel.spinTo(targetNumber, () => {
      btnSpin.disabled = false;
      btnSpin.innerHTML = '<span>👑 GIRAR ROLETA 👑</span>';
    });
  });

  // ---------------------------------------------------------
  // 5. WINNER HANDLING & CONFETTI CELEBRATION
  // ---------------------------------------------------------
  let currentWinnerData = null;

  function handleWinnerAnnounce(num) {
    const formatted = num < 10 ? `0${num}` : `${num}`;
    const buyer = participants[num] || { name: 'Número Avulso', contact: 'Sem cadastro' };

    currentWinnerData = {
      number: num,
      formattedNumber: formatted,
      name: buyer.name,
      contact: buyer.contact || '@instagram',
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    // Save winner to history
    winners.unshift(currentWinnerData);
    saveWinners(winners);
    renderWinners();
    renderBoard();

    // Trigger Sound Fanfare
    if (window.soundEngine) {
      window.soundEngine.playWinnerFanfare();
    }

    // Canvas Confetti Explosion
    fireVictoryConfetti();

    // Fill and open celebration modal
    winnerBigNum.textContent = formatted;
    winnerBuyerName.textContent = buyer.name;
    winnerBuyerContact.textContent = buyer.contact || 'Participante';

    winnerModal.classList.add('active');
  }

  function fireVictoryConfetti() {
    if (typeof confetti === 'function') {
      const duration = 4.5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 35, spread: 360, ticks: 70, zIndex: 2000 };

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          return clearInterval(interval);
        }
        const particleCount = 50 * (timeLeft / duration);
        // Purple, Magenta, Gold, Silver colors
        confetti(Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.15, 0.35), y: Math.random() - 0.2 },
          colors: ['#a855f7', '#c084fc', '#e879f9', '#fbbf24', '#ffffff']
        }));
        confetti(Object.assign({}, defaults, {
          particleCount,
          origin: { x: randomInRange(0.65, 0.85), y: Math.random() - 0.2 },
          colors: ['#a855f7', '#c084fc', '#e879f9', '#fbbf24', '#ffffff']
        }));
      }, 250);
    }
  }

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  // ---------------------------------------------------------
  // 6. INSTAGRAM STORIES CARD GENERATOR (1080x1920 HD)
  // ---------------------------------------------------------
  btnDownloadStory.addEventListener('click', () => {
    if (!currentWinnerData) return;
    generateInstagramStoryCard(currentWinnerData);
  });

  function generateInstagramStoryCard(winner) {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');

    // 1. Dark Gradient Background with Smoke Vignette
    const bgGrad = ctx.createRadialGradient(540, 960, 100, 540, 960, 1000);
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

    // Header Studio Crowns
    ctx.font = '70px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('👑', 540, 220);

    // Header Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px Montserrat, sans-serif';
    ctx.letterSpacing = '4px';
    ctx.fillText('VOCÊ ESCOLHE A TATTOO!', 540, 310);

    // Main Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 96px Montserrat, sans-serif';
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = 30;
    ctx.fillText('RIFA TATTOO', 540, 430);
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.fillStyle = '#d8b4fe';
    ctx.font = 'bold 36px Montserrat, sans-serif';
    ctx.fillText('SORTE + ARTE = TATTOO NOVA', 540, 500);

    // Giant Winner Badge Circle
    const badgeY = 820;
    ctx.save();
    ctx.beginPath();
    ctx.arc(540, badgeY, 210, 0, Math.PI * 2);
    const circleGrad = ctx.createLinearGradient(330, 610, 750, 1030);
    circleGrad.addColorStop(0, '#fbbf24');
    circleGrad.addColorStop(0.5, '#d97706');
    circleGrad.addColorStop(1, '#78350f');
    ctx.fillStyle = circleGrad;
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 60;
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 12;
    ctx.stroke();
    ctx.restore();

    // Badge Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Montserrat, sans-serif';
    ctx.fillText('NÚMERO SORTEADO', 540, 710);

    // Number
    ctx.fillStyle = '#0f051d';
    ctx.font = 'bold 160px Montserrat, sans-serif';
    ctx.fillText(winner.formattedNumber, 540, 875);

    // Winner Name Box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.6)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(140, 1120, 800, 220, 24);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 32px Montserrat, sans-serif';
    ctx.fillText('GANHADOR(A):', 540, 1180);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 54px Montserrat, sans-serif';
    ctx.fillText(winner.name, 540, 1250);

    if (winner.contact) {
      ctx.fillStyle = '#d8b4fe';
      ctx.font = '32px Montserrat, sans-serif';
      ctx.fillText(winner.contact, 540, 1305);
    }

    // Prize Banner
    ctx.fillStyle = '#e879f9';
    ctx.font = 'bold 42px Montserrat, sans-serif';
    ctx.shadowColor = '#d946ef';
    ctx.shadowBlur = 20;
    ctx.fillText('PRÊMIO: 1 TATTOO DA SUA ESCOLHA', 540, 1460);
    ctx.shadowBlur = 0;

    // Footer Signature
    ctx.font = '60px sans-serif';
    ctx.fillText('👑', 360, 1680);
    ctx.fillText('👑', 720, 1680);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic bold 64px Montserrat, sans-serif';
    ctx.fillText('Rossi.tattoo', 540, 1685);

    ctx.fillStyle = '#a855f7';
    ctx.font = '26px Montserrat, sans-serif';
    ctx.fillText('SORTEIO OFICIAL REALIZADO AO VIVO', 540, 1750);

    // Download Image
    const link = document.createElement('a');
    link.download = `ganhador-rifa-tattoo-${winner.formattedNumber}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  // ---------------------------------------------------------
  // 7. BOARD RENDERING & PARTICIPANT MODAL
  // ---------------------------------------------------------
  function renderBoard() {
    numbersGrid.innerHTML = '';
    let soldCount = 0;

    for (let i = 1; i <= TOTAL_NUMBERS; i++) {
      const formatted = i < 10 ? `0${i}` : `${i}`;
      const buyer = participants[i];
      const isWinner = winners.some(w => w.number === i);

      const chip = document.createElement('div');
      chip.className = 'number-chip';
      chip.dataset.num = i;

      if (buyer && buyer.name.trim() !== '') {
        chip.classList.add('sold');
        chip.title = `${formatted} - ${buyer.name} (${buyer.contact || 'Sem contato'})`;
        soldCount++;
      }

      if (isWinner) {
        chip.classList.add('winner');
      }

      chip.innerHTML = `
        <span class="num-text">${formatted}</span>
        <span class="buyer-dot"></span>
      `;

      chip.addEventListener('click', () => {
        openParticipantModal(i);
      });

      numbersGrid.appendChild(chip);
    }

    boardCount.textContent = `${soldCount} / ${TOTAL_NUMBERS}`;
    wheel.setParticipants(participants);
  }

  function openParticipantModal(num) {
    activeEditNumber = num;
    const formatted = num < 10 ? `0${num}` : `${num}`;
    modalNumberBadge.textContent = `NÚMERO ${formatted}`;

    const data = participants[num] || { name: '', contact: '' };
    inputBuyerName.value = data.name || '';
    inputBuyerContact.value = data.contact || '';

    participantModal.classList.add('active');
    setTimeout(() => inputBuyerName.focus(), 100);
  }

  function closeParticipantModal() {
    participantModal.classList.remove('active');
    activeEditNumber = null;
  }

  btnSaveParticipant.addEventListener('click', () => {
    if (!activeEditNumber) return;
    const name = inputBuyerName.value.trim();
    const contact = inputBuyerContact.value.trim();

    if (name) {
      participants[activeEditNumber] = { name, contact };
    } else {
      delete participants[activeEditNumber];
    }

    saveParticipants(participants);
    renderBoard();
    closeParticipantModal();
  });

  btnDeleteParticipant.addEventListener('click', () => {
    if (!activeEditNumber) return;
    delete participants[activeEditNumber];
    saveParticipants(participants);
    renderBoard();
    closeParticipantModal();
  });

  btnCancelParticipant.addEventListener('click', closeParticipantModal);
  modalCloseBtn.addEventListener('click', closeParticipantModal);

  // Winner modal close
  winnerCloseBtn.addEventListener('click', () => winnerModal.classList.remove('active'));
  btnNewSpin.addEventListener('click', () => winnerModal.classList.remove('active'));

  // Info modal
  btnInfo.addEventListener('click', () => infoModal.classList.add('active'));
  infoCloseBtn.addEventListener('click', () => infoModal.classList.remove('active'));

  // Close modals on backdrop click
  window.addEventListener('click', (e) => {
    if (e.target === participantModal) closeParticipantModal();
    if (e.target === winnerModal) winnerModal.classList.remove('active');
    if (e.target === infoModal) infoModal.classList.remove('active');
  });

  // ---------------------------------------------------------
  // 8. WINNER HISTORY RENDERING
  // ---------------------------------------------------------
  function renderWinners() {
    historyList.innerHTML = '';
    if (winners.length === 0) {
      historyList.innerHTML = '<p style="color: var(--text-dim); font-size: 0.82rem;">Nenhum sorteio realizado ainda nesta sessão.</p>';
      return;
    }

    winners.forEach((win) => {
      const card = document.createElement('div');
      card.className = 'history-card';
      card.innerHTML = `
        <div class="win-num">${win.formattedNumber}</div>
        <div class="win-info">
          <span class="win-name">${win.name}</span>
          <span class="win-time">Sorteado às ${win.timestamp}</span>
        </div>
      `;
      historyList.appendChild(card);
    });
  }

  // ---------------------------------------------------------
  // 9. QUICK ACTIONS (DEMO FILL & CLEAR)
  // ---------------------------------------------------------
  btnFillDemo.addEventListener('click', () => {
    const demoNames = [
      'Amanda Rocha', 'Lucas Silveira', 'Gabriel Tattoo', 'Juliana Lima',
      'Matheus Rossi', 'Beatriz Costa', 'Felipe Santos', 'Larissa Mendes',
      'Thiago Oliveira', 'Camila Ribeiro', 'Rodrigo Souza', 'Vanessa Martins',
      'Bruna Fernandes', 'Diego Alves', 'Rafaela Lima', 'Caio Henrique',
      'Fernanda Dias', 'Vinicius Castro', 'Mariana Freitas', 'Leonardo Pires',
      'Jessica Ramos', 'Renan Duarte', 'Patricia Gomes', 'Arthur Barbosa',
      'Sabrina Vieira', 'Guilherme Silva', 'Heloisa Toledo', 'Murilo Cunha',
      'Leticia Borges', 'Danilo Neves', 'Bianca Farias', 'Igor Monteiro',
      'Carolina Melo', 'Eduardo Correa', 'Natalia Xavier', 'Bruno Cardoso',
      'Tatiane Nogueira', 'Andre Peixoto', 'Priscila Gusmão', 'Samuel Lopes'
    ];

    for (let i = 1; i <= 40; i++) {
      participants[i] = {
        name: demoNames[i - 1],
        contact: `@${demoNames[i - 1].toLowerCase().replace(/\s+/g, '.')}`
      };
    }
    saveParticipants(participants);
    renderBoard();
    showToast('40 participantes carregados para teste! 👑');
  });

  btnClearAll.addEventListener('click', () => {
    participants = {};
    winners = [];
    saveParticipants(participants);
    saveWinners(winners);
    renderBoard();
    renderWinners();
    showToast('Tabela de participantes e histórico limpos! 🗑️');
  });

  // Toast Notification Helper
  function showToast(message, duration = 3200) {
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

  // ---------------------------------------------------------
  // 10. SOUND & FULLSCREEN TOGGLE
  // ---------------------------------------------------------
  btnSoundToggle.addEventListener('click', () => {
    if (window.soundEngine) {
      const isMuted = window.soundEngine.toggleMute();
      btnSoundToggle.innerHTML = isMuted ? '🔇' : '🔊';
      btnSoundToggle.title = isMuted ? 'Ativar Som' : 'Silenciar';
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

  // ---------------------------------------------------------
  // 11. LOCALSTORAGE HELPERS
  // ---------------------------------------------------------
  function loadParticipants() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_PARTICIPANTS);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }

  function saveParticipants(data) {
    try {
      localStorage.setItem(STORAGE_KEY_PARTICIPANTS, JSON.stringify(data));
    } catch (e) {}
  }

  function loadWinners() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_WINNERS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveWinners(data) {
    try {
      localStorage.setItem(STORAGE_KEY_WINNERS, JSON.stringify(data));
    } catch (e) {}
  }

  // ---------------------------------------------------------
  // 12. CANVAS PARTICLES & PURPLE EMBERS
  // ---------------------------------------------------------
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
    const count = 38;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * pWidth,
        y: Math.random() * pHeight,
        radius: Math.random() * 2.2 + 0.8,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -Math.random() * 0.7 - 0.2,
        alpha: Math.random() * 0.6 + 0.2,
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
