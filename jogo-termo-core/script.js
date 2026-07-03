const DEFAULT_CONFIG = {
  mode: "unico",
  title: "Palavra Secreta",
  boardCount: 1,
  maxAttempts: 6,
};

const config = Object.freeze({
  ...DEFAULT_CONFIG,
  ...(window.WORD_GAME_CONFIG || {}),
});

const DAILY_GAME_ID = "jogo-de-palavras";
const WORD_GOALS = {
  unico: { good: 5, standout: 3, goodLabel: "5 tentativas", standoutLabel: "3 tentativas" },
  dueto: { good: 6, standout: 4, goodLabel: "6 tentativas", standoutLabel: "4 tentativas" },
  quarteto: { good: 8, standout: 6, goodLabel: "8 tentativas", standoutLabel: "6 tentativas" },
};

const LETTER_COUNT = 5;
const STATUS_PRIORITY = {
  absent: 1,
  present: 2,
  correct: 3,
};
const STATUS_LABELS = {
  absent: "ausente",
  present: "em outra posição",
  correct: "correta",
};
const SHARE_SQUARES = {
  absent: "⬛",
  present: "🟨",
  correct: "🟩",
};
const KEYBOARD_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

const TARGET_WORDS = [
  "amigo",
  "aluno",
  "anexo",
  "antes",
  "apoio",
  "areia",
  "avião",
  "azedo",
  "banco",
  "barco",
  "brasa",
  "brisa",
  "calma",
  "campo",
  "canto",
  "carta",
  "casal",
  "causa",
  "chave",
  "cheio",
  "chuva",
  "claro",
  "coisa",
  "conta",
  "corpo",
  "corte",
  "curva",
  "dança",
  "dente",
  "dever",
  "disco",
  "duplo",
  "entre",
  "exato",
  "fazer",
  "festa",
  "filme",
  "final",
  "força",
  "forte",
  "frase",
  "fruto",
  "gente",
  "gesto",
  "grade",
  "grupo",
  "haver",
  "hiena",
  "homem",
  "idade",
  "ideia",
  "igual",
  "jovem",
  "justo",
  "livro",
  "lugar",
  "luzes",
  "marca",
  "metal",
  "metro",
  "mundo",
  "noite",
  "nobre",
  "olhos",
  "ordem",
  "papel",
  "pardo",
  "parte",
  "passo",
  "pedra",
  "peixe",
  "perda",
  "perto",
  "plano",
  "ponto",
  "porta",
  "praia",
  "prato",
  "praça",
  "preço",
  "prova",
  "quase",
  "ritmo",
  "risco",
  "roupa",
  "saber",
  "sabor",
  "saúde",
  "senso",
  "senha",
  "sinal",
  "sonho",
  "sorte",
  "tarde",
  "tempo",
  "terra",
  "texto",
  "tomar",
  "tórax",
  "trigo",
  "troca",
  "turno",
  "valor",
  "vento",
  "verde",
  "verso",
  "vidro",
  "vinho",
  "vista",
  "viver",
  "voraz",
  "zelar",
];

