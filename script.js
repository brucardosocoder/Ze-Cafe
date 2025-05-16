const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let fase = 1;
const maxFase = 5;
let vidas = 5;
let tempoRestante = 15;
let gameOver = false;

const zecafe = {
  x: canvas.width / 2,
  y: canvas.height - 120,
  width: 120,
  height: 120
};

let cafes = [];
let xicaras = [];

// Sons do jogo (HTML)
const dropSound = document.getElementById("dropSound");
const winSound = document.getElementById("winSound");
const zegoleSound = document.getElementById("zegoleSound");
const vitoriaSound = document.getElementById("vitoriaSound");
const inicioSound = document.getElementById("inicioSound");
const zechoroSound = document.getElementById("zechoroSound");
const loseSound = document.getElementById("loseSound");

// Sons por fase (dinâmicos)
const phaseSounds = [
  new Audio("assets/sounds/jogofase1.mp3"),
  new Audio("assets/sounds/jogofase2.mp3"),
  new Audio("assets/sounds/jogofase3.mp3"),
  new Audio("assets/sounds/jogofase4.mp3"),
  new Audio("assets/sounds/jogofase5.mp3")
];

let currentPhaseSound = null;
let isMuted = localStorage.getItem("muted") === "true" || false;

// Carrega as imagens do Zé
const imgZeNormal = new Image();
imgZeNormal.src = "assets/images/zecafe.png";

const imgZeBoca = new Image();
imgZeBoca.src = "assets/images/zecafeboca.png";

const imgZeChoro = new Image();
imgZeChoro.src = "assets/images/zecafechoro.png";

let imgZeAtual = imgZeNormal;

// Carrega as imagens das xícaras e gotas
const imgXicara = new Image();
imgXicara.src = "assets/images/xicaracafeasset.png";

const imgGota = new Image();
imgGota.src = "assets/images/gotaasset.png";

let imagensCarregadas = false;

// Garante que todas as imagens carreguem antes do jogo iniciar
imgZeNormal.onload = () => {
  imgZeBoca.onload = () => {
    imgZeChoro.onload = () => {
      imgXicara.onload = () => {
        imgGota.onload = () => {
          imagensCarregadas = true;
          console.log("Todas as imagens carregadas!");
        };
        imgGota.onerror = () => console.error("Erro ao carregar gotaasset.png");
      };
      imgXicara.onerror = () => console.error("Erro ao carregar xicaracafeasset.png");
    };
    imgZeChoro.onerror = () => console.error("Erro ao carregar zecafechoro.png");
  };
  imgZeBoca.onerror = () => console.error("Erro ao carregar zecafeboca.png");
};
imgZeNormal.onerror = () => console.error("Erro ao carregar zecafe.png");

function resetXicaras() {
  xicaras = [];
  const numXicaras = fase * 2 + 1;
  const spacing = canvas.width / (numXicaras + 1);
  for (let i = 0; i < numXicaras; i++) {
    xicaras.push({
      x: spacing * (i + 1),
      y: 50,
      width: 40,
      height: 40
    });
  }
}

function showPhaseMessage(phase) {
  const msg = document.getElementById("phaseMessage");
  if (msg) {
    msg.textContent = `Fase ${phase}`;
    msg.style.opacity = 1;
    setTimeout(() => {
      msg.style.opacity = 0;
    }, 1500);
  }
}

function desenharZecafe() {
  if (!imagensCarregadas) return;
  ctx.drawImage(imgZeAtual, zecafe.x, zecafe.y, zecafe.width, zecafe.height);
}

function desenharXicaras() {
  if (!imagensCarregadas) return;
  for (let x of xicaras) {
    ctx.drawImage(imgXicara, x.x - 20, x.y - 20, 40, 40);
  }
}

function gerarCafe() {
  if (Math.random() < 0.009 + fase * 0.003) {
    const xicara = xicaras[Math.floor(Math.random() * xicaras.length)];
    if (xicara) {
      cafes.push({
        x: xicara.x,
        y: xicara.y + 20,
        radius: 10,
        speed: 1.5 + fase * 0.5
      });
    }
  }
}

