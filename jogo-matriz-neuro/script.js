const startScreen = document.querySelector("#start-screen");
const gameInterface = document.querySelector("#game-interface");
const difficultyButtons = document.querySelectorAll(".difficulty-option");
const selectedModeElement = document.querySelector("#selected-mode");
const modifierNameElement = document.querySelector("#modifier-name");
const puzzleTitleElement = document.querySelector("#puzzle-title");
const puzzleInstructionElement = document.querySelector("#puzzle-instruction");
const mechanicGuideElement = document.querySelector("#mechanic-guide");
const matrixBoard = document.querySelector("#matrix-board");
const ruleHintElement = document.querySelector("#rule-hint");
const answerOptions = document.querySelector("#answer-options");
const feedbackElement = document.querySelector("#feedback");
const nextButton = document.querySelector("#next-button");
const roundCountElement = document.querySelector("#round-count");
const scoreElement = document.querySelector("#score");
const timerElement = document.querySelector("#timer");
const resultDialog = document.querySelector("#result-dialog");
const resultSummary = document.querySelector("#result-summary");
const playAgainButton = document.querySelector("#play-again-button");
const chooseModeButton = document.querySelector("#choose-mode-button");

const modes = {
  leve: { name: "Leve", puzzles: 3, duration: null },
  ritmo: { name: "Ritmo", puzzles: 5, duration: 75 },
  intenso: { name: "Intenso", puzzles: 7, duration: 60 },
};

const directions = [
  { name: "direita", turn: 0 },
  { name: "baixo", turn: 90 },
  { name: "esquerda", turn: 180 },
  { name: "cima", turn: 270 },
];

const shapeNames = {
  circle: "círculo",
  triangle: "triângulo",
  diamond: "losango",
  square: "quadrado",
  hexagon: "hexágono",
};

const colorNames = {
  blue: "azul",
  coral: "coral",
  gold: "dourado",
  violet: "violeta",
};

let activeMode;
let puzzleQueue = [];
let currentPuzzle;
let currentRound = 0;
let score = 0;
let correctAnswers = 0;
let streak = 0;
let secondsLeft;
let isAnswerLocked = false;
let isGameFinished = false;
let timerInterval;
let matrixCells = [];

const shuffle = (items) => {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
};

const polygonPoints = (sides) => {
  const radius = 27;
  const center = 32;

  return Array.from({ length: sides }, (_, index) => {
    const angle = (Math.PI * 2 * index) / sides - Math.PI / 2;
    return `${(center + radius * Math.cos(angle)).toFixed(2)},${(center + radius * Math.sin(angle)).toFixed(2)}`;
  }).join(" ");
};

const tokenKey = (token) => {
  if (token.type === "arrow") return `arrow-${token.direction}`;
  if (token.type === "fusion") return `fusion-${token.sides}`;
  return `shape-${token.shape}-${token.color}`;
};

const tokenLabel = (token) => {
  if (token.type === "arrow") return `seta para ${directions[token.direction].name}`;
  if (token.type === "fusion") return `forma fundida com ${token.sides} pontas`;
  return `${shapeNames[token.shape]} ${colorNames[token.color]}`;
};

const renderArrow = (token) => `
  <svg class="token-svg arrow-token" style="--turn: ${directions[token.direction].turn}deg" viewBox="0 0 64 64" aria-hidden="true">
    <path d="M10 32h39M38 18l14 14-14 14" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="4" />
  </svg>
`;

const renderShape = (token) => {
  const drawing = {
    circle: '<circle class="shape-fill" cx="32" cy="32" r="22" />',
    triangle: '<polygon class="shape-fill" points="32,8 57,54 7,54" />',
    diamond: '<polygon class="shape-fill" points="32,6 58,32 32,58 6,32" />',
    square: '<rect class="shape-fill" x="11" y="11" width="42" height="42" rx="4" />',
    hexagon: `<polygon class="shape-fill" points="${polygonPoints(6)}" />`,
  }[token.shape];

  return `
    <svg class="token-svg shape-token color-${token.color}" viewBox="0 0 64 64" aria-hidden="true">
      ${drawing}
      <path class="shape-shine" d="M21 20l11-6" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="3" />
    </svg>
  `;
};