const EXTRA_WORDS = [
  "termo",
  "turma",
  "viola",
  "pulga",
  "abrir",
  "acima",
  "adiar",
  "afeto",
  "agora",
  "ajuda",
  "ambos",
  "andar",
  "anexo",
  "apego",
  "apito",
  "arroz",
  "astro",
  "atriz",
  "baixo",
  "balde",
  "barra",
  "beijo",
  "bicho",
  "bolsa",
  "bolso",
  "breve",
  "caixa",
  "canal",
  "ceder",
  "censo",
  "cerco",
  "certa",
  "certo",
  "cesta",
  "cinto",
  "civil",
  "cível",
  "cobra",
  "cobre",
  "comer",
  "comum",
  "coral",
  "coroa",
  "criar",
  "crise",
  "cruel",
  "dente",
  "desde",
  "digno",
  "dizer",
  "doido",
  "dorso",
  "drama",
  "elite",
  "enfim",
  "então",
  "estar",
  "exato",
  "êxito",
  "falar",
  "falso",
  "farto",
  "fatia",
  "feliz",
  "ferro",
  "fibra",
  "ficha",
  "fixar",
  "folha",
  "fonte",
  "forma",
  "forte",
  "fundo",
  "ganho",
  "garfo",
  "gasto",
  "girar",
  "globo",
  "golpe",
  "graça",
  "grave",
  "honra",
  "hotel",
  "humor",
  "jeito",
  "jogar",
  "lento",
  "limpo",
  "linha",
  "lindo",
  "longo",
  "lutar",
  "maior",
  "menor",
  "mesma",
  "mesmo",
  "moral",
  "morte",
  "motor",
  "mudar",
  "mural",
  "natal",
  "navio",
  "negro",
  "ninho",
  "nível",
  "nuvem",
  "obter",
  "ontem",
  "opção",
  "ouvir",
  "padre",
  "pagar",
  "palco",
  "pardo",
  "pasta",
  "pátio",
  "pavio",
  "pilar",
  "pista",
  "poder",
  "porão",
  "posto",
  "pouco",
  "primo",
  "puxar",
  "quero",
  "raiva",
  "ramal",
  "regar",
  "reino",
  "renda",
  "rente",
  "resto",
  "rosto",
  "sábio",
  "salão",
  "salsa",
  "santo",
  "secar",
  "selar",
  "sério",
  "sesta",
  "sótão",
  "suave",
  "subir",
  "suíço",
  "tecla",
  "tênis",
  "tenso",
  "tinta",
  "tocar",
  "torre",
  "total",
  "trama",
  "trave",
  "tribo",
  "único",
  "unido",
  "urgir",
  "vazio",
  "velho",
  "vença",
  "vento",
  "verbo",
  "votar",
  "zebra",
];

const normalizeLetters = (value) => String(value)
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLocaleUpperCase("pt-BR")
  .replace(/[^A-Z]/g, "");

const sanitizeInput = (value) => normalizeLetters(value).slice(0, LETTER_COUNT);

const createEntries = (words) => {
  const entriesByWord = new Map();

  words.forEach((word) => {
    const display = String(word).trim().toLocaleUpperCase("pt-BR").normalize("NFC");
    const normalized = normalizeLetters(display);

    if (normalized.length === LETTER_COUNT && !entriesByWord.has(normalized)) {
      entriesByWord.set(normalized, { display, normalized });
    }
  });

  return [...entriesByWord.values()];
};

const ANSWER_ENTRIES = createEntries(TARGET_WORDS);
const DICTIONARY_ENTRIES = createEntries([...TARGET_WORDS, ...EXTRA_WORDS]);
const DICTIONARY = new Map(DICTIONARY_ENTRIES.map((entry) => [entry.normalized, entry]));

const wordGame = document.querySelector("#word-game");
const boardsElement = document.querySelector("#boards");
const keyboardElement = document.querySelector("#keyboard");
const messageElement = document.querySelector("#game-message");
const attemptCountElement = document.querySelector("#attempt-count");
const solvedCountElement = document.querySelector("#solved-count");
const roundLabelElement = document.querySelector("#round-label");
const dailyStatus = document.querySelector("#daily-status");
const contrastToggle = document.querySelector("#contrast-toggle");
const guessForm = document.querySelector("#guess-form");
const guessInput = document.querySelector("#guess-input");
const newGameButton = document.querySelector("#new-game-button");
const submitButton = document.querySelector("#submit-button");
const shareButton = document.querySelector("#share-button");
const dialogShareButton = document.querySelector("#dialog-share-button");
const resultDialog = document.querySelector("#result-dialog");
const resultEyebrow = document.querySelector("#result-eyebrow");
const resultTitle = document.querySelector("#result-title");
const resultSummary = document.querySelector("#result-summary");
const playAgainButton = document.querySelector("#play-again-button");

const state = {
  targets: [],
  boards: [],
  guesses: [],
  attempt: 0,
  ended: false,
  won: false,
  roundLabel: "Dia",
  shakeTimer: undefined,
  currentGuess: "",
};

const syncGuessInput = () => {
  if (!guessInput) return;

  guessInput.value = state.currentGuess;
  guessInput.disabled = state.ended;
  if (submitButton) submitButton.disabled = state.ended;
};

