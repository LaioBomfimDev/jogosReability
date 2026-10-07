import {
  CATEGORIES,
  SLOTS,
  RUBRIC,
  challengeFor,
  difficulty,
} from "./content.js";
import {
  MATERIALS,
  COLORS,
  newJourney,
  restoreJourney,
  rewardFor,
  acceptResult,
  trendFor,
} from "./engine.js";
import { avatar, itemIcon } from "./avatar.js";

const $ = (selector) => document.querySelector(selector);
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const KEY = "reability-forja-criativa-v1";
let state = null;
let busy = false;
let available = null;
let checking = false;
let saveTimer;
try {
  state = restoreJourney(localStorage.getItem(KEY));
} catch {
  $("#storage-warning").hidden = false;
}

function save() {
  clearTimeout(saveTimer);
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    $("#storage-warning").hidden = true;
  } catch {
    $("#storage-warning").hidden = false;
  }
}
function focusTitle(selector) {
  $(selector).focus({ preventScroll: true });
  $(selector).scrollIntoView({
    block: "start",
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
  });
}
function list(selector, values) {
  $(selector).replaceChildren(
    ...values.map((value) => {
      const li = document.createElement("li");
      li.textContent = value;
      return li;
    }),
  );
}
function renderSetup() {
  $("#setup").hidden = false;
  $("#journey").hidden = true;
  $("#resume-box").hidden = !state;
  if (state)
    $("#resume-copy").textContent =
      `${state.results.length} de 10 desafios concluídos · ${CATEGORIES.find((c) => c.id === state.track).name}`;
  preview();
}
function preview() {
  const gender = $("#setup-form").elements.gender.value;
  $("#preview-name").textContent =
    gender === "female" ? "Guardiã da criação" : "Guardião da criação";
  $("#preview-avatar").innerHTML = avatar(gender, [], "preview");
}

$("#category-options").innerHTML = CATEGORIES.map(
  (c, i) =>
    `<label title="${escape(c.description)}"><input type="radio" name="track" value="${c.id}" ${i === 0 ? "checked" : ""}/><span><b aria-hidden="true">${c.icon}</b>${c.name}</span></label>`,
).join("");
$("#teaser-slots").innerHTML = SLOTS.map(
  ([id, name], i) =>
    `<div class="teaser-item">${itemIcon(id)}${name}<small>NÍVEL ${String(i + 1).padStart(2, "0")}</small></div>`,
).join("");
$("#material-list").innerHTML = MATERIALS.map(
  (name, i) => `<li style="color:${COLORS[i]}">${name}</li>`,
).join("");
$("#rubric-list").innerHTML = RUBRIC.map(
  (c) => `<span>${c.label}<b>${Math.round(c.weight * 100)}%</b></span>`,
).join("");
$("#setup-form").addEventListener("change", preview);
$("#setup-form").addEventListener("submit", (event) => {
  event.preventDefault();
  if (state) {
    $("#restart-dialog").showModal();
    return;
  }
  start();
});
function start() {
  state = newJourney(
    $("#setup-form").elements.gender.value,
    $("#setup-form").elements.track.value,
  );
  save();
  renderJourney();
  focusTitle("#challenge-title");
}
$("#restart-dialog").addEventListener("close", () => {
  if ($("#restart-dialog").returnValue === "confirm") start();
});
$("#resume").addEventListener("click", () => {
  renderJourney();
  focusTitle(state.revealed ? "#result-title" : "#challenge-title");
});
$("#change-journey").addEventListener("click", () => {
  if (!busy) {
    save();
    renderSetup();
    window.scrollTo({ top: 0 });
  }
});

