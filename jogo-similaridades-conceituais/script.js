const rounds = [
  {
    loose: { emoji: "🛞", label: "Pneu" },
    targets: [
      { emoji: "🪙", label: "Moeda", correct: true },
      { emoji: "📚", label: "Livros" },
      { emoji: "🌳", label: "Árvore" },
      { emoji: "☕", label: "Xícara" },
    ],
    connection: "Pneu e moeda têm uma relação funcional: os dois podem rolar.",
  },
  {
    loose: { emoji: "✉️", label: "Selo postal" },
    targets: [
      { emoji: "🎁", label: "Presente", correct: true },
      { emoji: "🛏️", label: "Cama" },
      { emoji: "🎸", label: "Violão" },
      { emoji: "🍎", label: "Maçã" },
    ],
    connection: "Selo postal e presente podem ser enviados para alguém.",
  },
  {
    loose: { emoji: "🔑", label: "Chave" },
    targets: [
      { emoji: "🔐", label: "Cadeado", correct: true },
      { emoji: "🖼️", label: "Quadro" },
      { emoji: "🎈", label: "Balão" },
      { emoji: "🥕", label: "Cenoura" },
    ],
    connection: "Chave e cadeado se relacionam porque um permite abrir o outro.",
  },
  {
    loose: { emoji: "☂️", label: "Guarda-chuva" },
    targets: [
      { emoji: "🏠", label: "Casa", correct: true },
      { emoji: "🎂", label: "Bolo" },
      { emoji: "🚲", label: "Bicicleta" },
      { emoji: "📖", label: "Livro" },
    ],
    connection: "Guarda-chuva e casa podem nos proteger da chuva.",
  },
  {
    loose: { emoji: "🕯️", label: "Vela" },
    targets: [
      { emoji: "🔦", label: "Lanterna", correct: true },
      { emoji: "⚽", label: "Bola" },
      { emoji: "🪴", label: "Planta" },
      { emoji: "🧤", label: "Luva" },
    ],
    connection: "Vela e lanterna têm a mesma função: iluminar um lugar escuro.",
  },
  {
    loose: { emoji: "🗺️", label: "Mapa" },
    targets: [
      { emoji: "🧭", label: "Bússola", correct: true },
      { emoji: "🎨", label: "Tinta" },
      { emoji: "🧁", label: "Bolo pequeno" },
      { emoji: "🪥", label: "Escova de dentes" },
    ],
    connection: "Mapa e bússola ajudam uma pessoa a se orientar no caminho.",
  },
];

const looseCard = document.querySelector("#loose-card");
const targetGrid = document.querySelector("#target-grid");
const roundNumber = document.querySelector("#round-number");
const totalRounds = document.querySelector("#total-rounds");
const scoreElement = document.querySelector("#score");
const instruction = document.querySelector("#instruction");
const feedback = document.querySelector("#feedback");
const restartButton = document.querySelector("#restart-button");
const nextButton = document.querySelector("#next-button");
const victoryDialog = document.querySelector("#victory-dialog");
const victorySummary = document.querySelector("#victory-summary");
const playAgainButton = document.querySelector("#play-again-button");

let currentRound = 0;
let score = 0;
let selected = false;
let roundComplete = false;

const shuffle = (items) => {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
};

const createCardContents = ({ emoji, label }) => `
  <span class="card-emoji" aria-hidden="true">${emoji}</span>
  <span class="card-label">${label}</span>
`;

const updateStatus = () => {
  roundNumber.textContent = currentRound + 1;
  totalRounds.textContent = rounds.length;
  scoreElement.textContent = score;
};

const deselectLooseCard = () => {
  selected = false;
  looseCard.classList.remove("is-selected");
  looseCard.setAttribute("aria-pressed", "false");
};

