const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Variáveis do jogo original
let fase = 1;
const maxFase = 5;
let vidas = 5;
const MAX_VIDAS = 5; // Constante para limitar o número máximo de vidas
let tempoRestante = 15;
let gameOver = false;

// Metas de pontuação para cada fase
const PONTOS_FASE = [
  0,      // Não usado (índice 0)
  1000,   // Fase 1: 1000 pontos
  2000,   // Fase 2: 2000 pontos
  3000,   // Fase 3: 3000 pontos
  4000,   // Fase 4: 4000 pontos
  0       // Fase 5: baseada em tempo (até o tempo acabar)
];

// Cores de fundo para cada fase
const coresFases = [
  '#f5f0e1', // Fase 1 - Cor original
  '#f0e8d5', // Fase 2 - Um pouco mais escura
  '#e8dfc8', // Fase 3 - Mais escura ainda
  '#e0d6bb', // Fase 4 - Ainda mais escura
  '#d8cdae'  // Fase 5 - A mais escura
];

// Novas variáveis para melhorias
let pontuacao = 0;
let comboAtual = 0;
let multiplicadorCombo = 1;
let highScores = [];
let conquistas = {};
let efeitosAtivos = {
  tempoExtra: false,
  vidaExtra: false,
  velocidade: false,
  xicaraMaior: false,
  ima: false
};

// Variáveis para controle de power-ups
let vidaExtraGeradaNaFase = false; // Controla se já foi gerada uma vida extra na fase atual

// Constantes para as novas funcionalidades
const PONTOS_POR_GOTA = 10;
const COMBO_THRESHOLD = 3; // Número de gotas para ativar o combo
const MAX_HIGH_SCORES = 5;
const CHANCE_POWERUP_TEMPO = 0.1; // 10% de chance de gerar power-up de tempo nos últimos 5 segundos
const CHANCE_POWERUP_VIDA = 0.05; // 5% de chance de gerar power-up de vida quando tiver 1 vida
const COOLDOWN_POWERUP = 3000; // Cooldown de 3 segundos entre geração de power-ups
let ultimoPowerUpGerado = 0; // Timestamp do último power-up gerado

const zecafe = {
  x: canvas.width / 2,
  y: canvas.height - 120,
  width: 120,
  height: 120,
  velocidadeBase: 5,
  velocidadeAtual: 5
};

let cafes = [];
let xicaras = [];
let powerUps = [];
let efeitosVisuais = [];

// Sons do jogo (HTML)
const dropSound = document.getElementById("dropSound");
const winSound = document.getElementById("winSound");
const zegoleSound = document.getElementById("zegoleSound");
const vitoriaSound = document.getElementById("vitoriaSound");
const inicioSound = document.getElementById("inicioSound");
const zechoroSound = document.getElementById("zechoroSound");
const loseSound = document.getElementById("loseSound");
const comboSound = document.getElementById("comboSound");
const powerupSound = document.getElementById("powerupSound");

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

// Imagens para power-ups
const imgTempoExtra = new Image();
imgTempoExtra.src = "assets/images/tempo_extra.png";

const imgVidaExtra = new Image();
imgVidaExtra.src = "assets/images/vida_extra.png";

let imagensCarregadas = false;
let imagensContador = 0;
const totalImagens = 7; // Aumentado para incluir novas imagens

// Função para verificar se todas as imagens foram carregadas
function verificarCarregamentoImagens() {
  imagensContador++;
  if (imagensContador >= totalImagens) {
    imagensCarregadas = true;
    console.log("Todas as imagens carregadas!");
  }
}

// Garante que todas as imagens carreguem antes do jogo iniciar
imgZeNormal.onload = verificarCarregamentoImagens;
imgZeBoca.onload = verificarCarregamentoImagens;
imgZeChoro.onload = verificarCarregamentoImagens;
imgXicara.onload = verificarCarregamentoImagens;
imgGota.onload = verificarCarregamentoImagens;
imgTempoExtra.onload = verificarCarregamentoImagens;
imgVidaExtra.onload = verificarCarregamentoImagens;

