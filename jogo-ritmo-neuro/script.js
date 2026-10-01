const GAME_ID = "ritmo-em-foco";
const GAME_TITLE = "Ritmo em Foco";
const CANVAS_WIDTH = 420;
const CANVAS_HEIGHT = 600;
const HIT_LINE_Y = 500;
const PERFECT_WINDOW = 110;
const GOOD_WINDOW = 220;
const AUDIO_RESUME_TIMEOUT = 350;
const LANE_KEYS = ["d", "f", "j", "k"];
const LANE_LABELS = ["D", "F", "J", "K"];
const LANE_COLORS = ["#d8c76b", "#93b399", "#d8a76b", "#8eaebd"];

const LEVELS = {
  easy: {
    name: "Fácil",
    label: "Fácil · 70 BPM · 40 s",
    bpm: 70,
    duration: 40,
    fallTime: 1850,
    doubleChance: 0.05,
    goals: { good: 1800, standout: 3600, goodLabel: "1800 pontos", standoutLabel: "3600 pontos" },
  },
  medium: {
    name: "Médio",
    label: "Médio · 88 BPM · 45 s",
    bpm: 88,
    duration: 45,
    fallTime: 1650,
    doubleChance: 0.12,
    goals: { good: 3200, standout: 6200, goodLabel: "3200 pontos", standoutLabel: "6200 pontos" },
  },
  hard: {
    name: "Difícil",
    label: "Difícil · 108 BPM · 50 s",
    bpm: 108,
    duration: 50,
    fallTime: 1450,
    doubleChance: 0.18,
    goals: { good: 5200, standout: 9200, goodLabel: "5200 pontos", standoutLabel: "9200 pontos" },
  },
};

const canvas = document.querySelector("#game-canvas");
const context = canvas.getContext("2d");
const levelScreen = document.querySelector("#level-screen");
const playScreen = document.querySelector("#play-screen");
const difficultyButtons = document.querySelectorAll(".difficulty-option");
const dailyStatus = document.querySelector("#daily-status");
const gameDailyStatus = document.querySelector("#game-daily-status");
const selectedLevelElement = document.querySelector("#selected-level");
const scoreElement = document.querySelector("#score");
const comboElement = document.querySelector("#combo");
const accuracyElement = document.querySelector("#accuracy");
const livesElement = document.querySelector("#lives");
const timeLeftElement = document.querySelector("#time-left");
const timeBar = document.querySelector("#time-bar");
const gameMessage = document.querySelector("#game-message");
const audioButton = document.querySelector("#audio-button");
const pauseButton = document.querySelector("#pause-button");
const restartButton = document.querySelector("#restart-button");
const changeLevelButton = document.querySelector("#change-level-button");
const laneButtons = document.querySelectorAll(".lane-button");
const resultDialog = document.querySelector("#result-dialog");
const resultEyebrow = document.querySelector("#result-eyebrow");
const resultSummary = document.querySelector("#result-summary");
const resultHits = document.querySelector("#result-hits");
const resultMisses = document.querySelector("#result-misses");
const resultCombo = document.querySelector("#result-combo");
const playAgainButton = document.querySelector("#play-again-button");
const chooseLevelButton = document.querySelector("#choose-level-button");
const startButton = document.querySelector("#rhythm-start-button");
const durationSelect = document.querySelector("#rhythm-duration");
const soundCheckbox = document.querySelector("#rhythm-sound");

const state = {
  levelKey: "easy",
  active: false,
  paused: false,
  audioEnabled: true,
  duration: undefined,
  audioContext: undefined,
  animationFrame: undefined,
  startedAt: undefined,
  pauseStartedAt: undefined,
  elapsed: 0,
  score: 0,
  combo: 0,
  maxCombo: 0,
  lives: 3,
  hits: { perfect: 0, good: 0, miss: 0 },
  notes: [],
  laneGlow: [0, 0, 0, 0],
  dailyAttemptRecorded: false,
  dailyAttemptPending: false,
};

const activeLevel = () => LEVELS[state.levelKey];
const activeGameLevel = () => ({...activeLevel(),duration:state.duration||activeLevel().duration});

const formatTime = (milliseconds) => {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
};

const getAccuracy = () => {
  const total = state.hits.perfect + state.hits.good + state.hits.miss;
  if (!total) return 100;

  return Math.round(((state.hits.perfect + state.hits.good * 0.65) / total) * 100);
};

const setMessage = (message) => {
  gameMessage.textContent = message;
};

