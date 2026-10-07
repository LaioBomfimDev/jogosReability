import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("catalog keeps nine active game families numbered in a stable sequence", async () => {
  const home = await read("index.html");
  const numbers = [...home.matchAll(/<span class="game-number">(\d{2})<\/span>/g)].map((match) => match[1]);

  assert.match(home, /<span class="game-count">9 jogos<\/span>/);
  assert.deepEqual(numbers, ["01", "02", "03", "04", "05", "06", "07", "08", "09"]);
  assert.doesNotMatch(home, /jogo-puzzle-rotacao|jogo-termo-unico/);
});

test("active game headers match the catalog", async () => {
  const expected = new Map([
    ["jogo-atencao-cores/index.html", "01"],
    ["jogo-rastreio-foco/index.html", "02"],
    ["jogo-memoria-neuro/index.html", "03"],
    ["jogo-numero-neuro/index.html", "04"],
    ["jogo-cerebro-feliz/index.html", "05"],
    ["jogo-cubos-em-foco/index.html", "06"],
    ["jogo-matriz-neuro/index.html", "07"],
    ["jogo-ritmo-neuro/index.html", "08"],
    ["jogo-forja-criativa/index.html", "09"],
  ]);

  for (const [path, number] of expected) {
    const html = await read(path);
    assert.match(html, new RegExp(`<span class="game-hero__number">Jogo ${number}<\\/span>`), path);
    assert.match(html, /data-game-focus/, `${path} precisa indicar a área interativa da partida`);
  }
});

test("the shared countdown sends players to the interactive area", async () => {
  const shell = await read("game-shell.js");

  assert.match(shell, /querySelectorAll\("\[data-game-focus\]"\)/);
  assert.match(shell, /game-tutorial\[open\]/);
  assert.match(shell, /queuePlayFocus\(\)/);
});

test("professional report ends after the summary and feedback", async () => {
  const report = await read("profissional.html");
  const behavior = await read("profissional.js");

  assert.match(report, /id="detail-summary"/);
  assert.doesNotMatch(report, /Desempenho por rodada|detail-rounds-section|detail-rows|detail-round-count/);
  assert.doesNotMatch(behavior, /detail-rows|detail-round-count|detail-round-number/);
});

test("home does not promise an XP system that the games do not have", async () => {
  const home = await read("index.html");
  const styles = await read("home.css");

  assert.doesNotMatch(home, /\bXP\b|hero-chip--score/i);
  assert.doesNotMatch(styles, /hero-chip--score/);
});

test("home hero keeps only the brand and the direct invitation to play", async () => {
  const home = await read("index.html");
  const styles = await read("home.css");

  assert.match(
    home,
    /Teste Seu <strong>Cérebro<\/strong>[\s\S]*?<div class="hero-brand"[\s\S]*?Escolha um jogo, desafie suas habilidades cognitivas\./,
  );
  assert.doesNotMatch(home, /Arena de desafios cognitivos|Desafio em destaque|FASE 01|hero-game/);
  assert.doesNotMatch(styles, /hero-kicker|hero-game|hero-chip|hero-orbit/);
});
