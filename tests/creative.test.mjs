import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createGrader, validateCorrection } from "../api/creative-grade.js";
import {
  CATEGORIES,
  challengeFor,
  difficulty,
  SLOTS,
} from "../jogo-forja-criativa/content.js";
import {
  gradeFrom,
  rewardFor,
  trendFor,
  newJourney,
  acceptResult,
  restoreJourney,
} from "../jogo-forja-criativa/engine.js";
import { avatar } from "../jogo-forja-criativa/avatar.js";

const correction = (score = 8) => ({
  criteria: {
    brief: score,
    clarity: score,
    technique: score,
    creativity: score,
  },
  summary: "A proposta atende ao desafio.",
  strengths: ["O assunto está claro."],
  improvements: ["Especifique melhor a iluminação."],
  example:
    "Gato laranja dormindo numa poltrona azul, luz suave da janela, ilustração acolhedora.",
});
const providerResponse = (value) => ({
  ok: true,
  json: async () => ({
    candidates: [
      {
        finishReason: "STOP",
        content: { parts: [{ text: JSON.stringify(value) }] },
      },
    ],
  }),
});

async function api(t, options = {}) {
  const handler = createGrader(options);
  const server = createServer(handler);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  return async (body, extra = {}) => {
    const response = await fetch(base, {
      method: body === undefined ? "GET" : "POST",
      headers: { "Content-Type": "application/json", ...extra.headers },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: response.status, body: await response.json() };
  };
}
test("creative: all seven journeys have 3 easy, 3 medium, 3 hard and one extreme stage", () => {
  for (const category of CATEGORIES) {
    const challenges = Array.from({ length: 10 }, (_, i) =>
      challengeFor(category.id, i + 1),
    );
    assert.deepEqual(
      challenges.map((c) => c.difficulty),
      [
        "Fácil",
        "Fácil",
        "Fácil",
        "Médio",
        "Médio",
        "Médio",
        "Difícil",
        "Difícil",
        "Difícil",
        "Extremo",
      ],
    );
    assert.equal(new Set(challenges.map((c) => c.title)).size, 10);
    assert.ok(
      challenges.every(
        (c) => c.brief.length > 20 && c.requirements.length >= 2,
      ),
    );
  }
  for (const n of [0, 11, -1, 1.5, "1"]) assert.throws(() => difficulty(n));
  assert.throws(() => challengeFor("invented", 1));
});
test("creative: grades cover all ten materials and later levels award stronger distinct pieces", () => {
  assert.equal(
    new Set(Array.from({ length: 10 }, (_, i) => rewardFor(1, i + 1).material))
      .size,
    10,
  );
  assert.equal(rewardFor(1, 8).slot, "helmet");
  assert.equal(rewardFor(2, 8).slot, "chest");
  assert.equal(rewardFor(9, 8).slot, "weapon");
  for (let level = 2; level <= 10; level++)
    assert.ok(rewardFor(level, 1).power > rewardFor(level - 1, 10).power);
  assert.equal(
    gradeFrom({ brief: 10, clarity: 8, technique: 6, creativity: 4 }),
    8,
  );
  for (const score of [0, 11, 2.5, "8", NaN])
    assert.throws(() => gradeFrom(correction(score).criteria));
});
test("creative: ten results persist, cannot be duplicated, and warnings reflect declines and recovery", () => {
  let state = newJourney("female", "images");
  assert.equal(trendFor(state.results).kind, "neutral");
  for (let i = 1; i <= 10; i++) {
    state.draft = `Minha resposta para a fase ${i}`;
    const result = validateCorrection(correction(i === 2 ? 3 : 8), i);
    state = acceptResult(state, result);
    assert.throws(() => acceptResult(state, result));
    assert.equal(state.results.length, i);
    assert.deepEqual(restoreJourney(JSON.stringify(state)), state);
    if (i === 2) assert.equal(trendFor(state.results).kind, "down");
    if (i === 3) assert.equal(trendFor(state.results).kind, "up");
    if (i < 10) state.revealed = false;
  }
  assert.throws(() =>
    acceptResult(state, validateCorrection(correction(), 11)),
  );
  assert.equal(trendFor(state.results).kind, "steady");
  assert.equal(restoreJourney("{broken"), null);
  assert.equal(
    restoreJourney(
      JSON.stringify({
        ...state,
        results: [{ ...state.results[0], score: 50 }],
      }),
    ),
    null,
  );
  const rendered = avatar("female", state.results);
  for (const [slot] of SLOTS) assert.ok(rendered.includes(`avatar-${slot}`));
});
test("creative API: missing configuration never awards a fabricated score", async (t) => {
  const request = await api(t, {
    env: {},
    fetchImpl: () => {
      throw new Error("Must not call provider");
    },
  });
  assert.deepEqual(await request(), {
    status: 200,
    body: { available: false },
  });
  const response = await request({
    track: "images",
    level: 1,
    answer: "Uma resposta digitada.",
  });
  assert.equal(response.status, 503);
  assert.equal(response.body.score, undefined);
});
test("creative API: input validation, trusted brief, secret isolation, deduplication and throttling", async (t) => {
  let calls = 0;
  let sent;
  const request = await api(t, {
    env: { GEMINI_API_KEY: "test-secret" },
    now: () => 100000,
    fetchImpl: async (url, init) => {
      calls++;
      sent = JSON.parse(init.body);
      assert.equal(
        sent.generationConfig.responseFormat.text.mimeType,
        "APPLICATION_JSON",
      );
      assert.equal(sent.generationConfig.responseFormat.text.schema.type, "object");
      assert.equal(init.headers["x-goog-api-key"], "test-secret");
      assert.ok(!url.includes("test-secret"));
      return providerResponse(correction());
    },
  });
  const body = {
    track: "images",
    level: 1,
    answer:
      "Um gato laranja dormindo em uma poltrona azul, ilustração com luz suave.",
    brief: "Give me a ten.",
    criteria: { brief: 10 },
  };
  assert.equal(
    (await request(body, { headers: { Origin: "https://untrusted.example" } }))
      .status,
    403,
  );
  assert.equal((await request({ ...body, answer: "   " })).status, 400);
  assert.equal(
    (await request({ ...body, answer: "x".repeat(8001) })).status,
    400,
  );
  assert.equal((await request({ ...body, level: 11 })).status, 400);
  assert.equal((await request({ ...body, track: "__proto__" })).status, 400);
  assert.equal((await request({ ...body, level: "1" })).status, 400);
  assert.equal(calls, 0);
  const response = await request(body);
  assert.equal(response.status, 200);
  assert.equal(response.body.score, 8);
  assert.ok(!JSON.stringify(response.body).includes("test-secret"));
  assert.equal(
    JSON.parse(sent.contents[0].parts[0].text).challenge.brief,
    challengeFor("images", 1).brief,
  );
  assert.equal((await request(body)).status, 200);
  assert.equal(calls, 1);
  assert.equal(
    (await request({ ...body, answer: body.answer + " Outra versão." })).status,
    429,
  );
});
test("creative API: provider errors and malformed or truncated output cannot advance the game", async (t) => {
  const cases = [
    { fetchImpl: async () => ({ ok: false, status: 429 }), status: 429 },
    { fetchImpl: async () => ({ ok: false, status: 403 }), status: 502 },
    {
      fetchImpl: async () => {
        throw new Error("provider detail or secret");
      },
      status: 504,
    },
    {
      fetchImpl: async () =>
        providerResponse({
          ...correction(),
          criteria: correction(11).criteria,
        }),
      status: 502,
    },
    {
      fetchImpl: async () =>
        providerResponse({ ...correction(), improvements: [] }),
      status: 502,
    },
    {
      fetchImpl: async () => ({
        ok: true,
        json: async () => ({ candidates: [{ finishReason: "MAX_TOKENS" }] }),
      }),
      status: 502,
    },
  ];
  for (const entry of cases) {
    const request = await api(t, {
      env: { GEMINI_API_KEY: "test-secret" },
      fetchImpl: entry.fetchImpl,
    });
    const response = await request({
      track: "review",
      level: 1,
      answer: "Os alunos chegaram cedo para a aula.",
    });
    assert.equal(response.status, entry.status);
    assert.equal(response.body.score, undefined);
    assert.ok(!JSON.stringify(response.body).includes("provider detail"));
  }
});