const updateDailyStatus = () => {
  dailyStatus.textContent = ReabilityDaily.statusText({
    gameId: DAILY_GAME_ID,
    levelKey: config.mode,
    levelName: config.title,
  });

  document.querySelectorAll(".mode-link").forEach((link) => {
    ReabilityDaily.updateLevelLock(link, DAILY_GAME_ID, link.dataset.mode);
  });
};

const requestDailyAttempt = async () => {
  const playerName = await ReabilityDaily.ensurePlayerName();
  const attempt = ReabilityDaily.recordAttempt(DAILY_GAME_ID, config.mode);
  updateDailyStatus();

  if (!attempt.ok) {
    ReabilityDaily.showLimitDialog({
      gameTitle: "Jogo de Palavras",
      levelName: config.title,
    });
    return null;
  }

  return { ...attempt, playerName };
};

const clearGoalResult = () => {
  resultSummary.parentElement.querySelector(".goal-result")?.remove();
};

const localDayStamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const hashString = (value) => {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

const createRandom = (seed) => {
  let value = seed >>> 0;

  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);

    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
};

const countLetters = (word) => {
  const counts = new Map();

  [...word].forEach((letter) => {
    counts.set(letter, (counts.get(letter) || 0) + 1);
  });

  return counts;
};

const sharedLetterCount = (left, right) => {
  const leftCounts = countLetters(left);
  const rightCounts = countLetters(right);
  let shared = 0;

  leftCounts.forEach((count, letter) => {
    shared += Math.min(count, rightCounts.get(letter) || 0);
  });

  return shared;
};

const samePositionCount = (left, right) => {
  let same = 0;

  for (let index = 0; index < LETTER_COUNT; index += 1) {
    if (left[index] === right[index]) same += 1;
  }

  return same;
};

const getPairRelation = (left, right) => {
  const shared = sharedLetterCount(left.normalized, right.normalized);
  const samePosition = samePositionCount(left.normalized, right.normalized);

  return {
    shared,
    samePosition,
    displacedShared: Math.max(0, shared - samePosition),
  };
};

const RELATED_WORD_RULES = {
  dueto: {
    minShared: 3,
    strongShared: 4,
    maxSamePosition: 1,
    minDisplacedShared: 2,
    shortlistSize: 18,
    attempts: 36,
    minStrongPairs: 1,
  },
  quarteto: {
    minShared: 2,
    strongShared: 3,
    maxSamePosition: 1,
    minDisplacedShared: 1,
    shortlistSize: 24,
    attempts: 72,
    minStrongPairs: 3,
  },
};

const scorePairRelation = (relation, rules) => {
  if (relation.shared < rules.minShared) return Number.NEGATIVE_INFINITY;
  if (relation.samePosition > rules.maxSamePosition) return Number.NEGATIVE_INFINITY;
  if (relation.displacedShared < rules.minDisplacedShared) return Number.NEGATIVE_INFINITY;

  let score = relation.shared * 24;
  score += relation.displacedShared * 16;
  score -= relation.samePosition * 18;

  if (relation.shared >= rules.strongShared) score += 14;
  if (relation.samePosition === 0) score += 8;

  return score;
};

const countCrossBoardLetters = (group) => {
  const appearances = new Map();

  group.forEach((entry) => {
    new Set([...entry.normalized]).forEach((letter) => {
      appearances.set(letter, (appearances.get(letter) || 0) + 1);
    });
  });

  return [...appearances.values()].filter((count) => count > 1).length;
};

const scoreGroup = (group, rules) => {
  let score = 0;
  let strongPairs = 0;

  for (let leftIndex = 0; leftIndex < group.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < group.length; rightIndex += 1) {
      const relation = getPairRelation(group[leftIndex], group[rightIndex]);
      const pairScore = scorePairRelation(relation, rules);

      if (!Number.isFinite(pairScore)) return Number.NEGATIVE_INFINITY;

      score += pairScore;
      if (relation.shared >= rules.strongShared) strongPairs += 1;
    }
  }

  if (strongPairs < rules.minStrongPairs) {
    score -= (rules.minStrongPairs - strongPairs) * 40;
  }

  return score + countCrossBoardLetters(group) * 6;
};

const scoreCandidateForGroup = (candidate, group, rules) => {
  const nextGroup = [...group, candidate];
  return scoreGroup(nextGroup, rules);
};