const selectLooseCard = () => {
  if (roundComplete) return;

  selected = !selected;
  looseCard.classList.toggle("is-selected", selected);
  looseCard.setAttribute("aria-pressed", String(selected));
  feedback.textContent = selected ? "Agora escolha uma das quatro imagens." : "";
};

const resolveChoice = (target) => {
  if (roundComplete) return;

  if (!selected) {
    selectLooseCard();
    feedback.textContent = "Primeiro selecione a carta solta; depois escolha uma imagem.";
    return;
  }

  if (!target.dataset.correct) {
    feedback.textContent = "Essa conexão não é a que procuramos. Tente pensar no que as imagens podem fazer.";
    target.classList.remove("is-incorrect");
    window.requestAnimationFrame(() => target.classList.add("is-incorrect"));
    return;
  }

  roundComplete = true;
  score += 1;
  updateStatus();
  looseCard.classList.add("is-connected");
  target.classList.add("is-correct");
  looseCard.disabled = true;
  targetGrid.querySelectorAll("button").forEach((card) => {
    card.disabled = true;
  });
  deselectLooseCard();
  instruction.textContent = "Boa conexão! Veja a relação que une essas imagens.";
  feedback.textContent = rounds[currentRound].connection;

  if (currentRound === rounds.length - 1) {
    nextButton.textContent = "Ver resultado";
  } else {
    nextButton.textContent = "Próxima conexão";
  }

  nextButton.hidden = false;
  nextButton.focus();
};

const handleDrop = (event) => {
  event.preventDefault();
  event.currentTarget.classList.remove("is-drag-over");
  selected = true;
  resolveChoice(event.currentTarget);
};

const renderRound = () => {
  const round = rounds[currentRound];

  roundComplete = false;
  deselectLooseCard();
  updateStatus();
  feedback.textContent = "";
  nextButton.hidden = true;
  looseCard.disabled = false;
  looseCard.innerHTML = createCardContents(round.loose);
  looseCard.setAttribute("aria-label", `Carta solta: ${round.loose.label}. Toque para selecionar ou arraste.`);
  instruction.textContent = "Arraste a carta solta para a imagem que combina com ela. Se preferir, toque na carta e depois no destino.";
  targetGrid.replaceChildren();

  shuffle(round.targets).forEach((target) => {
    const card = document.createElement("button");
    card.className = "idea-card target-card";
    card.type = "button";
    card.dataset.correct = target.correct ? "true" : "";
    card.innerHTML = createCardContents(target);
    card.setAttribute("aria-label", `Destino: ${target.label}`);
    card.addEventListener("click", () => resolveChoice(card));
    card.addEventListener("dragover", (event) => {
      event.preventDefault();
      if (!roundComplete) card.classList.add("is-drag-over");
    });
    card.addEventListener("dragleave", () => card.classList.remove("is-drag-over"));
    card.addEventListener("drop", handleDrop);
    card.addEventListener("animationend", () => card.classList.remove("is-incorrect"));
    targetGrid.append(card);
  });
};

const goToNextRound = () => {
  if (!roundComplete) return;

  if (currentRound === rounds.length - 1) {
    victorySummary.textContent = `Você encontrou ${score} de ${rounds.length} conexões. Ideias diferentes também podem ter algo importante em comum.`;
    victoryDialog.showModal();
    return;
  }

  currentRound += 1;
  renderRound();
  looseCard.focus();
};

const startGame = () => {
  currentRound = 0;
  score = 0;
  victoryDialog.close();
  renderRound();
};

looseCard.addEventListener("click", selectLooseCard);
looseCard.addEventListener("dragstart", (event) => {
  if (roundComplete) {
    event.preventDefault();
    return;
  }

  selected = true;
  looseCard.classList.add("is-dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", "idea-card");
});
looseCard.addEventListener("dragend", () => looseCard.classList.remove("is-dragging"));
restartButton.addEventListener("click", startGame);
nextButton.addEventListener("click", goToNextRound);
playAgainButton.addEventListener("click", startGame);

startGame();