const updateDailyStatus = () => {
  const text = ReabilityDaily.statusText({
    gameId: GAME_ID,
    levelKey: state.levelKey,
    levelName: activeLevel().name,
  });

  dailyStatus.textContent = text;
  gameDailyStatus.textContent = text;
  difficultyButtons.forEach((button) => {
    ReabilityDaily.updateLevelLock(button, GAME_ID, button.dataset.level);
  });
};

const showDailyLimit = () => {
  ReabilityDaily.showLimitDialog({
    gameTitle: GAME_TITLE,
    levelName: activeLevel().name,
  });
};

const ensureDailyAllowance = async () => {
  const usage = ReabilityDaily.getUsage(GAME_ID, state.levelKey);
  updateDailyStatus();

  if (usage.remaining === 0) {
    showDailyLimit();
    return false;
  }

  await ReabilityDaily.ensurePlayerName();
  updateDailyStatus();
  return true;
};

const recordDailyAttempt = async () => {
  if (state.dailyAttemptRecorded) return true;
  if (state.dailyAttemptPending) return false;

  state.dailyAttemptPending = true;
  await ReabilityDaily.ensurePlayerName();
  const attempt = ReabilityDaily.recordAttempt(GAME_ID, state.levelKey);
  state.dailyAttemptPending = false;
  updateDailyStatus();

  if (!attempt.ok) {
    showDailyLimit();
    return false;
  }

  state.dailyAttemptRecorded = true;
  return true;
};

const ensureAudio = async () => {
  if (!state.audioEnabled) return;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  try {
    if (!state.audioContext) state.audioContext = new AudioContextClass();
    if (state.audioContext.state === "suspended") {
      await Promise.race([
        state.audioContext.resume(),
        new Promise((resolve) => window.setTimeout(resolve, AUDIO_RESUME_TIMEOUT)),
      ]);
    }
  } catch (error) {
    // Some browsers keep audio locked until the next trusted gesture; the game can continue silently.
  }
};

const playTone = (frequency, duration = 0.12, type = "sine", volume = 0.08) => {
  if (!state.audioEnabled || !state.audioContext) return;
  if (state.audioContext.state !== "running") return;

  const now = state.audioContext.currentTime;
  const oscillator = state.audioContext.createOscillator();
  const gain = state.audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  oscillator.connect(gain);
  gain.connect(state.audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.02);
};

const playHitSound = (lane, isPerfect) => {
  const frequency = [330, 392, 494, 587][lane];
  playTone(frequency, isPerfect ? 0.16 : 0.11, "triangle", isPerfect ? 0.1 : 0.07);
  if (isPerfect) playTone(frequency * 1.5, 0.1, "sine", 0.04);
};

const playMissSound = () => {
  playTone(120, 0.16, "sawtooth", 0.05);
};

const createNotes = (level) => {
  const interval = 60000 / level.bpm;
  const notes = [];
  let previousLane = Math.floor(Math.random() * 4);

  for (let time = 2300; time < level.duration * 1000 - 700; time += interval) {
    const laneJump = 1 + Math.floor(Math.random() * 3);
    const lane = (previousLane + laneJump) % 4;
    notes.push({ time, lane, hit: false, missed: false });
    previousLane = lane;

    if (time > 6000 && Math.random() < level.doubleChance) {
      const secondLane = (lane + 2 + Math.floor(Math.random() * 2)) % 4;
      notes.push({ time: time + interval * 0.08, lane: secondLane, hit: false, missed: false });
    }
  }

  return notes.sort((first, second) => first.time - second.time);
};

const updateStatus = () => {
  const level = activeGameLevel();
  const remaining = level.duration * 1000 - state.elapsed;
  const progress = Math.max(0, Math.min(100, (remaining / (level.duration * 1000)) * 100));

  scoreElement.textContent = state.score;
  comboElement.textContent = `x${state.combo}`;
  accuracyElement.textContent = `${getAccuracy()}%`;
  livesElement.textContent = state.lives;
  timeLeftElement.textContent = formatTime(remaining);
  timeBar.style.setProperty("--time-progress", `${progress}%`);
  timeBar.classList.toggle("is-urgent", remaining <= 10000);
};

const resetResultGoal = () => {
  resultSummary.parentElement.querySelector(".goal-result")?.remove();
};

const resetGameState = () => {
  state.active = true;
  state.paused = false;
  state.elapsed = 0;
  state.score = 0;
  state.combo = 0;
  state.maxCombo = 0;
  state.lives = 3;
  state.hits = { perfect: 0, good: 0, miss: 0 };
  state.laneGlow = [0, 0, 0, 0];
  state.notes = createNotes(activeGameLevel());
  state.startedAt = performance.now();
  state.pauseStartedAt = undefined;
  state.dailyAttemptRecorded = false;
  state.dailyAttemptPending = false;
};