const pickRankedCandidate = (rankedCandidates, random, shortlistSize) => {
  const shortlist = rankedCandidates.slice(0, shortlistSize);
  const index = Math.min(
    shortlist.length - 1,
    Math.floor((random() ** 1.7) * shortlist.length),
  );

  return shortlist[index]?.entry;
};

const shuffleEntries = (entries, random) => {
  const shuffled = [...entries];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
};

const chooseRandomTargets = (random) => {
  const pool = [...ANSWER_ENTRIES];
  const chosen = [];

  while (chosen.length < config.boardCount && pool.length > 0) {
    const index = Math.floor(random() * pool.length);
    chosen.push(pool.splice(index, 1)[0]);
  }

  return chosen;
};

const buildRelatedGroup = (random, rules) => {
  const pool = [...ANSWER_ENTRIES];
  const group = [pool.splice(Math.floor(random() * pool.length), 1)[0]];

  while (group.length < config.boardCount && pool.length > 0) {
    const rankedCandidates = pool
      .map((entry) => ({
        entry,
        score: scoreCandidateForGroup(entry, group, rules),
      }))
      .filter((candidate) => Number.isFinite(candidate.score))
      .sort((left, right) => right.score - left.score);

    if (rankedCandidates.length === 0) break;

    const nextEntry = pickRankedCandidate(rankedCandidates, random, rules.shortlistSize);
    const nextIndex = pool.findIndex((entry) => entry.normalized === nextEntry.normalized);

    group.push(...pool.splice(nextIndex, 1));
  }

  return group;
};

const chooseRelatedTargets = (seed, rules) => {
  const random = createRandom(seed);
  let bestGroup = [];
  let bestScore = Number.NEGATIVE_INFINITY;

  for (let attempt = 0; attempt < rules.attempts; attempt += 1) {
    const group = buildRelatedGroup(random, rules);
    const score = group.length === config.boardCount
      ? scoreGroup(group, rules)
      : Number.NEGATIVE_INFINITY;

    if (score > bestScore) {
      bestGroup = group;
      bestScore = score;
    }
  }

  if (bestGroup.length === config.boardCount) {
    return shuffleEntries(bestGroup, createRandom(seed ^ 0x9e3779b9));
  }

  return chooseRandomTargets(createRandom(seed));
};

const dailySeed = (attempt = {}) => {
  const playerName = attempt.playerName || ReabilityDaily.getProfile?.().name || "visitante";
  const playerKey = normalizeLetters(playerName) || "VISITANTE";
  const attemptKey = Number(attempt.used || 1);

  return hashString(`${localDayStamp()}:${config.mode}:${playerKey}:${attemptKey}`);
};

const chooseTargets = (seed) => {
  const rules = RELATED_WORD_RULES[config.mode];

  if (rules && config.boardCount > 1) {
    return chooseRelatedTargets(seed, rules);
  }

  return chooseRandomTargets(createRandom(seed));
};

const createBoardState = (target, index) => ({
  title: config.boardCount === 1 ? "Palavra" : `Palavra ${index + 1}`,
  target,
  rows: [],
  solvedAt: undefined,
});

const evaluateGuess = (guess, target) => {
  const guessLetters = [...guess];
  const targetLetters = [...target];
  const statuses = Array(LETTER_COUNT).fill("absent");
  const remaining = new Map();

  for (let index = 0; index < LETTER_COUNT; index += 1) {
    if (guessLetters[index] === targetLetters[index]) {
      statuses[index] = "correct";
    } else {
      const letter = targetLetters[index];
      remaining.set(letter, (remaining.get(letter) || 0) + 1);
    }
  }

  for (let index = 0; index < LETTER_COUNT; index += 1) {
    const letter = guessLetters[index];

    if (statuses[index] !== "correct" && (remaining.get(letter) || 0) > 0) {
      statuses[index] = "present";
      remaining.set(letter, remaining.get(letter) - 1);
    }
  }

  return statuses;
};

const solvedCount = () => state.boards.filter((board) => board.solvedAt).length;

const setMessage = (message) => {
  messageElement.textContent = message;
};

const attemptWord = (count) => (count === 1 ? "tentativa" : "tentativas");