// Tratamento de erros de carregamento
imgZeNormal.onerror = () => console.error("Erro ao carregar zecafe.png");
imgZeBoca.onerror = () => console.error("Erro ao carregar zecafeboca.png");
imgZeChoro.onerror = () => console.error("Erro ao carregar zecafechoro.png");
imgXicara.onerror = () => console.error("Erro ao carregar xicaracafeasset.png");
imgGota.onerror = () => console.error("Erro ao carregar gotaasset.png");
imgTempoExtra.onerror = () => console.error("Erro ao carregar tempo_extra.png");
imgVidaExtra.onerror = () => console.error("Erro ao carregar vida_extra.png");

// Forçar recarregamento das imagens para garantir que sejam carregadas
function recarregarImagens() {
  imagensCarregadas = false;
  imagensContador = 0;
  
  imgZeNormal.src = imgZeNormal.src + "?t=" + new Date().getTime();
  imgZeBoca.src = imgZeBoca.src + "?t=" + new Date().getTime();
  imgZeChoro.src = imgZeChoro.src + "?t=" + new Date().getTime();
  imgXicara.src = imgXicara.src + "?t=" + new Date().getTime();
  imgGota.src = imgGota.src + "?t=" + new Date().getTime();
  imgTempoExtra.src = imgTempoExtra.src + "?t=" + new Date().getTime();
  imgVidaExtra.src = imgVidaExtra.src + "?t=" + new Date().getTime();
}

// Funções para o sistema de pontuação
function adicionarPontos(pontos) {
  const pontosComMultiplicador = pontos * multiplicadorCombo;
  pontuacao += pontosComMultiplicador;
  atualizarHUDPontuacao();
  mostrarMensagemPontuacao(pontosComMultiplicador);
  
  // Verificar se atingiu a meta de pontos para avançar de fase (exceto na fase 5)
  if (fase < 5 && pontuacao >= PONTOS_FASE[fase]) {
    avancarFase();
  }
}

function atualizarHUDPontuacao() {
  document.getElementById("hudPontos").textContent = `Pontos: ${pontuacao}`;
}

function mostrarMensagemPontuacao(pontos) {
  const scoreMsg = document.getElementById("scoreMessage");
  scoreMsg.textContent = `+${pontos}`;
  scoreMsg.style.opacity = 1;
  
  // Posicionar a mensagem próxima ao Zé
  scoreMsg.style.left = `${zecafe.x + zecafe.width/2}px`;
  scoreMsg.style.top = `${zecafe.y - 20}px`;
  
  setTimeout(() => {
    scoreMsg.style.opacity = 0;
  }, 1000);
}

// Função para avançar para a próxima fase
function avancarFase() {
  fase++;
  vidaExtraGeradaNaFase = false; // Reset do controle de vida extra para a nova fase
  tempoRestante = 15;
  resetXicaras();
  showPhaseMessage(fase);
  playPhaseSound(fase - 1); // Toca música da nova fase
  
  try {
    winSound.play();
  } catch (e) {}
  
  // Verificar conquistas
  verificarConquistas();
}

// Funções para o sistema de combos
function incrementarCombo() {
  comboAtual++;
  
  if (comboAtual >= COMBO_THRESHOLD) {
    multiplicadorCombo = Math.floor(comboAtual / COMBO_THRESHOLD) + 1;
    multiplicadorCombo = Math.min(multiplicadorCombo, 5); // Limita o multiplicador a 5x
    
    document.getElementById("comboContainer").style.display = "block";
    document.getElementById("hudCombo").textContent = `Combo: x${multiplicadorCombo}`;
    
    // Efeito visual de combo
    if (comboAtual % COMBO_THRESHOLD === 0) {
      mostrarMensagemCombo();
      try {
        comboSound.play();
      } catch (e) {}
    }
  }
}