const roundedRect = (ctx, x, y, width, height, radius) => {
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    return;
  }

  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
};

const drawCanvas = () => {
  const level = activeGameLevel();
  const laneWidth = CANVAS_WIDTH / 4;
  const gradient = context.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);

  gradient.addColorStop(0, "#071523");
  gradient.addColorStop(0.62, "#0b243a");
  gradient.addColorStop(1, "#102e49");
  context.fillStyle = gradient;
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  for (let lane = 0; lane < 4; lane += 1) {
    const x = lane * laneWidth;

    context.fillStyle = lane % 2 === 0 ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.065)";
    context.fillRect(x, 0, laneWidth, CANVAS_HEIGHT);

    if (state.laneGlow[lane] > 0.03) {
      context.globalAlpha = state.laneGlow[lane] * 0.42;
      context.fillStyle = LANE_COLORS[lane];
      context.fillRect(x, HIT_LINE_Y - 118, laneWidth, 154);
      context.globalAlpha = 1;
    }

    if (lane > 0) {
      context.strokeStyle = "rgba(255,255,255,0.1)";
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, CANVAS_HEIGHT);
      context.stroke();
    }
  }

  context.fillStyle = "rgba(255,255,255,0.16)";
  context.fillRect(14, 16, CANVAS_WIDTH - 28, 8);
  context.fillStyle = "#b8aa60";
  roundedRect(
    context,
    14,
    16,
    (CANVAS_WIDTH - 28) * Math.max(0, Math.min(1, state.elapsed / (level.duration * 1000))),
    8,
    4,
  );
  context.fill();

  context.fillStyle = "#d8c76b";
  context.fillRect(0, HIT_LINE_Y - 2, CANVAS_WIDTH, 4);

  for (let lane = 0; lane < 4; lane += 1) {
    const x = lane * laneWidth + 12;
    const width = laneWidth - 24;

    context.globalAlpha = 0.28 + state.laneGlow[lane] * 0.35;
    context.fillStyle = LANE_COLORS[lane];
    roundedRect(context, x, HIT_LINE_Y - 25, width, 50, 14);
    context.fill();
    context.globalAlpha = 1;

    context.strokeStyle = "rgba(255,253,246,0.72)";
    context.lineWidth = 2;
    roundedRect(context, x, HIT_LINE_Y - 25, width, 50, 14);
    context.stroke();
  }

  for (const note of state.notes) {
    if (note.hit) continue;

    const delta = note.time - state.elapsed;
    if (delta > level.fallTime || delta < -GOOD_WINDOW - 120) continue;

    const progress = 1 - delta / level.fallTime;
    const y = progress * HIT_LINE_Y;
    if (y < -40 || y > CANVAS_HEIGHT + 40) continue;

    const x = note.lane * laneWidth + 14;
    const width = laneWidth - 28;
    const height = 34;

    context.fillStyle = "rgba(0,0,0,0.28)";
    roundedRect(context, x + 3, y + 4, width, height, 12);
    context.fill();

    context.fillStyle = note.missed ? "#4f5c68" : LANE_COLORS[note.lane];
    roundedRect(context, x, y, width, height, 12);
    context.fill();

    context.fillStyle = "rgba(255,255,255,0.5)";
    roundedRect(context, x + 6, y + 6, width - 12, 7, 4);
    context.fill();

    context.strokeStyle = "#071523";
    context.lineWidth = 2;
    roundedRect(context, x, y, width, height, 12);
    context.stroke();
  }

  context.font = "900 18px Inter, Arial, Helvetica, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  for (let lane = 0; lane < 4; lane += 1) {
    const x = lane * laneWidth + laneWidth / 2;
    context.fillStyle = "rgba(255,253,246,0.78)";
    context.fillText(LANE_LABELS[lane], x, CANVAS_HEIGHT - 24);
  }

  if (state.combo >= 4) {
    context.font = "900 30px Georgia, 'Times New Roman', serif";
    context.lineWidth = 5;
    context.strokeStyle = "#071523";
    context.fillStyle = "#efe8c9";
    context.strokeText(`Combo x${state.combo}`, CANVAS_WIDTH / 2, 68);
    context.fillText(`Combo x${state.combo}`, CANVAS_WIDTH / 2, 68);
  }

  if (state.paused) {
    context.fillStyle = "rgba(3,12,22,0.74)";
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    context.fillStyle = "#fffdf6";
    context.font = "900 42px Georgia, 'Times New Roman', serif";
    context.textAlign = "center";
    context.fillText("Pausado", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
    context.font = "800 16px Inter, Arial, Helvetica, sans-serif";
    context.fillText("Toque em Continuar para voltar", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 28);
  }

  context.textBaseline = "alphabetic";
};

