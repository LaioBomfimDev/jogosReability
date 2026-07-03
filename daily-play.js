(() => {
  const PROFILE_KEY = "reability.player.v1";
  const DAILY_KEY = "reability.daily-plays.v1";
  const MAX_ATTEMPTS = 3;
  const TIME_ZONE = "America/Sao_Paulo";

  const blockedWords = [
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

  const leetMap = new Map([
    ["0", "o"],
    ["1", "i"],
    ["!", "i"],
    ["|", "i"],
    ["3", "e"],
    ["4", "a"],
    ["@", "a"],
    ["5", "s"],
    ["$", "s"],
    ["7", "t"],
    ["8", "b"],
    ["9", "g"],
  ]);

  const cleanText = (value) => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[014@!|35$789]/g, (character) => leetMap.get(character) || character);

  const compactForModeration = (value) => cleanText(value).replace(/[^a-z]/g, "");

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

  const readJson = (key, fallback) => {
    try {
      return JSON.parse(window.localStorage.getItem(key)) || fallback;
    } catch (error) {
      return fallback;
    }
  };

  const writeJson = (key, value) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // If localStorage is unavailable, the current page still works without persistence.
    }
  };

  const normalizeDisplayName = (value) => String(value || "").trim().replace(/\s+/g, " ");

  const validatePlayerName = (rawName) => {
    const name = normalizeDisplayName(rawName);

    if (name.length < 2) {
      return { ok: false, message: "Use pelo menos 2 caracteres." };
    }

    if (name.length > 18) {
      return { ok: false, message: "Use no máximo 18 caracteres." };
    }

    if (!/^[\p{L}\p{N} ._-]+$/u.test(name)) {
      return { ok: false, message: "Use apenas letras, números, espaço, ponto, hífen ou underline." };
    }

    if (!/[\p{L}]/u.test(name)) {
      return { ok: false, message: "Inclua pelo menos uma letra no apelido." };
    }

    const compactName = compactForModeration(name);
    const hasBlockedWord = blockedWords.some((word) => compactName.includes(compactForModeration(word)));

    if (hasBlockedWord) {
      return { ok: false, message: "Escolha um apelido sem palavrões ou termos adultos." };
    }

    return { ok: true, name };
  };

  const getProfile = () => {
    const profile = readJson(PROFILE_KEY, {});
    const validation = validatePlayerName(profile.name);

    return validation.ok ? { name: validation.name } : {};
  };

  const savePlayerName = (name) => writeJson(PROFILE_KEY, { name });

  const getDailyData = () => {
    const day = todayKey();
    const data = readJson(DAILY_KEY, { day, plays: {} });

    if (data.day !== day) {
      return { day, plays: {} };
    }

    return {
      day,
      plays: data.plays && typeof data.plays === "object" ? data.plays : {},
    };
  };

  const saveDailyData = (data) => writeJson(DAILY_KEY, data);

  const playKey = (gameId, levelKey) => `${gameId}:${levelKey}`;

  const getUsage = (gameId, levelKey) => {
    const data = getDailyData();
    const used = Number(data.plays[playKey(gameId, levelKey)] || 0);

    return {
      used,
      max: MAX_ATTEMPTS,
      remaining: Math.max(0, MAX_ATTEMPTS - used),
      day: data.day,
    };
  };

  const recordAttempt = (gameId, levelKey) => {
    const data = getDailyData();
    const key = playKey(gameId, levelKey);
    const used = Number(data.plays[key] || 0);

    if (used >= MAX_ATTEMPTS) {
      return { ok: false, ...getUsage(gameId, levelKey) };
    }

    data.plays[key] = used + 1;
    saveDailyData(data);

    return { ok: true, ...getUsage(gameId, levelKey) };
  };

  const closeDialog = (dialog) => {
    if (!dialog.open) return;

    if (typeof dialog.close === "function") {
      dialog.close();
      return;
    }

    dialog.removeAttribute("open");
  };

  const showDialog = (dialog) => {
    document.body.append(dialog);

    if (typeof dialog.showModal === "function") {
      dialog.showModal();
      return;
    }

    dialog.setAttribute("open", "");
  };

  const createPlayerDialog = (resolve) => {
    const dialog = document.createElement("dialog");
    dialog.className = "player-dialog";
    dialog.innerHTML = `
      <form class="player-dialog__content" method="dialog" novalidate>
        <p class="eyebrow">Identificação</p>
        <h2>Escolha seu apelido</h2>
        <p>Ele aparece só neste dispositivo, para personalizar suas metas diárias.</p>
        <label for="player-name-input">Apelido</label>
        <input id="player-name-input" name="playerName" type="text" maxlength="18" autocomplete="nickname" required />
        <p id="player-name-error" class="player-dialog__error" aria-live="polite"></p>
        <button class="button button-primary" type="submit">Continuar</button>
      </form>
    `;

    const form = dialog.querySelector("form");
    const input = dialog.querySelector("#player-name-input");
    const error = dialog.querySelector("#player-name-error");

    dialog.addEventListener("cancel", (event) => event.preventDefault());
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const validation = validatePlayerName(input.value);

      if (!validation.ok) {
        error.textContent = validation.message;
        input.focus();
        return;
      }

      savePlayerName(validation.name);
      closeDialog(dialog);
      dialog.remove();
      resolve(validation.name);
    });

    showDialog(dialog);
    window.setTimeout(() => input.focus(), 60);
  };

  const ensurePlayerName = () => new Promise((resolve) => {
    const profile = getProfile();

    if (profile.name) {
      resolve(profile.name);
      return;
    }

    createPlayerDialog(resolve);
  });

  const showLimitDialog = ({ gameTitle, levelName }) => {
    const dialog = document.createElement("dialog");
    dialog.className = "daily-limit-dialog";
    dialog.innerHTML = `
      <div class="daily-limit-dialog__content">
        <p class="eyebrow">Limite diário</p>
        <h2>Você já jogou 3 vezes</h2>
        <p>${gameTitle} · ${levelName} volta a liberar novas partidas amanhã.</p>
        <button class="button button-primary" type="button">Entendi</button>
      </div>
    `;

    dialog.querySelector("button").addEventListener("click", () => {
      closeDialog(dialog);
      dialog.remove();
    });
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeDialog(dialog);
      dialog.remove();
    });

    showDialog(dialog);
  };

  const statusText = ({ gameId, levelKey, levelName }) => {
    const profile = getProfile();
    const usage = getUsage(gameId, levelKey);
    const player = profile.name ? `${profile.name} · ` : "";

    return `${player}${levelName}: ${usage.used}/${usage.max} partidas hoje. Reinicia amanhã.`;
  };

  const updateLevelLock = (button, gameId, levelKey) => {
    const usage = getUsage(gameId, levelKey);

    button.classList.toggle("is-daily-locked", usage.remaining === 0);
    button.title = usage.remaining === 0
      ? "Limite diário atingido para este nível."
      : `${usage.remaining} partida${usage.remaining === 1 ? "" : "s"} restante${usage.remaining === 1 ? "" : "s"} hoje.`;
  };

  const rateHigher = (value, goals) => {
    if (value >= goals.standout) {
      return {
        tier: "standout",
        label: "Meta destaque",
        message: `Destaque alcançado. Referência: ${goals.standoutLabel || goals.standout}.`,
      };
    }

    if (value >= goals.good) {
      return {
        tier: "good",
        label: "Boa meta",
        message: `Boa meta alcançada. Próximo destaque: ${goals.standoutLabel || goals.standout}.`,
      };
    }

    return {
      tier: "training",
      label: "Meta do dia",
      message: `Boa meta: ${goals.goodLabel || goals.good}. Destaque: ${goals.standoutLabel || goals.standout}.`,
    };
  };

  const rateLower = (value, goals) => {
    if (value <= goals.standout) {
      return {
        tier: "standout",
        label: "Meta destaque",
        message: `Destaque alcançado. Referência: até ${goals.standoutLabel || goals.standout}.`,
      };
    }

    if (value <= goals.good) {
      return {
        tier: "good",
        label: "Boa meta",
        message: `Boa meta alcançada. Próximo destaque: até ${goals.standoutLabel || goals.standout}.`,
      };
    }

    return {
      tier: "training",
      label: "Meta do dia",
      message: `Boa meta: até ${goals.goodLabel || goals.good}. Destaque: até ${goals.standoutLabel || goals.standout}.`,
    };
  };

  const showGoalResult = (summaryElement, goal) => {
    let goalElement = summaryElement.parentElement.querySelector(".goal-result");

    if (!goalElement) {
      goalElement = document.createElement("p");
      summaryElement.insertAdjacentElement("afterend", goalElement);
    }

    goalElement.className = `goal-result goal-result--${goal.tier}`;
    goalElement.textContent = `${goal.label}: ${goal.message}`;
  };

  window.ReabilityDaily = {
    ensurePlayerName,
    getProfile,
    getUsage,
    recordAttempt,
    showLimitDialog,
    statusText,
    todayKey,
    updateLevelLock,
    validatePlayerName,
    goals: {
      rateHigher,
      rateLower,
      showGoalResult,
    },
  };
})();