async function checkService() {
  if (checking) return;
  checking = true;
  const target = $("#api-status");
  try {
    const response = await fetch("/api/creative-grade", {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error("Serviço indisponível");
    const data = await response.json();
    if (typeof data.available !== "boolean")
      throw new Error("Serviço indisponível");
    available = data.available;
    target.textContent = available
      ? ""
      : "A correção por IA aguarda ativação pelo responsável do site. Você já pode preparar sua resposta.";
  } catch {
    available = null;
    target.textContent =
      "Não foi possível conectar à correção. Seu rascunho fica neste navegador.";
  } finally {
    checking = false;
    if (available !== true) {
      const retry = document.createElement("button");
      retry.type = "button";
      retry.className = "quiet";
      retry.textContent = "Verificar conexão";
      retry.addEventListener("click", checkService);
      target.append(" ", retry);
    }
    $("#submit-answer").disabled = busy || available === false;
  }
}
window.addEventListener("online", checkService);

function renderJourney() {
  $("#setup").hidden = true;
  $("#journey").hidden = false;
  const level = Math.min(10, state.results.length + (state.revealed ? 0 : 1));
  const done = state.results.length === 10;
  $("#track-name").textContent = CATEGORIES.find(
    (c) => c.id === state.track,
  ).name;
  $("#journey-title").textContent = done
    ? "Jornada concluída"
    : "A sua jornada";
  $("#character-name").textContent =
    state.gender === "female" ? "Guardiã da criação" : "Guardião da criação";
  $("#gear-count").textContent = `${state.results.length} / 10 peças`;
  $("#equipped-avatar").innerHTML = avatar(
    state.gender,
    state.results,
    "equipped",
  );
  $("#power").textContent = state.results.reduce(
    (sum, r) => sum + rewardFor(r.level, r.score).power,
    0,
  );
  $("#inventory").innerHTML = SLOTS.map(([id, name], i) => {
    const result = state.results[i];
    const item = result && rewardFor(i + 1, result.score);
    const label = item
      ? `${item.name}. Nota ${item.score}. Poder ${item.power}.`
      : `${name}. Disponível no nível ${i + 1}.`;
    return `<div class="inventory-item ${item ? "earned" : ""}" ${item ? `style="--item:${item.color}"` : ""} tabindex="0" role="img" aria-label="${escape(label)}" title="${escape(label)}">${itemIcon(id)}<small>${item ? item.score : "·"}</small></div>`;
  }).join("");
  $("#level-path").innerHTML = SLOTS.map(
    (_, i) =>
      `<li class="${i < state.results.length ? "done" : ""} ${i + 1 === level ? "current" : ""}" ${i + 1 === level ? 'aria-current="step"' : ""}><b>${String(i + 1).padStart(2, "0")}${i < state.results.length ? " ✓" : ""}</b>${difficulty(i + 1)}</li>`,
  ).join("");
  $("#challenge-panel").hidden = state.revealed;
  $("#result-panel").hidden = !state.revealed;
  if (state.revealed) renderResult();
  else renderChallenge();
  renderProgress();
}
function renderChallenge() {
  const c = challengeFor(state.track, state.results.length + 1);
  $("#level-label").textContent =
    `NÍVEL ${String(c.level).padStart(2, "0")} / 10`;
  $("#difficulty").textContent =
    c.difficulty === "Extremo" ? "Extremo · desafio final" : c.difficulty;
  $("#category-label").textContent = CATEGORIES.find(
    (item) => item.id === c.category,
  ).name;
  $("#challenge-title").textContent = c.title;
  $("#brief").textContent = c.brief;
  list("#requirements", c.requirements);
  $("#reward-hint").innerHTML =
    `${itemIcon(SLOTS[c.level - 1][0])}<span>Recompensa desta etapa: <strong>${c.slot}</strong></span><small>Material definido pela nota</small>`;
  $("#answer").value = state.draft;
  $("#char-count").textContent =
    `${state.draft.length.toLocaleString("pt-BR")} / 8.000`;
  $("#answer-error").hidden = true;
  void checkService();
}
function renderResult() {
  const result = state.results.at(-1);
  const item = rewardFor(result.level, result.score);
  $("#result-eyebrow").textContent =
    `NÍVEL ${String(result.level).padStart(2, "0")} CONCLUÍDO · ${difficulty(result.level).toUpperCase()}`;
  $("#result-title").textContent =
    result.level === 10
      ? "Dez desafios. Uma jornada sua."
      : "Uma nova peça foi forjada.";
  $("#result-score").textContent = result.score;
  $("#reward-card").style.setProperty("--item", item.color);
  $("#reward-card").innerHTML =
    `${itemIcon(item.slot)}<div><small>EQUIPAMENTO RECEBIDO E EQUIPADO</small><strong>${item.name}</strong><p>Qualidade ${item.score}/10 · Nível ${item.level} · Poder ${item.power}</p></div>`;
  $("#feedback-summary").textContent = result.summary;
  const trend = trendFor(state.results);
  $("#result-trend").dataset.kind = trend.kind;
  $("#result-trend strong").textContent = trend.title;
  $("#result-trend p").textContent = trend.text;
  $("#criterion-scores").innerHTML = RUBRIC.map(
    (c) =>
      `<div class="criterion">${c.label}<strong>${result.criteria[c.id]}<small> / 10</small></strong><progress max="10" value="${result.criteria[c.id]}" aria-label="${c.label}"></progress></div>`,
  ).join("");
  list("#strengths", result.strengths);
  list("#improvements", result.improvements);
  $("#improved-example").textContent = result.example;
  $("#submitted-answer").textContent = result.answer;
  $("#next-level").textContent =
    result.level === 10
      ? "Escolher uma nova jornada →"
      : `Avançar para o nível ${result.level + 1} →`;
  $("#result-panel")
    .querySelectorAll("details")
    .forEach((d) => {
      d.open = false;
    });
}
function renderProgress() {
  const results = state.results;
  const average = results.length
    ? (results.reduce((sum, r) => sum + r.score, 0) / results.length)
        .toFixed(1)
        .replace(".", ",")
    : "—";
  $("#average").textContent =
    `Média ${average}${results.length ? " / 10" : ""}`;
  const x = (i) => 35 + i * 55;
  const y = (score) => 174 - ((score - 1) / 9) * 140;
  const points = results.map((r, i) => `${x(i)},${y(r.score)}`).join(" ");
  const description = results.length
    ? results.map((r) => `Nível ${r.level}: nota ${r.score}`).join("; ")
    : "Ainda sem notas. O gráfico será preenchido após cada correção.";
  $("#chart").innerHTML =
    `<svg viewBox="0 0 562 209" role="img" aria-labelledby="chart-title chart-description"><title id="chart-title">Notas por nível</title><desc id="chart-description">${description}</desc>
    ${[1, 4, 7, 10].map((n) => `<path d="M35 ${y(n)}H530" stroke="#393241" stroke-dasharray="3 5"/><text x="10" y="${y(n) + 4}">${n}</text>`).join("")}
    ${Array.from({ length: 10 }, (_, i) => `<text x="${x(i)}" y="201" text-anchor="middle">${i + 1}</text>`).join("")}
    ${results.length > 1 ? `<path d="M${x(0)} 174 L${points.replaceAll(" ", " L")} L${x(results.length - 1)} 174Z" fill="#b49bea0e"/><polyline points="${points}" fill="none" stroke="#b49bea" stroke-width="2.5" stroke-linejoin="round"/>` : ""}
    ${results.map((r, i) => `<circle cx="${x(i)}" cy="${y(r.score)}" r="5" fill="${i && r.score < results[i - 1].score ? "#efab86" : "#e7c88b"}" stroke="#181720" stroke-width="2"/><text x="${x(i)}" y="${y(r.score) - 12}" text-anchor="middle">${r.score}</text>`).join("")}
    ${!results.length ? '<text x="280" y="103" text-anchor="middle">Sua primeira nota começa esta linha.</text>' : ""}
  </svg>`;
  const trend = trendFor(results);
  $("#trend").dataset.kind = trend.kind;
  $("#trend strong").textContent = trend.title;
  $("#trend p").textContent = trend.text;
  $("#history-details").hidden = !results.length;
  $("#history").innerHTML = results
    .map((r) => {
      const c = challengeFor(state.track, r.level);
      return `<details class="history-row"><summary><span>${String(r.level).padStart(2, "0")} · ${escape(c.title)}</span><strong>${r.score}/10</strong></summary><p>${escape(r.summary)}</p><p><strong>Sua resposta</strong><br/>${escape(r.answer)}</p><p><strong>Para melhorar</strong><br/>${r.improvements.map(escape).join("<br/>")}</p></details>`;
    })
    .join("");
}

$("#answer").addEventListener("input", () => {
  if (!state || busy) return;
  state.draft = $("#answer").value;
  $("#char-count").textContent =
    `${state.draft.length.toLocaleString("pt-BR")} / 8.000`;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 250);
});
window.addEventListener("pagehide", () => {
  if (state) save();
});
$("#answer-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (busy || !state || state.revealed || state.results.length >= 10) return;
  state.draft = $("#answer").value;
  save();
  const errorEl = $("#answer-error");
  if (state.draft.trim().length < 5) {
    errorEl.textContent = "Escreva sua resposta antes de enviar.";
    errorEl.hidden = false;
    return;
  }
  const current = state;
  busy = true;
  $("#submit-answer").disabled = true;
  $("#answer").readOnly = true;
  $("#change-journey").disabled = true;
  $("#submit-answer").textContent = "A IA está lendo sua resposta…";
  errorEl.hidden = true;
  $("#answer-form").setAttribute("aria-busy", "true");
  try {
    const response = await fetch("/api/creative-grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(55000),
      body: JSON.stringify({
        track: current.track,
        level: current.results.length + 1,
        answer: current.draft,
      }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok)
      throw new Error(
        data?.error || "Não foi possível corrigir agora. Tente novamente.",
      );
    const next = acceptResult(current, data);
    const valid = restoreJourney(JSON.stringify(next));
    if (!valid)
      throw new Error(
        "A correção veio incompleta. Tente novamente; seu texto foi mantido.",
      );
    state = valid;
    save();
    renderJourney();
    focusTitle("#result-title");
  } catch (error) {
    errorEl.textContent =
      error.name === "TimeoutError" || error.name === "AbortError"
        ? "A correção demorou demais. Seu texto foi mantido. Tente novamente."
        : error.message === "Failed to fetch"
          ? "Sem conexão no momento. Seu rascunho foi mantido."
          : error.message;
    errorEl.hidden = false;
  } finally {
    busy = false;
    $("#submit-answer").disabled = available === false;
    $("#answer").readOnly = false;
    $("#change-journey").disabled = false;
    $("#submit-answer").textContent = "Enviar para a IA ✦";
    $("#answer-form").removeAttribute("aria-busy");
  }
});
$("#next-level").addEventListener("click", () => {
  if (!state?.revealed) return;
  if (state.results.length === 10) {
    renderSetup();
    window.scrollTo({ top: 0 });
    return;
  }
  state.revealed = false;
  save();
  renderJourney();
  focusTitle("#challenge-title");
});
renderSetup();