const registerHit = (lane, isPerfect, timingErrorMs) => {
  ReabilityClinic.round({ correct: true, lane, perfect: isPerfect, timingErrorMs, responseMs: null, elapsedMs: Math.round(state.elapsed) });
  const basePoints = isPerfect ? 120 : 70;
  const comboBonus = Math.floor(state.combo / 5) * 18;

  state.score += basePoints + comboBonus;
  state.combo += 1;
  state.maxCombo = Math.max(state.maxCombo, state.combo);
  state.hits[isPerfect ? "perfect" : "good"] += 1;
  state.laneGlow[lane] = 1;
  setMessage(isPerfect ? "Pulso perfeito. Mantenha o ritmo." : "Boa resposta. Continue acompanhando.");
  playHitSound(lane, isPerfect);
  updateStatus();
};

const registerMiss = (lane) => {
  ReabilityClinic.round({ correct: false, outcome: "omission", lane, responseMs: null, elapsedMs: Math.round(state.elapsed) });
  state.combo = 0;
  state.lives = Math.max(0, state.lives - 1);
  state.hits.miss += 1;
  state.laneGlow[lane] = 0.75;
  setMessage(state.lives > 0 ? "Pulso perdido. Respire e volte para a linha." : "As vidas acabaram. Veja seu resultado.");
  playMissSound();
  updateStatus();
};

const handleLane = (lane) => {
  if (!state.active || state.paused) return;

  state.laneGlow[lane] = 1;
  const currentElapsed = performance.now() - state.startedAt;
  const nearest = state.notes
    .filter((note) => note.lane === lane && !note.hit && !note.missed)
    .map((note) => ({ note, distance: Math.abs(note.time - currentElapsed) }))
    .sort((first, second) => first.distance - second.distance)[0];

  if (!nearest || nearest.distance > GOOD_WINDOW) {
    ReabilityClinic.round({ correct: false, outcome: "early_or_late", lane, responseMs: null, elapsedMs: Math.round(currentElapsed) });
    state.combo = 0;
    setMessage("Espere o pulso encostar na linha dourada.");
    updateStatus();
    return;
  }

  nearest.note.hit = true;
  registerHit(lane, nearest.distance <= PERFECT_WINDOW, Math.round(currentElapsed - nearest.note.time));
};

const finishGame = (completed) => {
  if (!state.active) return;

  state.active = false;
  window.cancelAnimationFrame(state.animationFrame);
  pauseButton.textContent = "Pausar";
  updateStatus();
  drawCanvas();

  const hits = state.hits.perfect + state.hits.good;
  const misses = state.hits.miss;
  const accuracy = getAccuracy();
  ReabilityClinic.finish({ score: state.score, hits: state.hits, maxCombo: state.maxCombo, won: completed });

  resultEyebrow.textContent = completed ? "Ritmo concluído" : "Rodada encerrada";
  resultSummary.textContent = completed
    ? `Você concluiu o nível ${activeLevel().name} com ${state.score} pontos, ${accuracy}% de precisão e combo máximo x${state.maxCombo}.`
    : `A rodada terminou no nível ${activeLevel().name}. Você fez ${state.score} pontos, ${accuracy}% de precisão e combo máximo x${state.maxCombo}.`;
  resultHits.textContent = hits;
  resultMisses.textContent = misses;
  resultCombo.textContent = `x${state.maxCombo}`;
  resetResultGoal();
  ReabilityDaily.goals.showGoalResult(
    resultSummary,
    ReabilityDaily.goals.rateHigher(state.score, activeLevel().goals),
  );
  resultDialog.showModal();
};

const tick = () => {
  if (!state.active) return;

  if (!state.paused) {
    state.elapsed = performance.now() - state.startedAt;

    for (const note of state.notes) {
      if (!note.hit && !note.missed && note.time + GOOD_WINDOW < state.elapsed) {
        note.missed = true;
        registerMiss(note.lane);
        if (state.lives <= 0) break;
      }
    }

    for (let lane = 0; lane < 4; lane += 1) {
      state.laneGlow[lane] *= 0.88;
    }

    if (state.lives <= 0) {
      finishGame(false);
      return;
    }

    if (state.elapsed >= activeGameLevel().duration * 1000 + GOOD_WINDOW) {
      finishGame(true);
      return;
    }

    updateStatus();
  }

  drawCanvas();
  state.animationFrame = window.requestAnimationFrame(tick);
};

