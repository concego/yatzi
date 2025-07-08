/* Processado em 90 ms */
// Elementos do DOM
const diceElements = document.querySelectorAll('.dice');
const rollBtn = document.getElementById('roll-btn');
const scoreDisplay = document.getElementById('score-display');
const helpBtn = document.getElementById('help-btn');
const closeHelpBtn = document.getElementById('close-help');
const helpPanel = document.getElementById('help-panel');
const saveBtn = document.getElementById('save-btn');
const loadBtn = document.getElementById('load-btn');
const resetBtn = document.getElementById('reset-btn');
const timeBtn = document.getElementById('time-btn');
const startBtn = document.getElementById('start-btn');
const loadingDiv = document.getElementById('loading');
const gameEndDiv = document.getElementById('game-end');
const diceContainer = document.querySelector('.dice-container');

// Estado do jogo
let dice = [null, null, null, null, null]; // Valores dos dados (null até rolar)
let locked = [false, false, false, false, false]; // Dados travados
let rollsLeft = 3; // Rolagens restantes
let scores = {
  ones: null, twos: null, threes: null, fours: null, fives: null, sixes: null,
  threeKind: null, fourKind: null, fullHouse: null, smallStraight: null,
  largeStraight: null, yahtzee: null, chance: null, bonus: null
};
let totalScore = 0;
let gameStartTime = null; // Inicia após clicar em "Iniciar Jogo"
let gameStarted = false;

// Função para iniciar o jogo
function startGame() {
  gameStarted = true;
  gameStartTime = Date.now();
  loadingDiv.style.display = 'none';
  startBtn.style.display = 'none';
  document.querySelector('.roll-controls').style.display = 'flex';
  helpBtn.style.display = 'inline-block';
  saveBtn.style.display = 'inline-block';
  loadBtn.style.display = 'inline-block';
  resetBtn.style.display = 'inline-block';
  timeBtn.style.display = 'inline-block';
  rollBtn.disabled = false;
  updateUI();
  try {
    window.initSounds(); // Inicializar sons
    playSound('confirm');
  } catch (error) {
    console.error('Erro ao inicializar sons:', error);
  }
}

// Função para rolar dados
function rollDice() {
  if (!gameStarted || rollsLeft <= 0) return;
  diceElements.forEach((die, i) => {
    if (!locked[i]) {
      dice[i] = Math.floor(Math.random() * 6) + 1;
      die.setAttribute('data-value', dice[i]);
      die.setAttribute('aria-label', `Dado ${i + 1}, valor ${dice[i]}, clicável para ${locked[i] ? 'destravar' : 'travar'}`);
      die.classList.add('rolling');
      playSound('roll');
      setTimeout(() => die.classList.remove('rolling'), 500);
    }
  });
  rollsLeft--;
  rollBtn.textContent = `🎲 Rolar (${rollsLeft}/3)`;
  rollBtn.setAttribute('aria-label', `Rolar dados, ${rollsLeft} rolagens restantes`);
  if (rollsLeft === 0) rollBtn.disabled = true;
  updateScoreOptions();
  // Foco no primeiro dado para acessibilidade
  if (diceElements[0]) diceElements[0].focus();
}

// Travar/destravar dado
diceElements.forEach((die, i) => {
  die.setAttribute('role', 'button'); // Mais adequado para interação
  die.addEventListener('click', () => {
    if (gameStarted && rollsLeft < 3 && rollsLeft > 0) {
      locked[i] = !locked[i];
      die.classList.toggle('locked');
      die.setAttribute('aria-label', `Dado ${i + 1}, valor ${dice[i] || 'não rolado'}, ${locked[i] ? 'travado' : 'clicável para travar'}`);
      playSound('select');
    }
  });
  die.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      die.click();
    }
  });
});

// Atualizar opções de pontuação
function updateScoreOptions() {
  if (!gameStarted) return;
  const categories = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes', 'threeKind', 'fourKind', 'fullHouse', 'smallStraight', 'largeStraight', 'yahtzee', 'chance'];
  categories.forEach(category => {
    const cell = document.getElementById(`score-${category}`);
    if (scores[category] === null) {
      const score = calculateScore(category, dice);
      cell.textContent = score;
      cell.setAttribute('aria-label', `Selecionar ${categoryToLabel(category)}, pontuação ${score}`);
      cell.setAttribute('role', 'button');
      cell.onclick = () => selectScore(category, score);
      cell.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectScore(category, score);
        }
      };
      cell.setAttribute('tabindex', '0');
    } else {
      cell.setAttribute('aria-label', `${categoryToLabel(category)}, pontuação ${scores[category]}, já selecionado`);
      cell.setAttribute('aria-disabled', 'true');
      cell.onclick = null;
      cell.onkeydown = null;
      cell.removeAttribute('tabindex');
    }
  });
}