const openDialog = () => {
  if (typeof resultDialog.showModal === "function") {
    resultDialog.showModal();
    return;
  }

  resultDialog.setAttribute("open", "");
};

const closeDialog = () => {
  if (!resultDialog.open) return;
  resultDialog.close();
};

const shakeBoards = () => {
  window.clearTimeout(state.shakeTimer);
  wordGame.classList.add("is-shaking");
  state.shakeTimer = window.setTimeout(() => {
    wordGame.classList.remove("is-shaking");
  }, 240);
};

const initBoardsDOM = () => {
  boardsElement.className = `boards boards--${config.mode}`;
  boardsElement.replaceChildren(...state.boards.map((board, boardIndex) => {
    const boardNode = document.createElement("article");
    boardNode.className = "word-board";
    boardNode.id = `board-${boardIndex}`;
    boardNode.setAttribute("aria-label", `${board.title} do ${config.title}`);

    const header = document.createElement("div");
    header.className = "word-board__header";
    const title = document.createElement("h2");
    title.textContent = board.title;
    const badge = document.createElement("span");
    badge.className = "board-badge";
    badge.textContent = "Aberta";
    header.append(title, badge);

    const grid = document.createElement("div");
    grid.className = "board-grid";
    grid.setAttribute("role", "group");
    grid.setAttribute("aria-label", `Tentativas da ${board.title.toLowerCase()}`);

    for (let rowIndex = 0; rowIndex < config.maxAttempts; rowIndex += 1) {
      const row = document.createElement("div");
      row.className = "word-row";
      row.id = `board-${boardIndex}-row-${rowIndex}`;
      row.setAttribute("role", "group");
      row.setAttribute("aria-label", `Tentativa ${rowIndex + 1}`);

      for (let letterIndex = 0; letterIndex < LETTER_COUNT; letterIndex += 1) {
        const tile = document.createElement("span");
        tile.className = "letter-tile";
        tile.id = `board-${boardIndex}-row-${rowIndex}-tile-${letterIndex}`;
        tile.setAttribute("aria-label", "vazio");
        row.append(tile);
      }
      grid.append(row);
    }

    boardNode.append(header, grid);
    boardNode.style.setProperty("--board-index", boardIndex);
    return boardNode;
  }));
};

const updateBoardsDOM = (animateRowIndex = -1) => {
  state.boards.forEach((board, boardIndex) => {
    const boardNode = document.getElementById(`board-${boardIndex}`);
    if (!boardNode) return;

    if (board.solvedAt) {
      boardNode.classList.add("is-solved");
      const badge = boardNode.querySelector(".board-badge");
      if (badge) badge.textContent = `${board.solvedAt}/${config.maxAttempts}`;
    } else {
      boardNode.classList.remove("is-solved");
      const badge = boardNode.querySelector(".board-badge");
      if (badge) badge.textContent = "Aberta";
    }

    for (let rowIndex = 0; rowIndex < config.maxAttempts; rowIndex += 1) {
      const rowResult = board.rows[rowIndex];
      const isCurrent = !state.ended && !board.solvedAt && rowIndex === state.attempt;
      const inputLetters = [...state.currentGuess];

      const rowNode = document.getElementById(`board-${boardIndex}-row-${rowIndex}`);
      if (!rowNode) continue;

      for (let letterIndex = 0; letterIndex < LETTER_COUNT; letterIndex += 1) {
        const tileNode = document.getElementById(`board-${boardIndex}-row-${rowIndex}-tile-${letterIndex}`);
        if (!tileNode) continue;

        if (rowResult) {
          const letter = rowResult.display[letterIndex] || "";
          const status = rowResult.statuses[letterIndex];

          tileNode.textContent = letter;
          tileNode.setAttribute("aria-label", `${letter}, ${STATUS_LABELS[status]}`);
          tileNode.className = `letter-tile letter-tile--${status}`;

          if (rowIndex === animateRowIndex) {
            tileNode.style.animationDelay = `${letterIndex * 150}ms`;
            tileNode.classList.add("letter-tile--flip");
          } else {
            tileNode.style.animationDelay = "";
            tileNode.classList.remove("letter-tile--flip");
          }
        } else if (isCurrent) {
          const letter = inputLetters[letterIndex] || "";
          tileNode.textContent = letter;
          tileNode.setAttribute("aria-label", letter || "vazio");
          tileNode.className = "letter-tile letter-tile--current";
          tileNode.style.animationDelay = "";
          tileNode.classList.remove("letter-tile--flip");
        } else {
          tileNode.textContent = "";
          tileNode.setAttribute("aria-label", "vazio");
          tileNode.className = "letter-tile";
          tileNode.style.animationDelay = "";
          tileNode.classList.remove("letter-tile--flip");
        }
      }
    }
  });
};

