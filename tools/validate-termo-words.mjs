import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const sourcePath = path.join(repoRoot, "jogo-termo-core", "script.js");
const defaultReportPath = path.join(repoRoot, "jogo-termo-core", "word-bank-report.md");

const LETTER_COUNT = 5;
const TIME_ZONE = "America/Sao_Paulo";
const MODES = {
  unico: { label: "Unico", boardCount: 1 },
  dueto: { label: "Dueto", boardCount: 2 },
  quarteto: { label: "Quarteto", boardCount: 4 },
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
    themePoolAttempts: 10,
  },
  quarteto: {
    minShared: 2,
    strongShared: 3,
    maxSamePosition: 1,
    minDisplacedShared: 1,
    shortlistSize: 24,
    attempts: 72,
    minStrongPairs: 3,
    themePoolAttempts: 12,
  },
};
const BLOCKED_WORDS = [
  "rola",
  "caralho",
  "karalho",
  "porra",
  "buceta",
  "bct",
  "xoxota",
  "xota",
  "chota",
  "pica",
  "piroca",
  "penis",
  "pênis",
  "vagina",
  "boquete",
  "punheta",
  "tesao",
  "tesão",
  "sexo",
  "foda",
  "fuder",
  "puta",
  "puto",
  "merda",
  "bosta",
  "cacete",
  "vagabunda",
];
const GAME_LABEL_WORDS = new Set(["TERMO", "DUETO", "UNICO"]);

const normalizeLetters = (value) => String(value)
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLocaleUpperCase("pt-BR")
  .replace(/[^A-Z]/g, "");

const displayWord = (value) => String(value).trim().toLocaleUpperCase("pt-BR").normalize("NFC");

const compactForModeration = (value) => normalizeLetters(value).toLowerCase();

const todayKey = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
};

const addDays = (dayKey, amount) => {
  const [year, month, day] = dayKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + amount));
  return date.toISOString().slice(0, 10);
};

const parsePositiveInteger = (value, fallback, optionName) => {
  if (value === undefined) return fallback;

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error(`Opcao --${optionName} precisa ser um numero inteiro positivo.`);
  }

  return parsed;
};

const parseArgs = (argv) => {
  const options = {
    days: 14,
    attempts: 3,
    player: "visitante",
    start: todayKey(),
    write: false,
    output: defaultReportPath,
    list: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--write") {
      options.write = true;
    } else if (arg === "--list") {
      options.list = true;
    } else if (arg.startsWith("--days=")) {
      options.days = parsePositiveInteger(arg.slice("--days=".length), options.days, "days");
    } else if (arg === "--days") {
      options.days = parsePositiveInteger(argv[index + 1], options.days, "days");
      index += 1;
    } else if (arg.startsWith("--attempts=")) {
      options.attempts = parsePositiveInteger(arg.slice("--attempts=".length), options.attempts, "attempts");
    } else if (arg === "--attempts") {
      options.attempts = parsePositiveInteger(argv[index + 1], options.attempts, "attempts");
      index += 1;
    } else if (arg.startsWith("--player=")) {
      options.player = arg.slice("--player=".length) || options.player;
    } else if (arg === "--player") {
      options.player = argv[index + 1] || options.player;
      index += 1;
    } else if (arg.startsWith("--start=")) {
      options.start = arg.slice("--start=".length) || options.start;
    } else if (arg === "--start") {
      options.start = argv[index + 1] || options.start;
      index += 1;
    } else if (arg.startsWith("--output=")) {
      options.output = path.resolve(repoRoot, arg.slice("--output=".length));
    } else if (arg === "--output") {
      options.output = path.resolve(repoRoot, argv[index + 1] || defaultReportPath);
      index += 1;
    } else {
      throw new Error(`Opcao desconhecida: ${arg}`);
    }
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(options.start)) {
    throw new Error("Opcao --start precisa estar no formato YYYY-MM-DD.");
  }

  return options;
};

const printHelp = () => {
  console.log(`Valida o banco de palavras do Termo.

Uso:
  npm run validate:termo
  node tools/validate-termo-words.mjs --write --days 21 --attempts 3

Opcoes:
  --write              Grava o relatorio em jogo-termo-core/word-bank-report.md
  --output <arquivo>   Caminho do relatorio quando --write estiver ativo
  --start YYYY-MM-DD   Data inicial da previa diaria
  --days <n>           Quantidade de dias na previa (padrao: 14)
  --attempts <n>       Tentativas diarias por modo na previa (padrao: 3)
  --player <nome>      Nome usado para simular a semente diaria (padrao: visitante)
  --list               Imprime a lista final de palavras aceitas no console
`);
};