// Converter categoria para rótulo acessível
function categoryToLabel(category) {
  const labels = {
    ones: '1s', twos: '2s', threes: '3s', fours: '4s', fives: '5s', sixes: '6s',
    threeKind: 'Trinca', fourKind: 'Quadra', fullHouse: 'Full House',
    smallStraight: 'Sequência Pequena', largeStraight: 'Sequência Grande',
    yahtzee: 'Yahtzee', chance: 'Chance'
  };
  return labels[category] || category;
}

// Calcular pontuação para cada categoria
function calculateScore(category, dice) {
  if (!dice.every(d => d !== null)) return 0;
  const sortedDice = [...dice].sort();
  const counts = Array(7).fill(0);
  dice.forEach(d => counts[d]++);

  switch (category) {
    case 'ones': return counts[1] * 1;
    case 'twos': return counts[2] * 2;
    case 'threes': return counts[3] * 3;
    case 'fours': return counts[4] * 4;
    case 'fives': return counts[5] * 5;
    case 'sixes': return counts[6] * 6;
    case 'threeKind': return counts.some(c => c >= 3) ? dice.reduce((a, b) => a + b, 0) : 0;
    case 'fourKind': return counts.some(c => c >= 4) ? dice.reduce((a, b) => a + b, 0) : 0;
    case 'fullHouse': return counts.some(c => c === 3) && counts.some(c => c === 2) ? 25 : 0;
    case 'smallStraight':
      return [1,2,3,4].every(n => sortedDice.includes(n)) ||
             [2,3,4,5].every(n => sortedDice.includes(n)) ||
             [3,4,5,6].every(n => sortedDice.includes(n)) ? 30 : 0;
    case 'largeStraight':
      return sortedDice.join('') === '12345' || sortedDice.join('') === '23456' ? 40 : 0;
    case 'yahtzee': return counts.some(c => c === 5) ? 50 : 0;
    case 'chance': return dice.reduce((a, b) => a + b, 0);
    default: return 0;
  }
}

// Selecionar pontuação
function selectScore(category, score) {
  if (!gameStarted || scores[category] !== null) return;
  scores[category] = score;
  const cell = document.getElementById(`score-${category}`);
  cell.textContent = score;
  cell.setAttribute('aria-label', `${categoryToLabel(category)}, pontuação ${score}, já selecionado`);
  cell.setAttribute('aria-disabled', 'true');
  cell.onclick = null;
  cell.onkeydown = null;
  cell.removeAttribute('tabindex');
  totalScore += score;
  scoreDisplay.textContent = `Pontuação: ${totalScore}`;
  scoreDisplay.setAttribute('aria-live', 'polite');
  rollsLeft = 3;
  locked.fill(false);
  diceElements.forEach(die => die.classList.remove('locked'));
  rollBtn.disabled = false;
  rollBtn.textContent = `🎲 Rolar (3/3)`;
  rollBtn.setAttribute('aria-label', `Rolar dados, 3 rolagens restantes`);
  playSound('confirm');
  updateBonus();
  checkGameEnd();
  // Foco na tabela após seleção
  document.querySelector('.score-table').focus();
}

// Atualizar bônus
function updateBonus() {
  if (!gameStarted) return;
  const upperScores = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'];
  const upperTotal = upperScores.reduce((sum, cat) => sum + (scores[cat] || 0), 0);
  if (upperTotal >= 63 && scores.bonus === null) {
    scores.bonus = 35;
    totalScore += 35;
    document.getElementById('score-bonus').textContent = 35;
    scoreDisplay.textContent = `Pontuação: ${totalScore}`;
    scoreDisplay.setAttribute('aria-live', 'polite');
  }
}

// Verificar fim do jogo
function checkGameEnd() {
  if (!gameStarted) return;
  const allFilled = Object.values(scores).every(score => score !== null);
  if (allFilled) {
    rollBtn.disabled = true;
    gameEndDiv.textContent = `Jogo finalizado! Pontuação final: ${totalScore}`;
    gameEndDiv.style.display = 'block';
    gameEndDiv.setAttribute('aria-live', 'assertive');
    playSound('confirm');
  }
}

// Salvar jogo
saveBtn.addEventListener('click', () => {
  if (!gameStarted) return;
  const gameState = { dice, locked, rollsLeft, scores, totalScore, gameStartTime, gameStarted };
  localStorage.setItem('yahtzeeGame', JSON.stringify(gameState));
  gameEndDiv.textContent = 'Jogo salvo!';
  gameEndDiv.style.display = 'block';
  gameEndDiv.setAttribute('aria-live', 'assertive');
  setTimeout(() => {
    gameEndDiv.style.display = 'none';
    gameEndDiv.textContent = '';
  }, 2000);
  playSound('confirm');
});