function desenharCafes() {
  if (!imagensCarregadas) return;

  for (let i = 0; i < cafes.length; i++) {
    const c = cafes[i];
    ctx.drawImage(imgGota, c.x - c.radius, c.y - c.radius, c.radius * 2, c.radius * 2);
    c.y += c.speed;

    // Colisão com o chão
    if (c.y > canvas.height) {
      vidas--;
      try {
        zechoroSound.play();
      } catch (e) {}

      imgZeAtual = imgZeChoro;
      setTimeout(() => {
        imgZeAtual = imgZeNormal;
      }, 500);

      // Verifica se perdeu todas as vidas
      if (vidas <= 0) {
        gameOver = true;
        document.getElementById("gameOverText").innerText = "Você perdeu todas as vidas!";
        document.getElementById("gameOverScreen").style.display = "block";

        // Para música da fase atual
        if (currentPhaseSound && !currentPhaseSound.paused) {
          currentPhaseSound.pause();
          currentPhaseSound.currentTime = 0;
        }

        // Toca som de derrota
        try {
          loseSound.currentTime = 0;
          loseSound.play();
        } catch (e) {}
      } else {
        // Reinicia a fase
        fase = 1;
        tempoRestante = 15;
        resetXicaras();
        showPhaseMessage(fase);
        playPhaseSound(0); // Reinicia música da fase 1
      }

      cafes.splice(i, 1);
      i--;
    }

    // Colisão com o Zé
    else if (
      c.y + c.radius >= zecafe.y &&
      c.x > zecafe.x && c.x < zecafe.x + zecafe.width
    ) {
      imgZeAtual = imgZeBoca;
      setTimeout(() => {
        imgZeAtual = imgZeNormal;
      }, 100);

      try {
        zegoleSound.play();
      } catch (e) {}

      cafes.splice(i, 1);
      i--;
    }
  }
}

function mostrarHUD() {
  ctx.fillStyle = '#000';
  ctx.font = '20px sans-serif';

  // Atualiza o texto do HUD
  document.getElementById("hudVidas").textContent = `Vidas: ${Math.max(0, vidas)}`;
  document.getElementById("hudFase").textContent = `Fase: ${fase}`;
  document.getElementById("hudTempo").textContent = `Tempo: ${tempoRestante.toFixed(1)}s`;
}

// Controle por botões
let movingLeft = false;
let movingRight = false;

document.getElementById("leftBtn")?.addEventListener("touchstart", () => movingLeft = true);
document.getElementById("leftBtn")?.addEventListener("touchend", () => movingLeft = false);
document.getElementById("rightBtn")?.addEventListener("touchstart", () => movingRight = true);
document.getElementById("rightBtn")?.addEventListener("touchend", () => movingRight = false);

// Controle por teclado
window.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") movingLeft = true;
  if (e.key === "ArrowRight") movingRight = true;
});
window.addEventListener("keyup", e => {
  if (e.key === "ArrowLeft") movingLeft = false;
  if (e.key === "ArrowRight") movingRight = false;
});

function updatePlayer() {
  if (movingLeft) zecafe.x -= 5;
  if (movingRight) zecafe.x += 5;
  zecafe.x = Math.max(0, Math.min(canvas.width - zecafe.width, zecafe.x));
}

const splashScreen = document.getElementById("splashScreen");

function showRules() {
  document.getElementById("splashScreen").style.display = "none";
  document.getElementById("rulesOverlay").style.display = "block";
  document.getElementById("rulesScreen").style.display = "block";

  // ✅ Garante que outros sons parem
  if (loseSound && !loseSound.paused) {
    loseSound.pause();
    loseSound.currentTime = 0;
  }

  if (currentPhaseSound && !currentPhaseSound.paused) {
    currentPhaseSound.pause();
    currentPhaseSound.currentTime = 0;
  }

  // ✅ Reinicia e toca som da tela inicial apenas uma vez
  try {
    inicioSound.currentTime = 0;
    if (!isMuted) inicioSound.play();
  } catch (e) {}
}

