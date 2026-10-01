import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("catalog keeps ten game families numbered in a stable sequence", async () => {
  const home = await read("index.html");
  const numbers = [...home.matchAll(/<span class="game-number">(\d{2})<\/span>/g)].map((match) => match[1]);

  assert.match(home, /<span class="game-count">10 jogos<\/span>/);
  assert.deepEqual(numbers, ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"]);
});

test("game headers match the catalog and Termooo modes share family 09", async () => {
  const expected = new Map([
    ["jogo-atencao-cores/index.html", "01"],
    ["jogo-rastreio-foco/index.html", "02"],
    ["jogo-memoria-neuro/index.html", "03"],
    ["jogo-numero-neuro/index.html", "04"],
    ["jogo-cerebro-feliz/index.html", "05"],
    ["jogo-cubos-em-foco/index.html", "06"],
    ["jogo-matriz-neuro/index.html", "07"],
    ["jogo-puzzle-rotacao/index.html", "08"],
    ["jogo-termo-unico/index.html", "09"],
    ["jogo-termo-dueto/index.html", "09"],
    ["jogo-termo-quarteto/index.html", "09"],
    ["jogo-ritmo-neuro/index.html", "10"],
  ]);

  for (const [path, number] of expected) {
    assert.match(await read(path), new RegExp(`<span class="game-hero__number">Jogo ${number}<\\/span>`), path);
  }
});