function resetarCombo() {
  comboAtual = 0;
  multiplicadorCombo = 1;
  document.getElementById("comboContainer").style.display = "none";
}

function mostrarMensagemCombo() {
  const comboMsg = document.getElementById("comboMessage");
  comboMsg.textContent = `COMBO x${multiplicadorCombo}!`;
  comboMsg.style.opacity = 1;
  
  // Adicionar efeito visual
  comboMsg.style.fontSize = `${20 + multiplicadorCombo * 2}px`;
  
  setTimeout(() => {
    comboMsg.style.opacity = 0;
  }, 1500);
}

// Funções para power-ups
function gerarPowerUp() {
  const agora = Date.now();
  
  // Verificar se passou o tempo de cooldown desde o último power-up
  if (agora - ultimoPowerUpGerado < COOLDOWN_POWERUP) {
    return;
  }
  
  // Lógica para gerar power-up de tempo extra
  // Apenas nos últimos 5 segundos de cada fase
  if (tempoRestante <= 5 && Math.random() < CHANCE_POWERUP_TEMPO) {
    const xicara = xicaras[Math.floor(Math.random() * xicaras.length)];
    
    if (xicara) {
      powerUps.push({
        x: xicara.x,
        y: xicara.y + 20,
        radius: 15,
        speed: 1.5 + fase * 0.3,
        tipo: 'tempoExtra'
      });
      
      ultimoPowerUpGerado = agora;
    }
  }
  
  // Lógica para gerar power-up de vida extra
  // Apenas uma vez por fase e somente quando o jogador tem 1 vida
  if (vidas === 1 && !vidaExtraGeradaNaFase && Math.random() < CHANCE_POWERUP_VIDA) {
    const xicara = xicaras[Math.floor(Math.random() * xicaras.length)];
    
    if (xicara) {
      powerUps.push({
        x: xicara.x,
        y: xicara.y + 20,
        radius: 15,
        speed: 1.5 + fase * 0.3,
        tipo: 'vidaExtra'
      });
      
      vidaExtraGeradaNaFase = true;
      ultimoPowerUpGerado = agora;
    }
  }
}

function desenharPowerUps() {
  for (let i = 0; i < powerUps.length; i++) {
    const p = powerUps[i];
    
    // Escolher a imagem correta com base no tipo
    const img = p.tipo === 'tempoExtra' ? imgTempoExtra : imgVidaExtra;
    ctx.drawImage(img, p.x - p.radius, p.y - p.radius, p.radius * 2, p.radius * 2);
    
    p.y += p.speed;
    
    // Colisão com o chão
    if (p.y > canvas.height) {
      powerUps.splice(i, 1);
      i--;
      continue;
    }
    
    // Colisão com o Zé
    if (
      p.y + p.radius > zecafe.y &&
      p.x > zecafe.x &&
      p.x < zecafe.x + zecafe.width
    ) {
      ativarPowerUp(p.tipo);
      powerUps.splice(i, 1);
      i--;
      
      try {
        powerupSound.play();
      } catch (e) {}
      
      // Efeito visual
      adicionarEfeitoVisual(p.x, p.y, p.tipo);
    }
  }
}

function ativarPowerUp(tipo) {
  switch (tipo) {
    case 'tempoExtra':
      tempoRestante += 5;
      efeitosAtivos.tempoExtra = true;
      mostrarMensagemPowerUp("Tempo +5s!");
      setTimeout(() => { efeitosAtivos.tempoExtra = false; }, 5000);
      break;
    case 'vidaExtra':
      // Limitar o número máximo de vidas
      if (vidas < MAX_VIDAS) {
        vidas++;
        efeitosAtivos.vidaExtra = true;
        mostrarMensagemPowerUp("Vida Extra!");
        setTimeout(() => { efeitosAtivos.vidaExtra = false; }, 5000);
      } else {
        // Se já tem o máximo de vidas, dar pontos extras em vez de vida
        adicionarPontos(50);
        mostrarMensagemPowerUp("Pontos Extras!");
      }
      break;
  }
  
  mostrarHUD();
  verificarConquistas();
}