const getStatusesByLetterPerBoard = () => {
  const results = new Map();
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  [...letters].forEach((letter) => {
    results.set(letter, Array(config.boardCount).fill(null));
  });

  state.boards.forEach((board, boardIndex) => {
    board.rows.forEach((row) => {
      if (!row) return;

      [...row.normalized].forEach((letter, index) => {
        const status = row.statuses[index];
        const currentStatuses = results.get(letter);
        if (currentStatuses) {
          const currentStatus = currentStatuses[boardIndex];
          if (!currentStatus || STATUS_PRIORITY[status] > STATUS_PRIORITY[currentStatus]) {
            currentStatuses[boardIndex] = status;
          }
        }
      });
    });
  });

  return results;
};

const updateKeyboard = () => {
  const letterStatuses = getStatusesByLetterPerBoard();

  keyboardElement.querySelectorAll("[data-key]").forEach((button) => {
    const key = button.dataset.key;
    button.disabled = state.ended;

    const statuses = letterStatuses.get(key);
    if (!statuses) return;

    let hasAnyStatus = false;
    statuses.forEach((status, boardIndex) => {
      const segment = button.querySelector(`.key-status-segment[data-board="${boardIndex}"]`);
      if (segment) {
        if (status) {
          segment.dataset.status = status;
          hasAnyStatus = true;
        } else {
          delete segment.dataset.status;
        }
      }
    });

    if (hasAnyStatus) {
      button.classList.add("has-status");
    } else {
      button.classList.remove("has-status");
    }
  });
};

const renderStats = () => {
  attemptCountElement.textContent = `${state.attempt}/${config.maxAttempts}`;
  solvedCountElement.textContent = `${solvedCount()}/${config.boardCount}`;
  roundLabelElement.textContent = state.roundLabel;
};

const render = (animateRowIndex = -1) => {
  renderStats();
  updateBoardsDOM(animateRowIndex);
  updateKeyboard();
  syncGuessInput();
  shareButton.disabled = !state.ended;
};

const startGame = (seed, roundLabel = "Dia") => {
  closeDialog();
  clearGoalResult();
  window.clearTimeout(state.shakeTimer);
  wordGame.classList.remove("is-shaking");

  state.targets = chooseTargets(seed);
  state.boards = state.targets.map(createBoardState);
  state.guesses = [];
  state.attempt = 0;
  state.ended = false;
  state.won = false;
  state.roundLabel = roundLabel;
  state.currentGuess = "";

  initBoardsDOM();
  render();
  setMessage(
    config.boardCount === 1
      ? `Descubra a palavra em ${config.maxAttempts} ${attemptWord(config.maxAttempts)}.`
      : `Resolva ${config.boardCount} palavras com os mesmos palpites.`,
  );
};

const showLimitState = () => {
  closeDialog();
  window.clearTimeout(state.shakeTimer);
  wordGame.classList.remove("is-shaking");

  state.targets = [];
  state.boards = [];
  state.guesses = [];
  state.attempt = 0;
  state.ended = true;
  state.won = false;
  state.roundLabel = "Limite";
  state.currentGuess = "";

  clearGoalResult();
  initBoardsDOM();
  render();
  setMessage("Limite diário atingido para este modo. O contador reinicia amanhã.");
};

const startRandomGame = async () => {
  if (!(await requestDailyAttempt())) {
    showLimitState();
    return;
  }

  const seed = hashString(`${Date.now()}:${Math.random()}:${config.mode}`);
  startGame(seed, "Livre");
};

const startDailyGame = async () => {
  const attempt = await requestDailyAttempt();

  if (!attempt) {
    showLimitState();
    return;
  }

  startGame(dailySeed(attempt), "Dia");
};