// Carregar jogo
loadBtn.addEventListener('click', () => {
  if (!gameStarted) return;
  const saved = localStorage.getItem('yahtzeeGame');
  if (saved) {
    const gameState = JSON.parse(saved);
    dice = gameState.dice;
    locked = gameState.locked;
    rollsLeft = gameState.rollsLeft;
    scores = gameState.scores;
    totalScore = gameState.totalScore;
    gameStartTime = gameState.gameStartTime;
    gameStarted = true;
    updateUI();
    gameEndDiv.textContent = 'Jogo carregado!';
    gameEndDiv.style.display = 'block';
    gameEndDiv.setAttribute('aria-live', 'assertive');
    setTimeout(() => {
      gameEndDiv.style.display = 'none';
      gameEndDiv.textContent = '';
    }, 2000);
    playSound('confirm');
  } else {
    gameEndDiv.textContent = 'Nenhum jogo salvo encontrado.';
    gameEndDiv.style.display = 'block';
    gameEndDiv.setAttribute('aria-live', 'assertive');
    setTimeout(() => {
      gameEndDiv.style.display = 'none';
      gameEndDiv.textContent = '';
    }, 2000);
  }
});

// Atualizar interface
function updateUI() {
  diceElements.forEach((die, i) => {
    if (dice[i] === null) {
      die.removeAttribute('data-value');
      die.setAttribute('aria-label', `Dado ${i + 1}, não rolado`);
      die.classList.remove('locked');
    } else {
      die.setAttribute('data-value', dice[i]);
      die.setAttribute('aria-label', `Dado ${i + 1}, valor ${dice[i]}, ${locked[i] ? 'travado' : 'clicável para travar'}`);
      if (locked[i]) die.classList.add('locked');
      else die.classList.remove('locked');
    }
  });
  rollBtn.textContent = `🎲 Rolar (${rollsLeft}/3)`;
  rollBtn.setAttribute('aria-label', `Rolar dados, ${rollsLeft} rolagens restantes`);
  rollBtn.disabled = rollsLeft === 0;
  scoreDisplay.textContent = `Pontuação: ${totalScore}`;
  Object.keys(scores).forEach(category => {
    const cell = document.getElementById(`score-${category}`);
    if (scores[category] !== null) {
      cell.textContent = scores[category];
      cell.setAttribute('aria-label', `${categoryToLabel(category)}, pontuação ${scores[category]}, já selecionado`);
      cell.setAttribute('aria-disabled', 'true');
      cell.onclick = null;
      cell.onkeydown = null;
      cell.removeAttribute('tabindex');
    } else {
      cell.textContent = '-';
      cell.setAttribute('aria-label', `${categoryToLabel(category)}, não selecionado`);
    }
  });
}

// Reiniciar jogo
resetBtn.addEventListener('click', () => {
  if (!gameStarted) return;
  gameEndDiv.textContent = 'Deseja reiniciar o jogo? Todo o progresso será perdido.';
  gameEndDiv.style.display = 'block';
  gameEndDiv.setAttribute('aria-live', 'assertive');
  const confirmBtn = document.createElement('button');
  confirmBtn.textContent = 'Confirmar';
  confirmBtn.setAttribute('aria-label', 'Confirmar reinício do jogo');
  gameEndDiv.appendChild(confirmBtn);
  confirmBtn.focus();
  confirmBtn.addEventListener('click', () => {
    dice.fill(null);
    locked.fill(false);
    rollsLeft = 3;
    scores = {
      ones: null, twos: null, threes: null, fours: null, fives: null, sixes: null,
      threeKind: null, fourKind: null, fullHouse: null, smallStraight: null,
      largeStraight: null, yahtzee: null, chance: null, bonus: null
    };
    totalScore = 0;
    gameStartTime = Date.now();
    updateUI();
    rollBtn.disabled = false;
    gameEndDiv.style.display = 'none';
    gameEndDiv.textContent = '';
    playSound('confirm');
  });
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancelar';
  cancelBtn.setAttribute('aria-label', 'Cancelar reinício do jogo');
  gameEndDiv.appendChild(cancelBtn);
  cancelBtn.addEventListener('click', () => {
    gameEndDiv.style.display = 'none';
    gameEndDiv.textContent = '';
  });
});

// Mostrar tempo de jogo
timeBtn.addEventListener('click', () => {
  if (!gameStarted) return;
  const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  gameEndDiv.textContent = `Tempo de jogo: ${minutes} minutos e ${seconds} segundos`;
  gameEndDiv.style.display = 'block';
  gameEndDiv.setAttribute('aria-live', 'assertive');
  setTimeout(() => {
    gameEndDiv.style.display = 'none';
    gameEndDiv.textContent = '';
  }, 2000);
  playSound('confirm');
});

// Aba de ajuda
helpBtn.addEventListener('click', () => {
  helpPanel.classList.add('active');
  helpPanel.setAttribute('aria-hidden', 'false');
  closeHelpBtn.focus();
  playSound('select');
});

closeHelpBtn.addEventListener('click', () => {
  helpPanel.classList.remove('active');
  helpPanel.setAttribute('aria-hidden', 'true');
  helpBtn.focus();
  playSound('select');
});

// Iniciar rolagem
rollBtn.addEventListener('click', rollDice);

// Botão de iniciar
startBtn.addEventListener('click', startGame);

// Inicializar interface
loadingDiv.style.display = 'block';
updateUI();