const renderFusion = (token) => `
  <svg class="token-svg fusion-token" viewBox="0 0 64 64" aria-hidden="true">
    <polygon class="fusion-shape" points="${polygonPoints(token.sides)}" />
    <path d="M32 18v28M18 32h28" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2.5" />
    <circle cx="51" cy="14" r="3" fill="currentColor" />
  </svg>
`;

const renderToken = (token) => {
  if (token.type === "arrow") return renderArrow(token);
  if (token.type === "fusion") return renderFusion(token);
  return renderShape(token);
};

const renderMechanicGuide = (guide) => {
  if (guide === "giro") {
    return `
      <div class="guide-visual guide-visual--giro" aria-hidden="true">
        <span>→</span><b>↻ 90°</b><span>↓</span><b>↻ 90°</b><span>←</span>
      </div>
      <p>Procure o mesmo giro nas linhas e nas colunas.</p>
    `;
  }

  if (guide === "fusao") {
    return `
      <div class="guide-visual guide-visual--fusao" aria-hidden="true">
        <span class="guide-side-count guide-side-count--triangle">3</span><b>+</b>
        <span class="guide-side-count guide-side-count--square">4</span><b>=</b>
        <span class="guide-side-count guide-side-count--fusion">7</span>
      </div>
      <p>As etiquetas indicam as pontas: a peça fundida soma os dois números.</p>
    `;
  }

  return `
    <div class="guide-visual guide-visual--roubo" aria-hidden="true">
      <span class="guide-property guide-property--shape">forma</span><b>+</b>
      <span class="guide-property guide-property--color">cor</span><b>→</b>
      <span class="guide-property guide-property--result">nova peça</span>
    </div>
    <p>Na última peça, observe qual vizinha entrega a forma e qual entrega a cor.</p>
  `;
};

const tokenCue = (token) => {
  if (token.cue) return token.cue;
  if (token.type === "fusion" && token.sources) return `${token.sources[0]} + ${token.sources[1]} pontas`;
  return "";
};

const shapeFromSides = (sides) => ({ 3: "triangle", 4: "square", 5: "diamond", 6: "hexagon" })[sides];

const createDirectionPuzzle = () => {
  const startingDirection = Math.floor(Math.random() * directions.length);
  const matrix = [];

  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      matrix.push({ type: "arrow", direction: (startingDirection + row + column) % directions.length });
    }
  }

  const answer = matrix[8];
  matrix[8] = null;

  return {
    modifier: "Giro sincronizado",
    guide: "giro",
    title: "Qual seta fecha o circuito?",
    instruction: "Observe como cada seta gira ao avançar pela grade.",
    rule: "Em cada passo para a direita ou para baixo, a seta gira 90° no sentido horário.",
    matrix,
    answer,
    options: shuffle([
      answer,
      ...directions
        .map((_, direction) => ({ type: "arrow", direction }))
        .filter((token) => tokenKey(token) !== tokenKey(answer)),
    ]),
  };
};

const createFusionPuzzle = () => {
  const baseSides = shuffle([3, 4, 5, 6]).slice(0, 3);
  const pairs = [
    [baseSides[0], baseSides[1]],
    [baseSides[1], baseSides[2]],
    [baseSides[2], baseSides[0]],
  ];
  const matrix = pairs.flatMap(([left, right]) => [
    { type: "shape", shape: shapeFromSides(left), color: "blue", cue: `${left} pontas` },
    { type: "shape", shape: shapeFromSides(right), color: "coral", cue: `${right} pontas` },
    { type: "fusion", sides: left + right, sources: [left, right] },
  ]);
  const answer = matrix[8];
  matrix[8] = null;
  const possibleSides = [6, 7, 8, 9, 10, 11];

  return {
    modifier: "Fusão de peças",
    guide: "fusao",
    title: "Qual forma nasce da fusão?",
    instruction: "Nas linhas prontas, duas peças se unem para criar a terceira.",
    rule: "A fusão soma as pontas das duas formas anteriores: 3 + 5, por exemplo, forma uma peça de 8 pontas.",
    matrix,
    answer,
    options: shuffle([
      answer,
      ...shuffle(possibleSides.filter((sides) => sides !== answer.sides))
        .slice(0, 3)
        .map((sides) => ({ type: "fusion", sides })),
    ]),
  };
};

