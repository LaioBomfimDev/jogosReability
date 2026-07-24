(() => {
  const TIME_ZONE = "America/Sao_Paulo";

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

  const getProfile = () => ({});

  const getUsage = () => ({
    used: 0,
    max: Number.POSITIVE_INFINITY,
    remaining: Number.POSITIVE_INFINITY,
    day: todayKey(),
  });

  const recordAttempt = () => ({ ok: true, ...getUsage() });

  const ensurePlayerName = () => Promise.resolve("visitante");

  const showLimitDialog = () => {};

  const statusText = ({ levelName }) => `${levelName}: partidas ilimitadas.`;

  const updateLevelLock = (button) => {
    button.classList.remove("is-daily-locked");
    button.removeAttribute("title");
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
      label: "Meta de treino",
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
      label: "Meta de treino",
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
    goals: {
      rateHigher,
      rateLower,
      showGoalResult,
    },
  };
})();
