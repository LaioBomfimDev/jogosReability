import { CATEGORIES, SLOTS, RUBRIC } from "./content.js";

export const MATERIALS = [
  "Madeira",
  "Couro",
  "Cobre",
  "Bronze",
  "Ferro",
  "Aço",
  "Prata",
  "Ouro",
  "Cristal",
  "Astral",
];
export const COLORS = [
  "#9b856b",
  "#b08861",
  "#cd8a63",
  "#d7a565",
  "#a6b6c6",
  "#bfd6e6",
  "#daedf5",
  "#efc76b",
  "#80e1ed",
  "#bd9bff",
];
export function gradeFrom(criteria) {
  if (
    !criteria ||
    RUBRIC.some(
      (c) =>
        !Number.isInteger(criteria[c.id]) ||
        criteria[c.id] < 1 ||
        criteria[c.id] > 10,
    )
  )
    throw new Error("Correção inválida.");
  return Math.max(
    1,
    Math.min(
      10,
      Math.round(RUBRIC.reduce((sum, c) => sum + criteria[c.id] * c.weight, 0)),
    ),
  );
}
export function rewardFor(level, score) {
  if (
    !Number.isInteger(level) ||
    level < 1 ||
    level > 10 ||
    !Number.isInteger(score) ||
    score < 1 ||
    score > 10
  )
    throw new Error("Recompensa inválida.");
  return {
    slot: SLOTS[level - 1][0],
    name: `${SLOTS[level - 1][1]} · ${MATERIALS[score - 1]}`,
    material: MATERIALS[score - 1],
    color: COLORS[score - 1],
    level,
    score,
    power: level * 10 + score,
  };
}
export function trendFor(results) {
  if (!results.length)
    return {
      kind: "neutral",
      title: "Sua história começa aqui",
      text: "Conclua um desafio para registrar a primeira nota.",
    };
  const last = results.at(-1).score;
  if (results.length === 1)
    return {
      kind: "neutral",
      title: "Primeira marca registrada",
      text: `Você começou com ${last}/10. A próxima etapa inicia a comparação.`,
    };
  const before = results.at(-2).score;
  const delta = last - before;
  const average = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  return {
    kind: delta > 0 ? "up" : delta < 0 ? "down" : "steady",
    title:
      delta > 0
        ? `Você subiu ${delta} ponto${delta === 1 ? "" : "s"}`
        : delta < 0
          ? `Sua nota caiu ${-delta} ponto${delta === -1 ? "" : "s"}`
          : "Desempenho estável",
    text: `De ${before}/10 para ${last}/10. Média da jornada: ${average.toFixed(1).replace(".", ",")}. ${results.length === 10 ? "Jornada concluída! Leve os aprendizados para a próxima aventura." : delta < 0 ? "Reveja as sugestões antes do próximo desafio." : delta > 0 ? "Boa evolução: leve os acertos para a próxima etapa." : "Use a correção para dar o próximo passo."} A dificuldade e a tarefa também mudam entre etapas.`,
  };
}
export function newJourney(gender, track) {
  if (
    !["male", "female"].includes(gender) ||
    !CATEGORIES.some((c) => c.id === track)
  )
    throw new Error("Escolha inválida.");
  return { version: 1, gender, track, results: [], draft: "", revealed: false };
}
export function acceptResult(state, result) {
  if (state.revealed || state.results.length >= 10)
    throw new Error("Etapa já concluída.");
  if (
    result.level !== state.results.length + 1 ||
    result.score !== gradeFrom(result.criteria)
  )
    throw new Error("Resultado incompatível.");
  return {
    ...state,
    results: [...state.results, { ...result, answer: state.draft }],
    draft: "",
    revealed: true,
  };
}
export function restoreJourney(raw) {
  try {
    const state = JSON.parse(raw);
    const base = newJourney(state.gender, state.track);
    if (
      state.version !== 1 ||
      !Array.isArray(state.results) ||
      state.results.length > 10 ||
      typeof state.draft !== "string" ||
      state.draft.length > 8000 ||
      typeof state.revealed !== "boolean"
    )
      return null;
    if (
      (!state.results.length && state.revealed) ||
      (state.results.length === 10 && !state.revealed)
    )
      return null;
    for (let i = 0; i < state.results.length; i++) {
      const r = state.results[i];
      if (
        r.level !== i + 1 ||
        r.score !== gradeFrom(r.criteria) ||
        typeof r.answer !== "string" ||
        r.answer.length > 8000 ||
        typeof r.summary !== "string" ||
        r.summary.length > 1600 ||
        !["strengths", "improvements"].every(
          (k) =>
            Array.isArray(r[k]) &&
            r[k].length <= 4 &&
            r[k].every((s) => typeof s === "string" && s.length <= 600),
        ) ||
        typeof r.example !== "string" ||
        r.example.length > 4000
      )
        return null;
    }
    return {
      ...base,
      results: state.results,
      draft: state.draft,
      revealed: state.revealed,
    };
  } catch {
    return null;
  }
}