const createColorTheftPuzzle = () => {
  const shapes = shuffle(["circle", "triangle", "diamond", "square", "hexagon"]).slice(0, 3);
  const colors = shuffle(["blue", "coral", "gold", "violet"]).slice(0, 3);
  const matrix = [];

  for (let row = 0; row < 3; row += 1) {
    const left = { type: "shape", shape: shapes[row], color: colors[row], cue: "forma" };
    const neighbor = {
      type: "shape",
      shape: shapes[(row + 1) % shapes.length],
      color: colors[(row + 1) % colors.length],
      cue: "cor",
    };
    const stolen = { type: "shape", shape: left.shape, color: neighbor.color, cue: "mistura" };
    matrix.push(left, neighbor, stolen);
  }

  const answer = matrix[8];
  matrix[8] = null;
  const distractors = [
    { type: "shape", shape: shapes[2], color: colors[2] },
    { type: "shape", shape: shapes[0], color: colors[0] },
    { type: "shape", shape: shapes[1], color: colors[1] },
  ];

  return {
    modifier: "Roubo de cor",
    guide: "roubo",
    title: "Quem roubou a cor da vizinha?",
    instruction: "Veja o que a última peça de cada linha preserva — e o que ela troca.",
    rule: "A terceira peça mantém a forma da primeira, mas rouba a cor da segunda peça da mesma linha.",
    matrix,
    answer,
    options: shuffle([answer, ...distractors]),
  };
};

const puzzleFactories = [createDirectionPuzzle, createFusionPuzzle, createColorTheftPuzzle];

const createPuzzleQueue = (amount) => {
  const queue = [];

  while (queue.length < amount) {
    queue.push(...shuffle(puzzleFactories).map((factory) => factory()));
  }

  return queue.slice(0, amount);
};

const updateStatus = () => {
  roundCountElement.textContent = `${Math.min(currentRound + 1, activeMode.puzzles)}/${activeMode.puzzles}`;
  scoreElement.textContent = score;
  timerElement.textContent = activeMode.duration ? `${secondsLeft}s` : "Livre";
};

const buildMatrix = () => {
  matrixBoard.replaceChildren();
  matrixCells = currentPuzzle.matrix.map((token) => {
    const cell = document.createElement("div");
    cell.className = "matrix-cell";
    cell.setAttribute("role", "gridcell");

    if (!token) {
      cell.classList.add("is-missing");
      cell.setAttribute("aria-label", "Peça ausente: escolha uma das opções");
      cell.innerHTML = '<span class="missing-mark" aria-hidden="true">?</span>';
    } else {
      cell.setAttribute("aria-label", tokenLabel(token));
      const cue = tokenCue(token);
      if (cue) cell.classList.add("has-cue");
      cell.innerHTML = `${renderToken(token)}${cue ? `<span class="cell-cue" aria-hidden="true">${cue}</span>` : ""}`;
    }

    matrixBoard.append(cell);
    return cell;
  });
};

const buildAnswers = () => {
  answerOptions.replaceChildren();

  currentPuzzle.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.className = "answer-option";
    button.type = "button";
    button.dataset.key = tokenKey(option);
    button.setAttribute("aria-label", `Opção ${index + 1}: ${tokenLabel(option)}`);
    button.innerHTML = `
      <span class="answer-number" aria-hidden="true">${index + 1}</span>
      ${renderToken(option)}
      <span class="answer-label">${tokenLabel(option)}</span>
    `;
    button.addEventListener("click", handleAnswer);
    answerOptions.append(button);
  });
};

const showCurrentPuzzle = () => {
  currentPuzzle = puzzleQueue[currentRound];
  isAnswerLocked = false;
  modifierNameElement.textContent = `Mecânica ativa · ${currentPuzzle.modifier}`;
  puzzleTitleElement.textContent = currentPuzzle.title;
  puzzleInstructionElement.textContent = currentPuzzle.instruction;
  mechanicGuideElement.innerHTML = renderMechanicGuide(currentPuzzle.guide);
  feedbackElement.textContent = "";
  ruleHintElement.textContent = "Encontre a transformação que se repete na grade.";
  ruleHintElement.classList.remove("is-revealed");
  nextButton.hidden = true;
  buildMatrix();
  buildAnswers();
  updateStatus();
};