function mostrarMensagemPowerUp(texto) {
  const scoreMsg = document.getElementById("scoreMessage");
  scoreMsg.textContent = texto;
  scoreMsg.style.opacity = 1;
  scoreMsg.style.color = "#ffcc00";
  
  // Posicionar a mensagem próxima ao Zé
  scoreMsg.style.left = `${zecafe.x + zecafe.width/2}px`;
  scoreMsg.style.top = `${zecafe.y - 40}px`;
  
  setTimeout(() => {
    scoreMsg.style.opacity = 0;
    scoreMsg.style.color = "#ffffff";
  }, 1500);
}

// Efeitos visuais
function adicionarEfeitoVisual(x, y, tipo) {
  const cor = tipo === 'tempoExtra' ? '#00ffff' : '#ff00ff';
  
  efeitosVisuais.push({
    x: x,
    y: y,
    radius: 5,
    maxRadius: 30,
    cor: cor,
    alpha: 1
  });
}

function atualizarEfeitosVisuais() {
  for (let i = 0; i < efeitosVisuais.length; i++) {
    const efeito = efeitosVisuais[i];
    
    ctx.beginPath();
    ctx.arc(efeito.x, efeito.y, efeito.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${hexToRgb(efeito.cor)}, ${efeito.alpha})`;
    ctx.fill();
    
    efeito.radius += 1;
    efeito.alpha -= 0.02;
    
    if (efeito.alpha <= 0 || efeito.radius >= efeito.maxRadius) {
      efeitosVisuais.splice(i, 1);
      i--;
    }
  }
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

// Sistema de high scores
function carregarHighScores() {
  const scoresJSON = localStorage.getItem('zeCafeHighScores');
  if (scoresJSON) {
    highScores = JSON.parse(scoresJSON);
  } else {
    highScores = [];
  }
}

function salvarHighScore() {
  if (pontuacao > 0) {
    const novoScore = {
      pontuacao: pontuacao,
      data: new Date().toLocaleDateString()
    };
    
    highScores.push(novoScore);
    highScores.sort((a, b) => b.pontuacao - a.pontuacao);
    
    if (highScores.length > MAX_HIGH_SCORES) {
      highScores = highScores.slice(0, MAX_HIGH_SCORES);
    }
    
    localStorage.setItem('zeCafeHighScores', JSON.stringify(highScores));
  }
}

function exibirHighScores() {
  const tbody = document.getElementById("highScoresBody");
  tbody.innerHTML = '';
  
  highScores.forEach((score, index) => {
    const row = document.createElement('tr');
    
    const posCell = document.createElement('td');
    posCell.textContent = index + 1;
    
    const scoreCell = document.createElement('td');
    scoreCell.textContent = score.pontuacao;
    
    const dateCell = document.createElement('td');
    dateCell.textContent = score.data;
    
    row.appendChild(posCell);
    row.appendChild(scoreCell);
    row.appendChild(dateCell);
    
    tbody.appendChild(row);
  });
  
  document.getElementById("finalScore").textContent = `Pontuação Final: ${pontuacao}`;
}

// Sistema de conquistas
function inicializarConquistas() {
  const conquistasJSON = localStorage.getItem('zeCafeConquistas');
  if (conquistasJSON) {
    conquistas = JSON.parse(conquistasJSON);
  } else {
    conquistas = {
      primeirosCem: false,
      milPontos: false,
      comboMestre: false,
      colecionadorPowerUps: false,
      sobrevivente: false
    };
  }
}

function verificarConquistas() {
  // Primeiros 100 pontos
  if (!conquistas.primeirosCem && pontuacao >= 100) {
    conquistas.primeirosCem = true;
    mostrarConquista("Iniciante Cafeinado", "Alcançou 100 pontos!");
  }
  
  // 1000 pontos
  if (!conquistas.milPontos && pontuacao >= 1000) {
    conquistas.milPontos = true;
    mostrarConquista("Barista Profissional", "Alcançou 1000 pontos!");
  }
  
  // Combo x5
  if (!conquistas.comboMestre && multiplicadorCombo >= 5) {
    conquistas.comboMestre = true;
    mostrarConquista("Mestre dos Combos", "Alcançou um combo x5!");
  }
  
  // Colecionador de Power-ups
  if (!conquistas.colecionadorPowerUps && 
      (efeitosAtivos.tempoExtra || efeitosAtivos.vidaExtra)) {
    conquistas.colecionadorPowerUps = true;
    mostrarConquista("Colecionador", "Coletou seu primeiro power-up!");
  }
  
  // Sobrevivente (terminar uma fase com menos de 3 segundos)
  if (!conquistas.sobrevivente && tempoRestante < 3 && tempoRestante > 0) {
    conquistas.sobrevivente = true;
    mostrarConquista("Por um Fio", "Terminou uma fase com menos de 3 segundos!");
  }
  
  salvarConquistas();
}

function salvarConquistas() {
  localStorage.setItem('zeCafeConquistas', JSON.stringify(conquistas));
}

function mostrarConquista(titulo, descricao) {
  const popup = document.getElementById("achievementPopup");
  document.getElementById("achievementTitle").textContent = titulo;
  document.getElementById("achievementDescription").textContent = descricao;
  
  popup.style.display = "block";
  popup.style.opacity = 1;
  
  setTimeout(() => {
    popup.style.opacity = 0;
    setTimeout(() => {
      popup.style.display = "none";
    }, 1000);
  }, 3000);
}

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
  
  // Atualizar a cor de fundo com base na fase
  atualizarCorDeFundo();
}

// Função para atualizar a cor de fundo com base na fase atual
function atualizarCorDeFundo() {
  const indiceCor = Math.min(fase - 1, coresFases.length - 1);
  document.body.style.backgroundColor = coresFases[indiceCor];
  canvas.style.backgroundColor = coresFases[indiceCor];
}

function desenharZecafe() {
  ctx.drawImage(imgZeAtual, zecafe.x, zecafe.y, zecafe.width, zecafe.height);
  
  // Desenhar efeito visual se algum power-up estiver ativo
  if (efeitosAtivos.tempoExtra || efeitosAtivos.vidaExtra) {
    ctx.beginPath();
    ctx.arc(zecafe.x + zecafe.width/2, zecafe.y + zecafe.height/2, 
            zecafe.width/1.5, 0, Math.PI * 2);
    
    const cor = efeitosAtivos.tempoExtra ? 
                'rgba(0, 255, 255, 0.2)' : 'rgba(255, 0, 255, 0.2)';
    ctx.fillStyle = cor;
    ctx.fill();
  }
}

function desenharXicaras() {
  for (let x of xicaras) {
    ctx.drawImage(imgXicara, x.x - 20, x.y - 20, 40, 40);
  }
}

function gerarCafe() {
  // Chance base de gerar café + aumento por fase
  const chanceBase = 0.009;
  const aumentoPorFase = 0.003;
  
  if (Math.random() < chanceBase + fase * aumentoPorFase) {
    const xicara = xicaras[Math.floor(Math.random() * xicaras.length)];
    if (xicara) {
      // Variação na velocidade das gotas
      const velocidadeBase = 1.5 + fase * 0.5;
      const variacao = Math.random() * 0.5 - 0.25; // -0.25 a +0.25
      
      cafes.push({
        x: xicara.x,
        y: xicara.y + 20,
        radius: 10,
        speed: velocidadeBase + variacao,
        // Adicionar movimento em zigue-zague para algumas gotas
        zigzag: Math.random() < 0.2, // 20% de chance
        amplitude: Math.random() * 2 + 1, // 1-3 pixels
        frequency: Math.random() * 0.1 + 0.05, // frequência do zigue-zague
        angle: 0 // ângulo inicial para o movimento
      });
    }
  }
}

function desenharCafes() {
  for (let i = 0; i < cafes.length; i++) {
    const c = cafes[i];
    
    // Aplicar movimento em zigue-zague se ativado
    if (c.zigzag) {
      c.angle += c.frequency;
      c.x += Math.sin(c.angle) * c.amplitude;
    }
    
    ctx.drawImage(imgGota, c.x - c.radius, c.y - c.radius, c.radius * 2, c.radius * 2);
    c.y += c.speed;

    // Colisão com o chão
    if (c.y > canvas.height) {
      vidas--;
      resetarCombo(); // Reseta o combo quando uma gota cai
      
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

        // Salvar pontuação e exibir high scores
        salvarHighScore();
        exibirHighScores();
        
        // Toca som de derrota
        try {
          loseSound.currentTime = 0;
          loseSound.play();
        } catch (e) {}
      } else {
        // Nova regra: Ao cair uma gota no chão, volta à primeira fase e zera a pontuação
        fase = 1;
        pontuacao = 0;
        tempoRestante = 15;
        vidaExtraGeradaNaFase = false;
        resetXicaras();
        showPhaseMessage(fase);
        atualizarHUDPontuacao();
        playPhaseSound(0); // Reinicia música da fase 1
      }

      cafes.splice(i, 1);
      i--;
      continue;
    }

    // Colisão com o Zé
    if (
      c.y + c.radius > zecafe.y &&
      c.x > zecafe.x &&
      c.x < zecafe.x + zecafe.width
    ) {
      cafes.splice(i, 1);
      i--;

      try {
        zegoleSound.play();
      } catch (e) {}

      imgZeAtual = imgZeBoca;
      setTimeout(() => {
        imgZeAtual = imgZeNormal;
      }, 300);
      
      // Adicionar pontos e incrementar combo
      adicionarPontos(PONTOS_POR_GOTA);
      incrementarCombo();
    }
  }
}

function mostrarHUD() {
  document.getElementById("hudVidas").textContent = `Vidas: ${vidas}`;
  document.getElementById("hudFase").textContent = `Fase: ${fase}`;
  document.getElementById("hudTempo").textContent = `Tempo: ${tempoRestante.toFixed(1)}s`;
  document.getElementById("hudPontos").textContent = `Pontos: ${pontuacao}`;
  
  // Mostrar meta de pontos para a fase atual (exceto na fase 5)
  if (fase < 5) {
    document.getElementById("hudMeta").textContent = `Meta: ${PONTOS_FASE[fase]}`;
    document.getElementById("hudMetaContainer").style.display = "flex";
  } else {
    // Na fase 5, não há meta de pontos, apenas sobreviver o máximo possível
    document.getElementById("hudMetaContainer").style.display = "none";
  }
}

let lastFrameTime = performance.now();
let movingLeft = false;
let movingRight = false;

// Controle por botões
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
  // Usar velocidade atual que pode ser modificada por power-ups
  if (movingLeft) zecafe.x -= zecafe.velocidadeAtual;
  if (movingRight) zecafe.x += zecafe.velocidadeAtual;
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
  
  // Forçar recarregamento das imagens se ainda não estiverem carregadas
  if (!imagensCarregadas) {
    recarregarImagens();
  }
}

function startGame() {
  // Se as imagens não estiverem carregadas, forçar recarregamento e aguardar
  if (!imagensCarregadas) {
    recarregarImagens();
    
    // Mostrar mensagem de carregamento
    const loadingMessage = document.createElement("div");
    loadingMessage.id = "loadingMessage";
    loadingMessage.style.position = "fixed";
    loadingMessage.style.top = "50%";
    loadingMessage.style.left = "50%";
    loadingMessage.style.transform = "translate(-50%, -50%)";
    loadingMessage.style.background = "rgba(0,0,0,0.7)";
    loadingMessage.style.color = "white";
    loadingMessage.style.padding = "20px";
    loadingMessage.style.borderRadius = "10px";
    loadingMessage.style.zIndex = "9999";
    loadingMessage.textContent = "Carregando imagens do jogo...";
    document.body.appendChild(loadingMessage);
    
    // Verificar periodicamente se as imagens foram carregadas
    const checkLoading = setInterval(() => {
      if (imagensCarregadas) {
        clearInterval(checkLoading);
        document.body.removeChild(loadingMessage);
        iniciarJogo();
      }
    }, 100);
    
    return;
  }
  
  // Se as imagens já estiverem carregadas, iniciar o jogo diretamente
  iniciarJogo();
}

function iniciarJogo() {
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
  pontuacao = 0;
  comboAtual = 0;
  multiplicadorCombo = 1;
  ultimoPowerUpGerado = 0;
  vidaExtraGeradaNaFase = false;
  
  // Resetar efeitos ativos
  Object.keys(efeitosAtivos).forEach(key => {
    efeitosAtivos[key] = false;
  });
  
  // Resetar velocidade do Zé
  zecafe.velocidadeAtual = zecafe.velocidadeBase;

  zecafe.x = canvas.width / 2;
  resetXicaras();
  cafes = [];
  powerUps = [];
  efeitosVisuais = [];

  // Oculta telas
  document.getElementById("gameOverScreen").style.display = "none";
  document.getElementById("rulesScreen").style.display = "none";
  document.getElementById("rulesOverlay").style.display = "none";
  document.getElementById("bru").style.display = "none";
  document.getElementById("comboContainer").style.display = "none";

  document.getElementById("controls").style.display = "flex";
  document.getElementById("hud").style.display = "flex";

  splashScreen.style.display = "none";

  // Carregar high scores e conquistas
  carregarHighScores();
  inicializarConquistas();

  // Atualizar a cor de fundo para a fase 1
  atualizarCorDeFundo();

  // Toca música da fase 1
  playPhaseSound(fase - 1); // Fase 1 = índice 0

  lastFrameTime = performance.now();
  requestAnimationFrame(gameLoop);
  showPhaseMessage(fase);
  atualizarHUDPontuacao();
}

function gameLoop(timestamp) {
  if (gameOver) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  updatePlayer();
  gerarCafe();
  gerarPowerUp();
  desenharXicaras();
  desenharZecafe();
  desenharCafes();
  desenharPowerUps();
  atualizarEfeitosVisuais();
  mostrarHUD();

  const deltaTime = timestamp - lastFrameTime;
  tempoRestante -= deltaTime / 1000;
  lastFrameTime = timestamp;

  // Verificar se o tempo acabou
  if (tempoRestante <= 0) {
    // Na fase 5, o jogo termina quando o tempo acaba
    if (fase === 5) {
      gameOver = true;
      try {
        if (currentPhaseSound) {
          currentPhaseSound.pause();
          currentPhaseSound.currentTime = 0;
        }
        vitoriaSound.play();
      } catch (e) {}
      document.getElementById("gameOverText").innerText = "Parabéns! Você é Gourmet 100% Arábica!";
      
      // Adicionar pontos bônus por completar o jogo
      adicionarPontos(500);
      
      // Salvar pontuação e exibir high scores
      salvarHighScore();
      exibirHighScores();
      
      document.getElementById("gameOverScreen").style.display = "block";
    } else {
      // Nas outras fases, o tempo é apenas um limite, a progressão é por pontuação
      // Reiniciar o tempo para evitar que o jogo termine
      tempoRestante = 15;
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
    loseSound, comboSound, powerupSound,
    ...phaseSounds
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
  
  // Inicializar high scores e conquistas
  carregarHighScores();
  inicializarConquistas();
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