const extractConstArrayLiteral = (source, constName) => {
  const declaration = new RegExp(`const\\s+${constName}\\s*=\\s*\\[`, "u");
  const match = declaration.exec(source);

  if (!match) {
    throw new Error(`Nao encontrei const ${constName} em ${sourcePath}.`);
  }

  const start = match.index + match[0].lastIndexOf("[");
  let depth = 0;
  let quote = "";
  let escaped = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];

    if (inLineComment) {
      if (char === "\n") inLineComment = false;
      continue;
    }

    if (inBlockComment) {
      if (char === "*" && next === "/") {
        inBlockComment = false;
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = "";
      }
      continue;
    }

    if (char === "/" && next === "/") {
      inLineComment = true;
      index += 1;
      continue;
    }

    if (char === "/" && next === "*") {
      inBlockComment = true;
      index += 1;
      continue;
    }

    if (char === "\"" || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === "[") {
      depth += 1;
    } else if (char === "]") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(start, index + 1);
      }
    }
  }

  throw new Error(`Nao consegui fechar o array ${constName}.`);
};

const evaluateArrayLiteral = (literal, constName) => {
  try {
    return Function(`"use strict"; return (${literal});`)();
  } catch (error) {
    throw new Error(`Nao consegui avaliar ${constName}: ${error.message}`);
  }
};

const loadWordBank = () => {
  const source = fs.readFileSync(sourcePath, "utf8");
  const targetGroups = evaluateArrayLiteral(
    extractConstArrayLiteral(source, "TARGET_WORD_GROUPS"),
    "TARGET_WORD_GROUPS",
  );
  const extraWords = evaluateArrayLiteral(
    extractConstArrayLiteral(source, "EXTRA_WORDS"),
    "EXTRA_WORDS",
  );

  return { source, targetGroups, extraWords };
};

const createEntries = (words) => {
  const entriesByWord = new Map();

  words.forEach((word) => {
    const display = displayWord(word);
    const normalized = normalizeLetters(display);

    if (normalized.length === LETTER_COUNT && !entriesByWord.has(normalized)) {
      entriesByWord.set(normalized, { display, normalized, raw: word });
    }
  });

  return [...entriesByWord.values()];
};

const wordSort = (left, right) => left.display.localeCompare(right.display, "pt-BR", {
  sensitivity: "base",
});

const buildWordData = ({ targetGroups, extraWords }) => {
  const targetWords = targetGroups.flat();
  const answerEntries = createEntries(targetWords);
  const answerByNormalized = new Map(answerEntries.map((entry) => [entry.normalized, entry]));
  const themedAnswerGroups = targetGroups
    .map((group) => group
      .map((word) => answerByNormalized.get(normalizeLetters(word)))
      .filter(Boolean))
    .filter((group) => group.length >= 2);
  const dictionaryEntries = createEntries([...targetWords, ...extraWords]);

  return {
    targetWords,
    targetGroups,
    extraWords,
    answerEntries,
    answerByNormalized,
    themedAnswerGroups,
    dictionaryEntries,
    dictionaryByNormalized: new Map(dictionaryEntries.map((entry) => [entry.normalized, entry])),
  };
};

const rawWordEntries = (words, scope) => words.map((word, index) => ({
  scope,
  index,
  raw: word,
  display: displayWord(word),
  normalized: normalizeLetters(word),
}));