const startGame = async () => {
  await ReabilityClinic.confirmReady();
  state.duration=Math.max(10,Math.min(180,Number(durationSelect.value)||activeLevel().duration));
  state.audioEnabled=soundCheckbox.checked;
  audioButton.textContent=state.audioEnabled?'Som ligado':'Som desligado';audioButton.setAttribute('aria-pressed',String(state.audioEnabled));
  await ensureAudio();
  window.cancelAnimationFrame(state.animationFrame);
  if (resultDialog.open) resultDialog.close();

  // Registra a tentativa diária antes de configurar o estado e iniciar o tempo da partida
  const registered = await recordDailyAttempt();
  if (!registered) {
    showLevelSelection();
    return;
  }

  await globalThis.ReabilityGameShell?.countdown?.();
  resetResultGoal();
  ReabilityClinic.start(GAME_ID, state.levelKey,{durationSeconds:state.duration,bpm:activeLevel().bpm,sound:state.audioEnabled});
  resetGameState();
  levelScreen.hidden = true;
  playScreen.hidden = false;
  selectedLevelElement.textContent = `${activeLevel().name} · ${activeLevel().bpm} BPM · ${state.duration} s`;
  pauseButton.textContent = "Pausar";
  setMessage("Acompanhe o pulso até a linha dourada. D, F, J e K também funcionam.");
  updateDailyStatus();
  updateStatus();
  drawCanvas();
  state.animationFrame = window.requestAnimationFrame(tick);
};

const selectLevel = (event) => {
  state.levelKey = event.currentTarget.dataset.level;
  difficultyButtons.forEach(button=>{const selected=button===event.currentTarget;button.classList.toggle('is-selected',selected);button.setAttribute('aria-pressed',String(selected));});
};

const restartGame = async () => {
  if (resultDialog.open) resultDialog.close();
  await ensureAudio();
  if (await ensureDailyAllowance()) await startGame();
};

const stopActiveGame = () => {
  ReabilityClinic.finish({ score: state.score, hits: state.hits }, "interrupted");
  state.active = false;
  state.paused = false;
  window.cancelAnimationFrame(state.animationFrame);
};

const showLevelSelection = () => {
  stopActiveGame();
  if (resultDialog.open) resultDialog.close();
  playScreen.hidden = true;
  levelScreen.hidden = false;
  updateDailyStatus();
  difficultyButtons[0].focus();
};

const togglePause = () => {
  if (!state.active) return;

  state.paused = !state.paused;
  if (state.paused) {
    state.pauseStartedAt = performance.now();
    pauseButton.textContent = "Continuar";
    setMessage("Jogo pausado.");
    drawCanvas();
    return;
  }

  if (state.pauseStartedAt) {
    state.startedAt += performance.now() - state.pauseStartedAt;
  }
  state.pauseStartedAt = undefined;
  pauseButton.textContent = "Pausar";
  setMessage("Ritmo retomado.");
};

const toggleAudio = async () => {
  state.audioEnabled = !state.audioEnabled;
  audioButton.textContent = state.audioEnabled ? "Som ligado" : "Som desligado";
  audioButton.setAttribute("aria-pressed", String(state.audioEnabled));
  if (state.audioEnabled) await ensureAudio();
};

canvas.addEventListener("pointerdown", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
  const lane = Math.max(0, Math.min(3, Math.floor(x / (CANVAS_WIDTH / 4))));
  handleLane(lane);
});

laneButtons.forEach((button) => {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    handleLane(Number(button.dataset.lane));
  });
});

document.addEventListener("keydown", (event) => {
  if (event.repeat) return;

  const lane = LANE_KEYS.indexOf(event.key.toLowerCase());
  if (lane >= 0) {
    event.preventDefault();
    handleLane(lane);
    return;
  }

  if (event.key === " " && state.active) {
    event.preventDefault();
    togglePause();
  }

  if (event.key === "Escape" && state.active) {
    showLevelSelection();
  }
});

difficultyButtons.forEach((button) => button.addEventListener("click", selectLevel));
startButton.addEventListener('click',async()=>{await ensureAudio();if(await ensureDailyAllowance())await startGame();});
audioButton.addEventListener("click", toggleAudio);
pauseButton.addEventListener("click", togglePause);
restartButton.addEventListener("click", restartGame);
changeLevelButton.addEventListener("click", showLevelSelection);
playAgainButton.addEventListener("click", restartGame);
chooseLevelButton.addEventListener("click", showLevelSelection);

updateDailyStatus();
selectLevel({currentTarget:difficultyButtons[0]});