function startGame() {
  // ✅ Para e reinicia o som de início
  if (inicioSound && !inicioSound.paused) {
    inicioSound.pause();
    inicioSound.currentTime = 0;
  }

  // ✅ Para música da fase anterior (se estiver tocando)
  if (currentPhaseSound && !currentPhaseSound.paused) {
    currentPhaseSound.pause();
    currentPhaseSound.currentTime = 0;
  }

  // ✅ Para som de derrota (se estiver tocando)
  if (loseSound && !loseSound.paused) {
    loseSound.pause();
    loseSound.currentTime = 0;
  }

  // Reinicia variáveis do jogo
  fase = 1;
  vidas = 5;
  tempoRestante = 15;
  gameOver = false;

  zecafe.x = canvas.width / 2;
  resetXicaras();
  cafes = [];

  // Oculta telas
  document.getElementById("gameOverScreen").style.display = "none";
  document.getElementById("rulesScreen").style.display = "none";
  document.getElementById("rulesOverlay").style.display = "none";
  splashScreen.style.display = "none";

  // Toca música da fase 1
  playPhaseSound(fase - 1); // Fase 1 = índice 0

  lastFrameTime = performance.now();
  requestAnimationFrame(gameLoop);
  showPhaseMessage(fase);
}

function gameLoop(timestamp) {
  if (gameOver) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  updatePlayer();
  gerarCafe();
  desenharXicaras();
  if (imagensCarregadas) desenharZecafe();
  desenharCafes();
  mostrarHUD();

  const deltaTime = timestamp - lastFrameTime;
  tempoRestante -= deltaTime / 1000;
  lastFrameTime = timestamp;

  if (tempoRestante <= 0) {
    if (fase < maxFase) {
      fase++;
      tempoRestante = 15;
      resetXicaras();
      showPhaseMessage(fase);
      playPhaseSound(fase - 1); // Toca música da nova fase
      try {
        winSound.play();
      } catch (e) {}
    } else {
      gameOver = true;
      try {
        if (currentPhaseSound) {
          currentPhaseSound.pause();
          currentPhaseSound.currentTime = 0;
        }
        vitoriaSound.play();
      } catch (e) {}
      document.getElementById("gameOverText").innerText = "Parabéns! Você é Gourmet 100% Arábica!";
      document.getElementById("gameOverScreen").style.display = "block";
    }
  }

  requestAnimationFrame(gameLoop);
}

// Função de mute atualizada
function toggleMute() {
  isMuted = !isMuted;
  localStorage.setItem("muted", isMuted);

  const audios = [
    dropSound, winSound, zegoleSound,
    vitoriaSound, inicioSound, zechoroSound,
    loseSound, ...phaseSounds
  ];

  audios.forEach(audio => {
    if (audio) {
      audio.muted = isMuted;
      if (isMuted) audio.pause();
    }
  });

  // Se desmutado e jogo em andamento, reinicia música da fase atual
  if (!isMuted && fase > 0 && fase <= maxFase && !gameOver) {
    playPhaseSound(fase - 1);
  }

  updateMuteButtonIcon();
}

function updateMuteButtonIcon() {
  const btn = document.getElementById("muteBtn");
  if (btn) {
    btn.innerHTML = isMuted ? "&#128263;" : "&#128266;";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateMuteButtonIcon();
});

document.getElementById("muteBtn")?.addEventListener("click", () => {
  toggleMute();
});

// Toca música por fase
function playPhaseSound(phaseIndex) {
  if (currentPhaseSound) {
    currentPhaseSound.pause();
    currentPhaseSound.currentTime = 0;
  }

  const sound = phaseSounds[phaseIndex];
  if (sound) {
    sound.loop = true;
    sound.volume = isMuted ? 0 : 1;
    sound.currentTime = 0;
    sound.play().catch(() => {});
    currentPhaseSound = sound;
  }
}
