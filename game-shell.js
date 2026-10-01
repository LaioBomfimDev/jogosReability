(function () {
  "use strict";

  const slug = window.location.pathname.split("/").filter(Boolean)[0] || "";
  const personalities = {
    "jogo-atencao-cores": {
      accent: "#f5c451",
      soft: "#fff1bd",
      steps: ["Escolha a regra que deseja treinar.", "Responda pela cor ou pela forma antes do tempo acabar.", "Mantenha o foco: a regra pode mudar a cada rodada."]
    },
    "jogo-rastreio-foco": {
      accent: "#53d3c8",
      soft: "#c9f4ef",
      steps: ["Encontre o quadrado dourado antes do movimento começar.", "Acompanhe o mesmo alvo enquanto todos se misturam.", "Quando pararem, selecione o quadrado que você seguiu."]
    },
    "jogo-memoria-neuro": {
      accent: "#ba91ff",
      soft: "#e8ddff",
      steps: ["Vire duas cartas por vez.", "Memorize símbolos e posições para formar pares.", "Complete o tabuleiro com o menor número de movimentos."]
    },
    "jogo-numero-neuro": {
      accent: "#63c7ff",
      soft: "#d7efff",
      steps: ["Escolha um número dentro do intervalo indicado.", "Use as pistas de maior ou menor.", "Encontre o número secreto antes de esgotar as tentativas."]
    },
    "jogo-cerebro-feliz": {
      accent: "#ff8f70",
      soft: "#ffe0d7",
      steps: ["Espere o cérebro aparecer em uma das casas.", "Toque nele o mais rápido possível.", "Evite cliques vazios para manter a precisão."]
    },
    "jogo-cubos-em-foco": {
      accent: "#f0b85a",
      soft: "#ffe9bd",
      steps: ["Observe com atenção a sequência dos cubos.", "Memorize as posições destacadas.", "Repita a sequência na mesma ordem."]
    },
    "jogo-matriz-neuro": {
      accent: "#74d7aa",
      soft: "#d5f5e6",
      steps: ["Analise a lógica das linhas e colunas.", "Descubra qual peça completa o padrão.", "Selecione a resposta antes do tempo terminar."]
    },
    "jogo-puzzle-rotacao": {
      accent: "#ffaf68",
      soft: "#ffe5cf",
      steps: ["Observe a imagem de referência.", "Gire as peças até reconstruir o desenho.", "Conclua o tabuleiro dentro do tempo."]
    },
    "jogo-ritmo-neuro": {
      accent: "#fd6fb3",
      soft: "#ffd7e9",
      steps: ["Acompanhe os marcadores que se aproximam do alvo.", "Toque no comando no instante certo.", "Mantenha a sequência para aumentar sua pontuação."]
    },
    "jogo-termo-unico": {
      accent: "#7ed394",
      soft: "#d8f3df",
      steps: ["Digite uma palavra válida de cinco letras.", "Verde indica letra e posição corretas; dourado indica outra posição.", "Descubra a palavra antes de acabar suas tentativas."]
    },
    "jogo-termo-dueto": {
      accent: "#64cbd0",
      soft: "#d2f2f3",
      steps: ["Cada palpite vale para os dois tabuleiros.", "Use as cores para combinar as pistas.", "Descubra as duas palavras dentro do limite."]
    },
    "jogo-termo-quarteto": {
      accent: "#a98cf3",
      soft: "#e6ddff",
      steps: ["Cada palpite revela pistas nos quatro tabuleiros.", "Compare as cores entre as palavras.", "Resolva as quatro antes de esgotar as tentativas."]
    }
  };

  const personality = personalities[slug] || {
    accent: "#d8cd9a",
    soft: "#f3edcf",
    steps: ["Configure a partida.", "Siga as instruções da rodada.", "Confira seu resultado ao final."]
  };

  const root = document.documentElement;
  root.style.setProperty("--game-accent", personality.accent);
  root.style.setProperty("--game-accent-soft", personality.soft);
  document.body.dataset.gameShell = slug;

  const soundKey = "reability:interface-sound";
  let soundEnabled = true;
  let audioContext;
  let observerQueued = false;

  try {
    soundEnabled = window.localStorage.getItem(soundKey) !== "off";
  } catch (_) {}

  const wait = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));

  const beep = (frequency, duration = 80) => {
    if (!soundEnabled || !(window.AudioContext || window.webkitAudioContext)) return;
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.08, audioContext.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration / 1000);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration / 1000 + 0.02);
    } catch (_) {}
  };

  const countdown = async () => {
    document.querySelector(".game-countdown")?.remove();
    const overlay = document.createElement("div");
    const value = document.createElement("strong");
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    overlay.className = "game-countdown";
    overlay.setAttribute("role", "status");
    overlay.setAttribute("aria-live", "assertive");
    overlay.append(value);
    document.body.append(overlay);
    document.body.classList.add("game-countdown-active");

    for (const item of ["3", "2", "1", "JÁ!"]) {
      value.textContent = item;
      value.classList.remove("is-entering");
      void value.offsetWidth;
      value.classList.add("is-entering");
      beep(item === "JÁ!" ? 880 : 520 + (3 - Number(item)) * 80, item === "JÁ!" ? 130 : 80);
      await wait(reducedMotion ? 150 : item === "JÁ!" ? 420 : 560);
    }

    overlay.classList.add("is-leaving");
    await wait(reducedMotion ? 0 : 140);
    overlay.remove();
    document.body.classList.remove("game-countdown-active");
  };

  window.ReabilityGameShell = { countdown };

  const setupSoundControl = () => {
    const navigation = document.querySelector(".game-hero .game-navigation");
    const brand = navigation?.querySelector(".brand-lock");
    if (!navigation || navigation.querySelector(".game-hero__tools")) return;

    const tools = document.createElement("div");
    const button = document.createElement("button");
    const icon = document.createElement("span");
    const label = document.createElement("span");
    tools.className = "game-hero__tools";
    button.className = "game-shell-sound";
    button.type = "button";
    icon.setAttribute("aria-hidden", "true");
    button.append(icon, label);

    const render = () => {
      icon.textContent = soundEnabled ? "♪" : "×";
      label.textContent = soundEnabled ? "Som da interface" : "Interface sem som";
      button.setAttribute("aria-pressed", String(soundEnabled));
      button.setAttribute("aria-label", soundEnabled ? "Desativar som da interface" : "Ativar som da interface");
    };

    button.addEventListener("click", () => {
      soundEnabled = !soundEnabled;
      try { window.localStorage.setItem(soundKey, soundEnabled ? "on" : "off"); } catch (_) {}
      render();
      if (soundEnabled) beep(700, 100);
    });

    render();
    tools.append(button);
    if (brand) tools.append(brand);
    navigation.append(tools);
  };

  const setupTutorial = () => {
    const hero = document.querySelector(".game-hero");
    if (!hero || document.querySelector(".game-tutorial")) return;

    const tutorial = document.createElement("details");
    const summary = document.createElement("summary");
    const icon = document.createElement("span");
    const title = document.createElement("strong");
    const meta = document.createElement("small");
    const list = document.createElement("ol");
    tutorial.className = "game-tutorial";
    icon.className = "game-tutorial__icon";
    icon.textContent = "?";
    title.textContent = "Como jogar";
    meta.textContent = "3 passos rápidos";
    summary.append(icon, title, meta);

    personality.steps.forEach((step, index) => {
      const item = document.createElement("li");
      const number = document.createElement("span");
      const copy = document.createElement("p");
      number.textContent = String(index + 1).padStart(2, "0");
      copy.textContent = step;
      item.append(number, copy);
      list.append(item);
    });

    tutorial.append(summary, list);
    hero.insertAdjacentElement("afterend", tutorial);

    try {
      const tutorialKey = `reability:tutorial:${slug}`;
      if (!window.sessionStorage.getItem(tutorialKey)) {
        tutorial.open = true;
        window.sessionStorage.setItem(tutorialKey, "seen");
      }
    } catch (_) {}
  };

  const findLobby = () => {
    const direct = document.querySelector("#setup, #start-screen, #difficulty-screen, #level-screen, #word-setup");
    if (direct) return direct;
    const config = document.querySelector(".game-config-grid, #cubos-config, #puzzle-config");
    return config?.closest("section, .challenge-panel, .game-panel, .game-stage") || config?.parentElement;
  };

  const fieldLabel = (field) => {
    const textNode = Array.from(field.childNodes).find((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
    return textNode?.textContent.trim().replace(/[:.]$/, "") || field.querySelector("strong")?.textContent.trim() || "Configuração";
  };

  const setupSteppers = (lobby) => {
    lobby.querySelectorAll('input[type="number"]').forEach((input) => {
      if (input.closest(".game-stepper")) return;
      const stepper = document.createElement("span");
      const minus = document.createElement("button");
      const plus = document.createElement("button");
      stepper.className = "game-stepper";
      minus.type = plus.type = "button";
      minus.textContent = "−";
      plus.textContent = "+";
      minus.setAttribute("aria-label", `Diminuir ${fieldLabel(input.closest("label") || input.parentElement)}`);
      plus.setAttribute("aria-label", `Aumentar ${fieldLabel(input.closest("label") || input.parentElement)}`);
      input.insertAdjacentElement("beforebegin", stepper);
      stepper.append(minus, input, plus);

      const adjust = (direction) => {
        const step = Number(input.step) || 1;
        const minimum = input.min === "" ? -Infinity : Number(input.min);
        const maximum = input.max === "" ? Infinity : Number(input.max);
        const current = Number(input.value) || 0;
        input.value = String(Math.min(maximum, Math.max(minimum, current + direction * step)));
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      };
      minus.addEventListener("click", () => adjust(-1));
      plus.addEventListener("click", () => adjust(1));
    });
  };

  const setupLobby = () => {
    const lobby = findLobby();
    if (!lobby || lobby.classList.contains("game-lobby")) return;
    lobby.classList.add("game-lobby");

    const existingKicker = lobby.querySelector(":scope > .eyebrow, :scope > .attention-section-kicker, :scope > .clinic-kicker");
    if (existingKicker) {
      existingKicker.classList.add("game-lobby__kicker");
      existingKicker.textContent = "Lobby da partida";
    } else {
      const kicker = document.createElement("p");
      kicker.className = "game-lobby__kicker";
      kicker.textContent = "Lobby da partida";
      lobby.prepend(kicker);
    }

    setupSteppers(lobby);

    const nativeSummary = lobby.querySelector(".game-config-summary, #setup-summary");
    if (nativeSummary) {
      nativeSummary.classList.add("game-lobby__summary", "game-lobby__summary--native");
      return;
    }

    const fields = Array.from(lobby.querySelectorAll(".game-config-field")).slice(0, 4);
    const startButton = lobby.querySelector("#start, #start-button, #memory-start-button, #number-start-button, #brain-start-button, #matrix-start-button, #rhythm-start-button, #word-start-button, button[type='submit'], .button-primary, .clinic-button:not(.secondary)");
    if (!fields.length || !startButton) return;

    const summary = document.createElement("div");
    summary.className = "game-lobby__summary";
    summary.setAttribute("aria-live", "polite");

    const render = () => {
      summary.replaceChildren();
      fields.forEach((field) => {
        const control = field.querySelector("select, input");
        if (!control) return;
        const chip = document.createElement("span");
        const label = document.createElement("small");
        const value = document.createElement("strong");
        label.textContent = fieldLabel(field);
        value.textContent = control instanceof HTMLSelectElement ? control.selectedOptions[0]?.textContent.trim() : control.value;
        chip.append(label, value);
        summary.append(chip);
      });
    };

    render();
    lobby.addEventListener("input", render);
    lobby.addEventListener("change", render);
    startButton.insertAdjacentElement("beforebegin", summary);
  };

  const decorateHud = () => {
    document.querySelectorAll(".game-status, .game-stats, .attention-stats, .rhythm-hud, .status-bar, .memory-stats, .matrix-stats, .word-stats").forEach((element) => element.classList.add("game-hud"));
  };

  const decorateResults = () => {
    document.querySelectorAll("dialog.result-dialog, dialog.victory-dialog, #result-dialog, #victory-dialog").forEach((dialog) => {
      const content = dialog.querySelector(":scope > div, .result-dialog__content, .victory-content, .dialog-content");
      if (!content || content.classList.contains("game-scoreboard")) return;
      content.classList.add("game-scoreboard");
      const mark = document.createElement("div");
      mark.className = "game-scoreboard__mark";
      mark.setAttribute("aria-hidden", "true");
      mark.textContent = "★";
      content.prepend(mark);
    });

    document.querySelectorAll("#result, .result-screen").forEach((result) => {
      if (result.closest("dialog") || result.classList.contains("game-scoreboard-inline")) return;
      result.classList.add("game-scoreboard-inline");
      const mark = document.createElement("div");
      mark.className = "game-scoreboard__mark";
      mark.setAttribute("aria-hidden", "true");
      mark.textContent = "★";
      result.prepend(mark);
    });
  };

  const decorate = () => {
    observerQueued = false;
    setupLobby();
    decorateHud();
    decorateResults();
  };

  setupSoundControl();
  setupTutorial();
  decorate();

  new MutationObserver(() => {
    if (observerQueued) return;
    observerQueued = true;
    window.requestAnimationFrame(decorate);
  }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["hidden", "open", "class"] });
})();