const revealMissingPiece = () => {
  const missingCell = matrixCells[8];
  missingCell.classList.remove("is-missing");
  missingCell.classList.add("is-revealed", "is-correct-answer");
  missingCell.setAttribute("aria-label", tokenLabel(currentPuzzle.answer));
  const cue = tokenCue(currentPuzzle.answer);
  if (cue) missingCell.classList.add("has-cue");
  missingCell.innerHTML = `${renderToken(currentPuzzle.answer)}${cue ? `<span class="cell-cue" aria-hidden="true">${cue}</span>` : ""}`;
};

function handleAnswer(event) {
  if (isAnswerLocked || isGameFinished) return;

  isAnswerLocked = true;
  const selectedButton = event.currentTarget;
  const selectedKey = selectedButton.dataset.key;
  const isCorrect = selectedKey === tokenKey(currentPuzzle.answer);

  answerOptions.querySelectorAll("button").forEach((button) => {
    button.disabled = true;
    if (button.dataset.key === tokenKey(currentPuzzle.answer)) button.classList.add("is-correct");
  });

  selectedButton.classList.add(isCorrect ? "is-correct" : "is-wrong");
  revealMissingPiece();
  ruleHintElement.textContent = currentPuzzle.rule;
  ruleHintElement.classList.add("is-revealed");

  if (isCorrect) {
    streak += 1;
    correctAnswers += 1;
    const earnedPoints = 100 + Math.min(streak - 1, 3) * 25;
    score += earnedPoints;
    feedbackElement.textContent = `Boa! +${earnedPoints} pontos.`;
  } else {
    streak = 0;
    feedbackElement.textContent = "Quase. A peça correta foi revelada — use a regra na próxima matriz.";
  }

  nextButton.textContent = currentRound + 1 >= activeMode.puzzles ? "Ver resultado" : "Próxima matriz";
  nextButton.hidden = false;
  updateStatus();
  nextButton.focus();
}

const stopTimer = () => window.clearInterval(timerInterval);

const finishGame = (timeExpired = false) => {
  if (isGameFinished) return;

  isGameFinished = true;
  isAnswerLocked = true;
  stopTimer();
  answerOptions.querySelectorAll("button").forEach((button) => {
    button.disabled = true;
  });
  nextButton.hidden = true;

  resultSummary.textContent = timeExpired
    ? `O tempo acabou. Você resolveu ${correctAnswers} de ${activeMode.puzzles} matrizes e fez ${score} pontos.`
    : `Você resolveu ${correctAnswers} de ${activeMode.puzzles} matrizes e terminou com ${score} pontos.`;

  if (!resultDialog.open) resultDialog.showModal();
};

const startTimer = () => {
  stopTimer();
  if (!activeMode.duration) return;

  timerInterval = window.setInterval(() => {
    secondsLeft -= 1;
    updateStatus();

    if (secondsLeft <= 0) finishGame(true);
  }, 1000);
};

const startGame = (modeKey) => {
  activeMode = modes[modeKey];
  puzzleQueue = createPuzzleQueue(activeMode.puzzles);
  currentRound = 0;
  score = 0;
  correctAnswers = 0;
  streak = 0;
  secondsLeft = activeMode.duration;
  isGameFinished = false;
  selectedModeElement.textContent = `${activeMode.name} · ${activeMode.puzzles} matrizes`;
  startScreen.hidden = true;
  gameInterface.hidden = false;
  document.body.classList.add("game-in-progress");
  if (resultDialog.open) resultDialog.close();
  showCurrentPuzzle();
  startTimer();
};

const returnToModeSelection = () => {
  stopTimer();
  isGameFinished = true;
  document.body.classList.remove("game-in-progress");
  gameInterface.hidden = true;
  startScreen.hidden = false;
  if (resultDialog.open) resultDialog.close();
  difficultyButtons[0].focus();
};

difficultyButtons.forEach((button) => {
  button.addEventListener("click", () => startGame(button.dataset.mode));
});

nextButton.addEventListener("click", () => {
  if (currentRound + 1 >= activeMode.puzzles) {
    finishGame();
    return;
  }

  currentRound += 1;
  showCurrentPuzzle();
});

playAgainButton.addEventListener("click", () => {
  const modeKey = Object.keys(modes).find((key) => modes[key] === activeMode);
  startGame(modeKey);
});
chooseModeButton.addEventListener("click", returnToModeSelection);
resultDialog.addEventListener("cancel", (event) => event.preventDefault());
