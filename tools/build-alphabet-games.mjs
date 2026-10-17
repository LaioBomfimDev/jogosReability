import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { games, ASSETS, letterImage, objects } from '../jogo-alfabeto-core/content.js';
const root=new URL('../',import.meta.url);
// The supplied SVGs include English captions. Keep only the illustration;
// the games add accessible Portuguese labels or intentionally hide word clues.
for(const object of objects) {
  const path=new URL(object.image.slice(1),root);
  let svg=await readFile(path,'utf8');
  if(svg.includes('<text')) {
    const captions=[...svg.matchAll(/<text\b[^>]*transform="translate\([\d.-]+[ ,]+([\d.-]+)\)"/g)];
    if(captions.length) {
      const bottom=Math.min(...captions.map(match=>Number(match[1])))-35;
      svg=svg.replace(/viewBox="0 0 ([\d.]+) ([\d.]+)"/,(_,width,height)=>`viewBox="0 0 ${width} ${Math.min(Number(height),bottom).toFixed(2)}"`);
    }
    svg=svg.replace(/<text\b[\s\S]*?<\/text>/g,'');
    await writeFile(path,svg);
  }
  const clean=svg.replace(/[\t ]+(?=\r?$)/gm,'');
  if(clean!==svg)await writeFile(path,clean);
}
for(const game of games) {
  const memory=game.id==='pares-gatinho', sequence=game.id==='sequencia-magica';
  const html=`<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="${game.description}">
  <meta name="theme-color" content="#080d18">
  <title>${game.title} · Reability</title>
  <link rel="icon" href="/assets/brand/favicon.ico" sizes="any">
  <link rel="stylesheet" href="/reability.css">
  <link rel="stylesheet" href="/clinic.css">
  <link rel="stylesheet" href="/jogo-alfabeto-core/style.css">
</head>
<body data-alphabet-game="${game.id}" style="--accent:${game.color}">
  <main class="alphabet-shell">
    <nav class="alphabet-nav" aria-label="Navegação do jogo">
      <a href="/index.html">← Todos os jogos</a>
      <div class="alphabet-brand"><img src="/assets/brand/logo-mark.png" alt="">Clínica Reability</div>
    </nav>
    <header class="alphabet-header">
      <div>
        <div class="alphabet-eyebrow"><span class="game-hero__number">Jogo ${game.number}</span><span>${game.tag}</span></div>
        <h1>${game.title}</h1>
        <p>${game.description}</p>
      </div>
      <img class="header-cat" src="${ASSETS}/cat/pointing.svg" alt="Gatinho guia dos jogos">
    </header>
    <section id="setup" class="alphabet-panel" data-game-screen aria-labelledby="setup-title">
      <p class="panel-kicker">Uma nova descoberta a cada partida</p>
      <h2 id="setup-title">Vamos preparar o jogo?</h2>
      <form id="start-form">
        <div class="setup-grid">
          <div class="setup-controls">
            <label for="level">Dificuldade
              <select id="level"><option value="easy">Fácil · primeiros passos</option><option value="medium">Médio · um pouco mais de desafio</option><option value="hard">Difícil · novas conquistas</option></select>
              <small>${memory?'3, 4 ou 6 pares de figuras, conforme a dificuldade.':sequence?'Memorize 2, 3 ou 5 figuras, conforme a dificuldade.':'A dificuldade ajusta a quantidade de opções ou a complexidade da tarefa.'}</small>
            </label>
            <label for="rounds">${memory?'Quantidade de tabuleiros':'Quantidade de rodadas'}
              <select id="rounds">${(memory?[1,2,3]:[5,10,15]).map(value=>`<option value="${value}">${value} ${memory?(value===1?'tabuleiro':'tabuleiros'):'rodadas'}</option>`).join('')}</select>
              <small>Jogue no seu ritmo. As respostas não têm limite de tempo.</small>
            </label>
            <label for="sequence-speed"${sequence?'':' hidden'}>Tempo para observar cada figura
              <select id="sequence-speed"><option value="1600">Tranquilo · 1,6 segundo</option><option value="1100" selected>Normal · 1,1 segundo</option><option value="700">Rápido · 0,7 segundo</option></select>
            </label>
            <label class="sound-field"><input id="sound" type="checkbox" checked>Sons de resposta</label>
          </div>
          <aside class="game-guide" aria-labelledby="guide-title">
            <h3 id="guide-title">Como jogar</h3>
            <ol>${game.steps.map(step=>`<li>${step}</li>`).join('')}</ol>
            <p>Use o toque ou o mouse. No teclado, Tab navega e Enter escolhe. Durante a partida, as teclas 1 a 9 também selecionam opções.</p>
          </aside>
        </div>
        <p id="setup-error" class="setup-error" role="alert"></p>
        <div class="alphabet-actions"><button id="start" class="alphabet-button" type="submit"><img src="${ASSETS}/ui/play.svg" alt="">Começar a jogar</button></div>
      </form>
    </section>
    <section id="play" class="alphabet-panel" data-game-screen data-game-focus tabindex="-1" aria-labelledby="instruction" hidden>
      <div class="game-stats"><span id="progress"></span><span id="score">0 acertos</span></div>
      <progress id="progress-bar" class="round-progress" value="0" max="5" aria-label="Progresso da partida"></progress>
      <div class="play-heading"><img id="mascot" src="${ASSETS}/cat/idle.svg" alt=""><h2 id="instruction" aria-live="polite"></h2></div>
      <div class="play-canvas">
        <div id="prompt" class="prompt"></div>
        <div id="slots" class="slots" aria-label="Sua sequência"></div>
        <div id="board" class="play-board" role="group" aria-label="Opções do desafio"></div>
      </div>
      <div id="feedback" class="feedback" role="status" aria-live="polite"></div>
      <div class="play-footer">
        <div class="alphabet-actions"><button id="undo" type="button" class="alphabet-button secondary" hidden>↶ Desfazer</button><button id="confirm" type="button" class="alphabet-button" hidden>Confirmar palavra</button><button id="next" type="button" class="alphabet-button" hidden>Próxima rodada →</button></div>
        <div class="alphabet-actions"><button id="stop" type="button" class="alphabet-button secondary">Encerrar</button></div>
      </div>
      <p class="keyboard-tip">Tab + Enter para escolher · teclas 1 a 9 para as primeiras nove opções</p>
    </section>
    <section id="result" class="alphabet-panel result-panel" data-game-screen aria-labelledby="result-title" hidden>
      <div class="result-art"><img id="result-mascot" src="${ASSETS}/cat/celebrate.svg" alt="Gatinho comemorando"><img id="result-award" src="${ASSETS}/ui/trophy.svg" alt="Recompensa da partida"></div>
      <p class="panel-kicker">O conhecimento cresce com você</p>
      <h2 id="result-title">Mais uma descoberta!</h2>
      <p id="summary"></p><p id="result-detail"></p><p id="result-save"></p>
      <div class="alphabet-actions"><button id="again" class="alphabet-button" type="button"><img src="${ASSETS}/ui/replay.svg" alt="">Jogar novamente</button><a class="alphabet-button secondary" href="/index.html">Explorar outros jogos</a></div>
    </section>
    <p class="asset-credit">Ilustrações: <a href="https://craftpix.net/" target="_blank" rel="noopener noreferrer">CraftPix · Alphabet Education Kit</a>. Atividades educativas da Reability.</p>
  </main>
  <script src="/clinic-local.js" defer></script><script src="/clinic.js" defer></script>
  <script src="/jogo-alfabeto-core/app.js" type="module"></script>
</body>
</html>
`;
  await mkdir(new URL(`${game.slug}/`,root),{recursive:true});
  await writeFile(new URL(`${game.slug}/index.html`,root),html);
}
const cards=games.map(game=>{
  const graphics=[...game.letters.map(letter=>({image:letterImage(letter),letter:true})),...game.images.map(id=>({image:objects.find(item=>item.id===id).image}))];
  return `          <article class="game-option game-option--alphabet">
            <a class="game-option__link" href="./${game.slug}/index.html" aria-label="Jogar ${game.title}">
              <div class="game-visual alphabet-preview" style="--preview-color:${game.color};--preview-bg:url('${ASSETS}/backgrounds/${game.background}.svg')" aria-hidden="true">
                <div class="alphabet-preview__art">${graphics.map((item,i)=>`<img class="alphabet-preview__item${item.letter?' alphabet-preview__letter':''}" src="${item.image}" alt="" width="160" height="180" loading="lazy" decoding="async" style="--tilt:${i%2===0?-9:9}deg">`).join('')}</div>
                <span class="alphabet-preview__tag">${game.tag}</span>
                <img class="alphabet-preview__cat" src="${ASSETS}/cat/happy.svg" alt="" width="120" height="140" loading="lazy" decoding="async">
                <span class="game-number">${game.number}</span><span class="game-badge">Novo</span>
              </div>
              <div class="game-option__content"><div><p class="game-kicker">3 níveis · ${game.skill}</p><h3>${game.title}</h3></div><span class="game-cta" aria-hidden="true">→</span></div>
            </a>
          </article>`;
}).join('\n\n');
const homePath=new URL('index.html',root);
let home=await readFile(homePath,'utf8');
const marker='          <!-- alphabet-games:start -->';
if(home.includes(marker)) home=home.replace(/          <!-- alphabet-games:start -->[\s\S]*?          <!-- alphabet-games:end -->/,`${marker}\n${cards}\n          <!-- alphabet-games:end -->`);
else home=home.replace('          </div>\n        </section>\n\n        <p class="notice">',`${marker}\n${cards}\n          <!-- alphabet-games:end -->\n          </div>\n        </section>\n\n        <p class="notice">`);
home=home.replace(/<strong>\d+<\/strong><span>jogos para/,`<strong>${9+games.length}</strong><span>jogos para`).replace(/<span class="game-count">\d+ jogos<\/span>/,`<span class="game-count">${9+games.length} jogos</span>`);
await writeFile(homePath,home);
console.log(`Generated ${games.length} game pages and updated the catalog to ${9+games.length} games.`);