const validateWordBank = (data) => {
  const errors = [];
  const warnings = [];
  const answerRawEntries = rawWordEntries(data.targetWords, "TARGET_WORD_GROUPS");
  const extraRawEntries = rawWordEntries(data.extraWords, "EXTRA_WORDS");
  const allRawEntries = [...answerRawEntries, ...extraRawEntries];
  const blockedNormalized = new Set(BLOCKED_WORDS.map(compactForModeration));

  data.targetGroups.forEach((group, index) => {
    if (!Array.isArray(group)) {
      errors.push(`Grupo ${index + 1} de TARGET_WORD_GROUPS nao e um array.`);
      return;
    }

    if (group.length !== MODES.quarteto.boardCount) {
      warnings.push(`Grupo ${index + 1} tem ${group.length} palavras; o esperado editorial para Quarteto e 4.`);
    }
  });

  allRawEntries.forEach((entry) => {
    if (typeof entry.raw !== "string") {
      errors.push(`${entry.scope}[${entry.index}] nao e string.`);
      return;
    }

    if (entry.raw !== String(entry.raw).trim()) {
      warnings.push(`${entry.scope}[${entry.index}] tem espaco extra antes/depois: "${entry.raw}".`);
    }

    if (!entry.display) {
      errors.push(`${entry.scope}[${entry.index}] esta vazio.`);
    }

    if (entry.normalized.length !== LETTER_COUNT) {
      errors.push(`${entry.scope}[${entry.index}] "${entry.display}" normaliza para ${entry.normalized.length} letras (${entry.normalized || "vazio"}); o jogo exige ${LETTER_COUNT}.`);
    }

    if (/[^\p{L}]/u.test(String(entry.raw).trim())) {
      warnings.push(`${entry.scope}[${entry.index}] "${entry.display}" tem caractere que nao e letra; o jogo ignora pontuacao/simbolos ao normalizar.`);
    }

    if (String(entry.raw).trim() !== String(entry.raw).trim().toLocaleLowerCase("pt-BR")) {
      warnings.push(`${entry.scope}[${entry.index}] "${entry.raw}" nao esta em minusculas como o restante do banco.`);
    }

    if (blockedNormalized.has(compactForModeration(entry.raw))) {
      warnings.push(`${entry.scope}[${entry.index}] "${entry.display}" coincide com termo bloqueado na moderacao de apelidos.`);
    }

    if (entry.scope === "EXTRA_WORDS" && GAME_LABEL_WORDS.has(entry.normalized)) {
      warnings.push(`EXTRA_WORDS inclui "${entry.display}", que tambem e nome/rotulo do proprio jogo.`);
    }
  });

  const answerDuplicates = findDuplicates(answerRawEntries);
  answerDuplicates.forEach(({ normalized, displays }) => {
    errors.push(`Resposta diaria duplicada apos normalizacao (${normalized}): ${displays.join(", ")}.`);
  });

  const extraDuplicates = findDuplicates(extraRawEntries);
  extraDuplicates.forEach(({ normalized, displays }) => {
    warnings.push(`Palavra extra repetida apos normalizacao (${normalized}): ${displays.join(", ")}.`);
  });

  const answerSet = new Set(data.answerEntries.map((entry) => entry.normalized));
  extraRawEntries.forEach((entry) => {
    if (answerSet.has(entry.normalized)) {
      warnings.push(`EXTRA_WORDS contem "${entry.display}", que ja entra no dicionario por ser resposta diaria.`);
    }
  });

  data.targetGroups.forEach((group, groupIndex) => {
    const groupEntries = rawWordEntries(group, `TARGET_WORD_GROUPS[${groupIndex}]`);
    findDuplicates(groupEntries).forEach(({ normalized, displays }) => {
      errors.push(`Grupo ${groupIndex + 1} repete a mesma palavra normalizada (${normalized}): ${displays.join(", ")}.`);
    });
  });

  if (data.answerEntries.length < MODES.quarteto.boardCount) {
    errors.push("Ha respostas diarias insuficientes para montar uma rodada Quarteto.");
  }

  return { errors, warnings };
};

const findDuplicates = (entries) => {
  const byNormalized = new Map();

  entries.forEach((entry) => {
    if (!entry.normalized) return;

    if (!byNormalized.has(entry.normalized)) {
      byNormalized.set(entry.normalized, []);
    }
    byNormalized.get(entry.normalized).push(entry.display);
  });

  return [...byNormalized.entries()]
    .filter(([, displays]) => displays.length > 1)
    .map(([normalized, displays]) => ({ normalized, displays }));
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

const scoreThemedGroup = (group, rules) => {
  const strictScore = scoreGroup(group, rules);

  if (Number.isFinite(strictScore)) return strictScore + 160;

  let score = 80;
  let strongPairs = 0;

  for (let leftIndex = 0; leftIndex < group.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < group.length; rightIndex += 1) {
      const relation = getPairRelation(group[leftIndex], group[rightIndex]);

      score += relation.shared * 12;
      score += relation.displacedShared * 10;
      score -= relation.samePosition * 4;

      if (relation.shared >= rules.strongShared) strongPairs += 1;
      if (relation.samePosition === 0) score += 3;
    }
  }

  if (strongPairs >= rules.minStrongPairs) score += 20;

  return score + countCrossBoardLetters(group) * 5;
};