const endGame = (won) => {
  state.ended = true;
  state.won = won;
  render();

  const answers = state.boards.map((board) => board.target.display).join(", ");

  if (won) {
    resultEyebrow.textContent = "Desafio concluído";
    resultTitle.textContent = config.title;
    resultSummary.textContent = `Você resolveu ${config.boardCount} ${config.boardCount === 1 ? "palavra" : "palavras"} em ${state.attempt} ${attemptWord(state.attempt)}.`;
    ReabilityDaily.goals.showGoalResult(
      resultSummary,
      ReabilityDaily.goals.rateLower(state.attempt, WORD_GOALS[config.mode]),
    );
    setMessage(`Concluído em ${state.attempt} ${attemptWord(state.attempt)}.`);
  } else {
    resultEyebrow.textContent = "Fim das tentativas";
    resultTitle.textContent = config.title;
    resultSummary.textContent = `As respostas eram: ${answers}. Tente uma nova rodada para continuar treinando.`;
    ReabilityDaily.goals.showGoalResult(resultSummary, {
      tier: "training",
      label: "Meta do dia",
      message: `Boa meta: até ${WORD_GOALS[config.mode].goodLabel}. Destaque: até ${WORD_GOALS[config.mode].standoutLabel}.`,
    });
    setMessage(`Respostas: ${answers}.`);
  }

  openDialog();
};

const handleInvalidGuess = (message) => {
  setMessage(message);
  shakeBoards();
};

const submitGuess = () => {
  if (state.ended) return;

  const normalized = sanitizeInput(state.currentGuess);

  if (normalized.length !== LETTER_COUNT) {
    handleInvalidGuess("Digite uma palavra com 5 letras.");
    return;
  }

  if (!DICTIONARY.has(normalized)) {
    handleInvalidGuess("Palavra fora da lista deste jogo.");
    return;
  }

  const entry = DICTIONARY.get(normalized);
  const attemptNumber = state.attempt + 1;

  state.boards.forEach((board) => {
    if (board.solvedAt) {
      board.rows.push(null);
      return;
    }

    const statuses = evaluateGuess(normalized, board.target.normalized);
    const solved = statuses.every((status) => status === "correct");

    board.rows.push({
      display: entry.display,
      normalized,
      statuses,
    });

    if (solved) board.solvedAt = attemptNumber;
  });

  state.guesses.push(entry);
  const prevAttempt = state.attempt;
  state.attempt = attemptNumber;
  state.currentGuess = "";

  if (solvedCount() === config.boardCount) {
    render(prevAttempt);
    setTimeout(() => {
      endGame(true);
    }, config.boardCount * 150 + 500);
    return;
  }

  if (state.attempt >= config.maxAttempts) {
    render(prevAttempt);
    setTimeout(() => {
      endGame(false);
    }, config.boardCount * 150 + 500);
    return;
  }

  render(prevAttempt);

  const remaining = config.maxAttempts - state.attempt;
  const solved = solvedCount();
  setMessage(
    solved > 0
      ? `${solved}/${config.boardCount} resolvidas. Restam ${remaining} ${attemptWord(remaining)}.`
      : `Continue. Restam ${remaining} ${attemptWord(remaining)}.`,
  );
};

const appendLetter = (letter) => {
  if (state.ended || state.currentGuess.length >= LETTER_COUNT) return;

  state.currentGuess = sanitizeInput(`${state.currentGuess}${letter}`);
  render();
};

const removeLetter = () => {
  if (state.ended || state.currentGuess.length === 0) return;

  state.currentGuess = state.currentGuess.slice(0, -1);
  render();
};

const createKeyButton = (label, key, className = "") => {
  const button = document.createElement("button");

  button.className = `key ${className}`.trim();
  button.type = "button";
  button.dataset.key = key;

  const labelSpan = document.createElement("span");
  labelSpan.className = "key-label";
  labelSpan.textContent = label;

  if (key === "ENTER" || key === "BACKSPACE") {
    button.append(labelSpan);
    if (key === "ENTER") button.setAttribute("aria-label", "Enviar palpite");
    if (key === "BACKSPACE") button.setAttribute("aria-label", "Apagar letra");
    return button;
  }

  const bgContainer = document.createElement("span");
  bgContainer.className = `key-status-bg key-status-bg--${config.mode}`;

  const segmentCount = config.boardCount;
  for (let i = 0; i < segmentCount; i++) {
    const segment = document.createElement("span");
    segment.className = "key-status-segment";
    segment.dataset.board = i;
    bgContainer.append(segment);
  }

  button.append(bgContainer, labelSpan);
  return button;
};

