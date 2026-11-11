
const $ = (selector) => document.querySelector(selector);

// =====================================
// 1. MENU RESPONSIVO
// =====================================

const menuToggle = $('#menuToggle');
const menu = $('#menu');

menuToggle.addEventListener('click', () => {
  const open = menu.classList.toggle('open');

  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute(
    'aria-label',
    open ? 'Fechar menu' : 'Abrir menu'
  );
});

menu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    menu.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  });
});


// =====================================
// 2. ACESSIBILIDADE
// =====================================

// Alto contraste
$('#contrastToggle').addEventListener('click', e => {
  const active = document.body.classList.toggle('high-contrast');

  e.currentTarget.setAttribute(
    'aria-pressed',
    String(active)
  );
});

// Fonte amigável para dislexia
$('#fontToggle').addEventListener('click', e => {
  const active = document.body.classList.toggle('dyslexia-font');

  e.currentTarget.setAttribute(
    'aria-pressed',
    String(active)
  );
});

// Aumentar e diminuir fonte
let fontScale = 1;

function updateFont() {
  document.documentElement.style.setProperty(
    '--page-scale',
    fontScale
  );
}

$('#textPlus').addEventListener('click', () => {
  fontScale = Math.min(
    1.3,
    +(fontScale + 0.1).toFixed(1)
  );

  updateFont();
});

$('#textMinus').addEventListener('click', () => {
  fontScale = Math.max(
    0.85,
    +(fontScale - 0.1).toFixed(1)
  );

  updateFont();
});


// =====================================
// 3. SIMULADOR DE CORPO NEGRO
// =====================================

// Constantes físicas
const h = 6.62607015e-34;
const c = 299792458;
const k = 1.380649e-23;

const slider = $('#tempSlider');
const canvas = $('#spectrumChart');
const ctx = canvas.getContext('2d');

// Lei de Planck
function planck(lambdaM, T) {
  const x = (h * c) / (lambdaM * k * T);

  if (x > 700) return 0;

  return (2 * h * c * c) /
    (Math.pow(lambdaM, 5) * (Math.exp(x) - 1));
}


// =====================================
// 4. DESENHAR GRÁFICO DO ESPECTRO
// =====================================