const scoreCandidateForGroup = (candidate, group, rules, scoreFn = scoreGroup) => {
  const nextGroup = [...group, candidate];
  return scoreFn(nextGroup, rules);
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

const chooseRandomTargets = (random, entries, boardCount) => {
  const pool = [...entries];
  const chosen = [];

  while (chosen.length < boardCount && pool.length > 0) {
    const index = Math.floor(random() * pool.length);
    chosen.push(pool.splice(index, 1)[0]);
  }

  return chosen;
};

const buildRelatedGroup = (random, rules, entries, boardCount, scoreFn = scoreGroup) => {
  const pool = [...entries];

  if (pool.length === 0) return [];

  const group = [pool.splice(Math.floor(random() * pool.length), 1)[0]];

  while (group.length < boardCount && pool.length > 0) {
    const rankedCandidates = pool
      .map((entry) => ({
        entry,
        score: scoreCandidateForGroup(entry, group, rules, scoreFn),
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

const chooseThemedTargets = (seed, rules, data, boardCount) => {
  const themedPools = data.themedAnswerGroups
    .filter((group) => group.length >= boardCount);

  if (themedPools.length === 0) return [];

  const random = createRandom(seed ^ 0x85ebca6b);
  const poolsToTry = shuffleEntries(themedPools, random)
    .slice(0, Math.min(themedPools.length, rules.themePoolAttempts || themedPools.length));
  const attemptsPerPool = Math.max(
    2,
    Math.ceil(rules.attempts / Math.max(poolsToTry.length * 3, 1)),
  );
  let bestGroup = [];
  let bestScore = Number.NEGATIVE_INFINITY;

  poolsToTry.forEach((pool) => {
    for (let attempt = 0; attempt < attemptsPerPool; attempt += 1) {
      const group = buildRelatedGroup(random, rules, pool, boardCount, scoreThemedGroup);
      const score = group.length === boardCount
        ? scoreThemedGroup(group, rules) + random() * 0.001
        : Number.NEGATIVE_INFINITY;

      if (score > bestScore) {
        bestGroup = group;
        bestScore = score;
      }
    }
  });

  if (bestGroup.length === boardCount) {
    return shuffleEntries(bestGroup, createRandom(seed ^ 0x9e3779b9));
  }

  return [];
};

const chooseRelatedTargets = (seed, rules, data, boardCount) => {
  const themedGroup = chooseThemedTargets(seed, rules, data, boardCount);

  if (themedGroup.length === boardCount) {
    return themedGroup;
  }

  const random = createRandom(seed);
  let bestGroup = [];
  let bestScore = Number.NEGATIVE_INFINITY;

  for (let attempt = 0; attempt < rules.attempts; attempt += 1) {
    const group = buildRelatedGroup(random, rules, data.answerEntries, boardCount);
    const score = group.length === boardCount
      ? scoreGroup(group, rules)
      : Number.NEGATIVE_INFINITY;

    if (score > bestScore) {
      bestGroup = group;
      bestScore = score;
    }
  }

  if (bestGroup.length === boardCount) {
    return shuffleEntries(bestGroup, createRandom(seed ^ 0x9e3779b9));
  }

  return chooseRandomTargets(createRandom(seed), data.answerEntries, boardCount);
};

const dailySeed = ({ day, mode, playerName, attempt }) => {
  const playerKey = normalizeLetters(playerName) || "VISITANTE";
  return hashString(`${day}:${mode}:${playerKey}:${attempt}`);
};

const chooseTargets = (seed, mode, data) => {
  const modeConfig = MODES[mode];
  const rules = RELATED_WORD_RULES[mode];

  if (rules && modeConfig.boardCount > 1) {
    return chooseRelatedTargets(seed, rules, data, modeConfig.boardCount);
  }

  return chooseRandomTargets(createRandom(seed), data.answerEntries, modeConfig.boardCount);
};

const classifyCombo = (targets, mode) => {
  const rules = RELATED_WORD_RULES[mode];

  if (!rules) return "sorteio";

  const strictScore = scoreGroup(targets, rules);
  if (Number.isFinite(strictScore)) return "relacionada";

  const looseScore = scoreThemedGroup(targets, rules);
  return Number.isFinite(looseScore) ? "tema" : "revisar";
};

const buildDailyPreview = (data, options) => {
  const rows = [];

  for (let dayOffset = 0; dayOffset < options.days; dayOffset += 1) {
    const day = addDays(options.start, dayOffset);

    for (let attempt = 1; attempt <= options.attempts; attempt += 1) {
      const byMode = {};

      Object.keys(MODES).forEach((mode) => {
        const seed = dailySeed({ day, mode, playerName: options.player, attempt });
        const targets = chooseTargets(seed, mode, data);
        byMode[mode] = {
          words: targets.map((target) => target.display),
          quality: classifyCombo(targets, mode),
        };
      });

      rows.push({ day, attempt, byMode });
    }
  }

  return rows;
};

const formatInlineWords = (words) => words.join(", ");

const renderList = (entries) => entries
  .map((entry) => entry.display)
  .sort((left, right) => left.localeCompare(right, "pt-BR", { sensitivity: "base" }))
  .join(", ");

const renderGroupedAnswers = (targetGroups) => targetGroups
  .map((group, index) => `${index + 1}. ${group.map(displayWord).join(", ")}`)
  .join("\n");

const renderIssues = (title, issues, emptyText) => [
  `## ${title}`,
  issues.length === 0
    ? emptyText
    : issues.map((issue) => `- ${issue}`).join("\n"),
].join("\n\n");

const renderPreviewTable = (previewRows) => {
  const lines = [
    "| Data | Tentativa | Unico | Dueto | Quarteto |",
    "| --- | ---: | --- | --- | --- |",
  ];

  previewRows.forEach((row) => {
    lines.push([
      row.day,
      String(row.attempt),
      formatInlineWords(row.byMode.unico.words),
      `${formatInlineWords(row.byMode.dueto.words)} (${row.byMode.dueto.quality})`,
      `${formatInlineWords(row.byMode.quarteto.words)} (${row.byMode.quarteto.quality})`,
    ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  });

  return lines.join("\n");
};

const renderReport = ({ data, validation, previewRows, options }) => {
  const answerCount = data.answerEntries.length;
  const extraUniqueCount = createEntries(data.extraWords).length;
  const dictionaryCount = data.dictionaryEntries.length;
  const generatedAt = new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIME_ZONE,
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date());

  return `# Validacao do banco de palavras do Termo

Fonte: \`jogo-termo-core/script.js\`
Gerado em: ${generatedAt} (${TIME_ZONE})
Previa: ${options.days} dia(s), ${options.attempts} tentativa(s) por modo, jogador simulado "${options.player}", inicio ${options.start}.

## Resumo

- Grupos de respostas diarias: ${data.targetGroups.length}
- Respostas diarias unicas: ${answerCount}
- Palavras extras aceitas: ${extraUniqueCount} unicas (${data.extraWords.length} itens no array)
- Total final aceito pelo jogo: ${dictionaryCount} palavras unicas
- Problemas bloqueantes: ${validation.errors.length}
- Alertas editoriais: ${validation.warnings.length}

${renderIssues("Problemas bloqueantes", validation.errors, "Nenhum problema bloqueante encontrado.")}

${renderIssues("Alertas editoriais", validation.warnings, "Nenhum alerta editorial encontrado.")}

## Previa diaria

${renderPreviewTable(previewRows)}

## Respostas diarias

Estas entram no sorteio diario e tambem sao aceitas como palpites.

${renderGroupedAnswers(data.targetGroups)}

## Palavras extras aceitas

Estas nao entram no sorteio diario; servem apenas como palpites validos.

${renderList(createEntries(data.extraWords))}

## Vocabulário total aceito

${renderList(data.dictionaryEntries)}
`;
};

const run = () => {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  const wordBank = loadWordBank();
  const data = buildWordData(wordBank);
  const validation = validateWordBank(data);
  const previewRows = buildDailyPreview(data, options);
  const report = renderReport({ data, validation, previewRows, options });

  if (options.write) {
    fs.mkdirSync(path.dirname(options.output), { recursive: true });
    fs.writeFileSync(options.output, report, "utf8");
  } else {
    console.log(report);
  }

  if (options.list) {
    console.log("\nLista final aceita pelo jogo:\n");
    console.log(renderList(data.dictionaryEntries));
  }

  const relativeReportPath = path.relative(repoRoot, options.output);
  console.log([
    "Validacao do Termo concluida.",
    `Fonte: ${path.relative(repoRoot, sourcePath)}`,
    `Respostas diarias: ${data.answerEntries.length}`,
    `Extras aceitas: ${createEntries(data.extraWords).length}`,
    `Total aceito: ${data.dictionaryEntries.length}`,
    `Problemas: ${validation.errors.length}`,
    `Alertas: ${validation.warnings.length}`,
    options.write ? `Relatorio: ${relativeReportPath}` : "",
  ].filter(Boolean).join("\n"));

  if (validation.errors.length > 0) {
    process.exitCode = 1;
  }
};

try {
  run();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