const renderKeyboard = () => {
  const rows = KEYBOARD_ROWS.map((letters, rowIndex) => {
    const row = document.createElement("div");

    row.className = "keyboard-row";
    if (rowIndex === 2) row.append(createKeyButton("↵", "ENTER", "key--wide"));

    [...letters].forEach((letter) => {
      row.append(createKeyButton(letter, letter));
    });

    if (rowIndex === 2) row.append(createKeyButton("⌫", "BACKSPACE", "key--wide"));

    return row;
  });

  keyboardElement.replaceChildren(...rows);
};

const createShareText = () => {
  const result = state.won ? state.attempt : "X";
  const heading = `${config.title} ${result}/${config.maxAttempts} - ${localDayStamp()}`;
  const boardLines = state.boards.map((board) => {
    const rows = board.rows
      .filter(Boolean)
      .map((row) => row.statuses.map((status) => SHARE_SQUARES[status]).join(""))
      .join("\n");

    return `${board.title}\n${rows}`;
  });

  return [heading, ...boardLines].join("\n\n");
};

const writeClipboard = async (text) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (error) {
    // Fall back to selection copy below
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.append(textarea);
  textarea.select();

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch (error) {
    copied = false;
  }

  textarea.remove();
  return copied;
};

const copyResult = async () => {
  const copied = await writeClipboard(createShareText());
  setMessage(copied ? "Resultado copiado." : "Não foi possível copiar automaticamente.");
};

const handleKeyboardClick = (event) => {
  const button = event.target.closest("[data-key]");
  if (!button || state.ended) return;

  const { key } = button.dataset;

  if (key === "ENTER") {
    submitGuess();
    return;
  }

  if (key === "BACKSPACE") {
    removeLetter();
    return;
  }

  appendLetter(key);
};

const handleDocumentKeydown = (event) => {
  if (state.ended || document.querySelector("dialog[open]") || event.ctrlKey || event.metaKey || event.altKey) return;

  if (event.key === "Enter") {
    event.preventDefault();
    submitGuess();
    return;
  }

  if (event.key === "Backspace") {
    event.preventDefault();
    removeLetter();
    return;
  }

  const letter = sanitizeInput(event.key);
  if (letter.length === 1) {
    event.preventDefault();
    appendLetter(letter);
  }
};

const handleGuessInput = (event) => {
  if (state.ended) {
    syncGuessInput();
    return;
  }

  state.currentGuess = sanitizeInput(event.currentTarget.value);
  render();
};

const handleGuessSubmit = (event) => {
  event.preventDefault();

  if (guessInput) {
    state.currentGuess = sanitizeInput(guessInput.value);
    syncGuessInput();
  }

  submitGuess();
  guessInput?.focus();
};

document.body.classList.add(`word-mode-${config.mode}`);
document.querySelectorAll(".mode-link").forEach((link) => {
  if (link.dataset.mode === config.mode) link.setAttribute("aria-current", "page");
});

renderKeyboard();
keyboardElement.addEventListener("click", handleKeyboardClick);
document.addEventListener("keydown", handleDocumentKeydown);
if (guessInput) guessInput.addEventListener("input", handleGuessInput);
if (guessForm) guessForm.addEventListener("submit", handleGuessSubmit);
contrastToggle.addEventListener("change", () => {
  wordGame.classList.toggle("is-contrast", contrastToggle.checked);
});
if (newGameButton) newGameButton.addEventListener("click", startRandomGame);
if (shareButton) shareButton.addEventListener("click", copyResult);
if (dialogShareButton) dialogShareButton.addEventListener("click", copyResult);
if (playAgainButton) playAgainButton.addEventListener("click", startRandomGame);

updateDailyStatus();
startDailyGame();