function drawChart(T) {

  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  canvas.width = Math.max(300, rect.width * dpr);
  canvas.height = 240 * dpr;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const W = canvas.width / dpr;
  const H = 240;

  const left = 42;
  const right = 12;
  const top = 12;
  const bottom = 30;

  const plotW = W - left - right;
  const plotH = H - top - bottom;

  ctx.clearRect(0, 0, W, H);

  // Linhas do gráfico
  ctx.strokeStyle = 'rgba(190,215,255,.16)';
  ctx.lineWidth = 1;

  for (let i = 0; i <= 4; i++) {
    const y = top + plotH * i / 4;

    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(W - right, y);
    ctx.stroke();
  }

  // Calcular valores da radiação
  const values = [];
  let max = 0;

  for (let i = 0; i <= 240; i++) {

    const nm = 100 + i * 10;
    const v = planck(nm * 1e-9, T);

    values.push({ nm, v });

    max = Math.max(max, v);
  }

  // Encontrar o pico
  const peak = values.reduce(
    (a, b) => b.v > a.v ? b : a,
    values[0]
  );

  const xFor = nm =>
    left + (nm - 100) / 2400 * plotW;

  const yFor = v =>
    top + plotH - (v / max) * plotH * 0.9;

  // Gradiente de cores
  const grad = ctx.createLinearGradient(
    left, 0, W - right, 0
  );

  grad.addColorStop(0, '#7b37bc');
  grad.addColorStop(0.2, '#4165df');
  grad.addColorStop(0.4, '#35a9e8');
  grad.addColorStop(0.6, '#51c778');
  grad.addColorStop(0.8, '#f79b42');
  grad.addColorStop(1, '#e94c4c');

  // Área preenchida
  ctx.beginPath();

  values.forEach((p, i) => {
    const x = xFor(p.nm);
    const y = yFor(p.v);

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.lineTo(xFor(2500), top + plotH);
  ctx.lineTo(xFor(100), top + plotH);
  ctx.closePath();

  ctx.fillStyle = grad;
  ctx.globalAlpha = 0.13;
  ctx.fill();
  ctx.globalAlpha = 1;

  // Linha da curva
  ctx.beginPath();

  values.forEach((p, i) => {
    const x = xFor(p.nm);
    const y = yFor(p.v);

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.strokeStyle = '#8be6f5';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Marcar o pico
  const peakX = xFor(peak.nm);
  const peakY = yFor(peak.v);

  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = '#ffc857';

  ctx.beginPath();
  ctx.moveTo(peakX, peakY);
  ctx.lineTo(peakX, top + plotH);
  ctx.stroke();

  ctx.setLineDash([]);

  ctx.fillStyle = '#ffc857';
  ctx.beginPath();
  ctx.arc(peakX, peakY, 4, 0, Math.PI * 2);
  ctx.fill();

  // Legendas
  ctx.fillStyle = '#b4c1d8';
  ctx.font = '11px Arial';

  ctx.fillText('100 nm', left, H - 8);
  ctx.fillText('1.300 nm', left + plotW * 0.48, H - 8);
  ctx.fillText('2.500 nm', W - 62, H - 8);
}


// =====================================
// 5. ATUALIZAR SIMULADOR
// =====================================

function updateSimulator() {

  const T = Number(slider.value);

  // Lei de Wien
  const peakNm = 2.897771955e6 / T;

  $('#tempOutput').textContent =
    T.toLocaleString('pt-BR') + ' K';

  $('#peakOutput').textContent =
    Math.round(peakNm) + ' nm';

  // Identificar região do espectro
  $('#bandOutput').textContent =
    peakNm < 380
      ? 'Ultravioleta'
      : peakNm <= 750
        ? 'Visível'
        : 'Infravermelho';

  // Aparência aproximada do objeto
  let name;
  let color;

  if (T < 1800) {
    name = 'Vermelho-alaranjado';
    color = '#f05d35';

  } else if (T < 3000) {
    name = 'Alaranjado';
    color = '#ff963e';

  } else if (T < 4500) {
    name = 'Amarelado';
    color = '#ffd05a';

  } else if (T < 6500) {
    name = 'Branco-amarelado';
    color = '#fff0b0';

  } else {
    name = 'Branco-azulado';
    color = '#dceaff';
  }

  $('#colorName').textContent = name;

  $('#glowingObject').style.background = color;

  $('#glowingObject').style.boxShadow =
    `0 0 28px ${color}`;

  drawChart(T);
}

slider.addEventListener('input', updateSimulator);

window.addEventListener('resize', () => {
  drawChart(Number(slider.value));
});

updateSimulator();


// =====================================
// 6. QUIZ INTERATIVO
// =====================================

const questions = [

  {
    q: 'O que caracteriza um corpo negro ideal?',
    a: [
      'Reflete toda a luz que recebe.',
      'Absorve toda a radiação incidente.',
      'Não emite energia.'
    ],
    correct: 1,
    why: 'Um corpo negro ideal absorve toda a radiação que recebe e também emite radiação térmica quando está aquecido.'
  },

  {
    q: 'O que acontece com o pico do espectro quando a temperatura aumenta?',
    a: [
      'Desloca-se para comprimentos de onda menores.',
      'Desloca-se sempre para o infravermelho.',
      'Não muda.'
    ],
    correct: 0,
    why: 'Pela lei de Wien, o aumento da temperatura desloca o pico para comprimentos de onda menores.'
  },

  {
    q: 'Aproximadamente, onde fica o pico do espectro solar?',
    a: [
      'Em torno de 500 nm, na luz visível.',
      'Em torno de 5 cm, nas ondas de rádio.',
      'Em torno de 10 m, no infravermelho distante.'
    ],
    correct: 0,
    why: 'Aproximando o Sol por um corpo negro de cerca de 5.800 K, o pico fica próximo de 500 nm.'
  },

  {
    q: 'Como um coletor solar aquece a água da piscina?',
    a: [
      'Transforma água em luz.',
      'Absorve radiação e transfere energia térmica para a água.',
      'Impede toda troca de calor.'
    ],
    correct: 1,
    why: 'O coletor absorve energia solar, aquece e transfere parte dessa energia para a água.'
  },

  {
    q: 'Qual sensor pode medir a temperatura da água?',
    a: [
      'LDR.',
      'DS18B20 à prova d’água.',
      'LED.'
    ],
    correct: 1,
    why: 'O DS18B20 em versão encapsulada à prova d’água é um exemplo de sensor digital de temperatura.'
  }

];

let current = 0;
let score = 0;
let answered = false;

const answers = $('#answers');


// Mostrar pergunta
function renderQuestion() {

  const item = questions[current];

  answered = false;

  $('#questionCount').textContent =
    `Questão ${current + 1} de ${questions.length}`;

  $('#scoreLabel').textContent =
    `Pontuação: ${score}`;

  $('#progressBar').style.width =
    `${(current / questions.length) * 100}%`;

  $('#questionText').textContent = item.q;

  $('#feedback').textContent = '';

  $('#nextQuestion').disabled = true;

  $('#nextQuestion').textContent =
    current === questions.length - 1
      ? 'Ver resultado'
      : 'Próxima questão →';

  answers.innerHTML = '';

  item.a.forEach((answer, index) => {

    const button = document.createElement('button');

    button.className = 'answer';
    button.textContent = answer;
    button.type = 'button';

    button.addEventListener('click', () => {
      chooseAnswer(index);
    });

    answers.appendChild(button);

  });
}


// Verificar resposta
function chooseAnswer(index) {

  if (answered) return;

  answered = true;

  const item = questions[current];

  const buttons = [
    ...answers.querySelectorAll('button')
  ];

  buttons.forEach((button, i) => {

    button.disabled = true;

    if (i === item.correct) {
      button.classList.add('correct');
    }

    if (i === index && i !== item.correct) {
      button.classList.add('wrong');
    }

  });

  if (index === item.correct) {

    score++;

    $('#feedback').textContent =
      'Muito bem! ' + item.why;

  } else {

    $('#feedback').textContent =
      'Quase! ' + item.why;

  }

  $('#scoreLabel').textContent =
    `Pontuação: ${score}`;

  $('#nextQuestion').disabled = false;
}


// Próxima pergunta e resultado
$('#nextQuestion').addEventListener('click', () => {

  if (!answered) return;

  if (current < questions.length - 1) {

    current++;

    renderQuestion();

  } else {

    $('#progressBar').style.width = '100%';

    answers.innerHTML = '';

    $('#questionText').textContent =
      'Quiz concluído!';

    $('#feedback').textContent =
      'Você terminou todas as questões.';

    $('#nextQuestion').hidden = true;

    const result = $('#quizResult');

    result.hidden = false;

    result.textContent =
      `Sua pontuação: ${score} de ${questions.length}. ` +
      (
        score === 5
          ? 'Excelente!'
          : score >= 3
            ? 'Bom trabalho! Continue estudando.'
            : 'Vale revisar os tópicos e tentar novamente.'
      );

    // Botão para reiniciar
    const restart = document.createElement('button');

    restart.className = 'btn secondary';
    restart.textContent = 'Refazer quiz';

    restart.addEventListener('click', () => {

      current = 0;
      score = 0;

      $('#nextQuestion').hidden = false;

      result.hidden = true;

      renderQuestion();

    });

    result.appendChild(document.createElement('br'));
    result.appendChild(restart);

  }

});

// Iniciar quiz
renderQuestion();
