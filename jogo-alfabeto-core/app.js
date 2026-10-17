import { ASSETS, games, categories, letterImage } from './content.js';
import { makeChallenge } from './engine.js';

const $ = id => document.getElementById(id);
const game = games.find(item=>item.id===document.body.dataset.alphabetGame);
const clinic = window.ReabilityClinic;
let state='setup', challenge, round=0, correct=0, errors=0, level='easy', roundLimit=5;
let selected=[], used=[], opened=[], matched=new Set(), timer, shownAt=0, startedAt=0, sequenceMs=1100, hintUsed=false;
const multiChoice = ['palavra-pecas','trilha-alfabeto','sequencia-magica'].includes(game.id);
const categoryExamples = {animals:'Como gato, elefante e sapo',food:'Como maçã, sorvete e suco',nature:'Como árvore, lua e vulcão',transport:'Como carro, trem e foguete',things:'Como bola, casa e caderno'};
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const cat = expression => { $('mascot').src=`${ASSETS}/cat/${expression}.svg`; };
const cancelTimer = () => { clearTimeout(timer); timer=undefined; };
const image = (src, alt='', className='') => {
  const el=document.createElement('img'); el.src=src; el.alt=alt; el.className=className; el.draggable=false; return el;
};
const text = (tag, value, className='') => { const el=document.createElement(tag); el.textContent=value; el.className=className; return el; };
const button = (label, handler, className='piece') => {
  const el=document.createElement('button'); el.type='button'; el.className=className; el.setAttribute('aria-label',label); el.onclick=handler; return el;
};
const objectButton = (item, handler, index) => {
  const el=button(item.name,handler); el.dataset.option=String(index); el.append(image(item.image,item.name)); return el;
};
const letterVisual = (letter, style='colored') => /^[A-Z]$/.test(letter)?image(letterImage(letter,style),letter):text('span',letter,'accent-letter');
const letterButton = (letter, handler, index) => {
  const el=button(`Letra ${letter}`,handler,'piece letter-piece'); el.dataset.option=String(index);
  const style=game.id==='jardim-letras'?{easy:'colored',medium:'regular',hard:'outline'}[level]:'colored';
  el.append(letterVisual(letter,style)); return el;
};
function sound(success) {
  if(!$('sound').checked) return;
  try {
    const Context=window.AudioContext||window.webkitAudioContext;
    if(!Context) return;
    sound.context ||= new Context();
    void sound.context.resume();
    const tone=sound.context.createOscillator(), gain=sound.context.createGain();
    tone.frequency.value=success?660:260; gain.gain.setValueAtTime(.045,sound.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001,sound.context.currentTime+.18);
    tone.connect(gain).connect(sound.context.destination); tone.start(); tone.stop(sound.context.currentTime+.2);
  } catch {}
}
function showScreen(id) {
  for(const screen of ['setup','play','result']) $(screen).hidden=screen!==id;
}
function controls() {
  $('undo').hidden=!multiChoice;
  $('confirm').hidden=!multiChoice; $('confirm').disabled=true;
  $('confirm').textContent=game.id==='palavra-pecas'?'Conferir palavra':game.id==='trilha-alfabeto'?'Conferir ordem':'Conferir sequência';
  $('close-pair').hidden=true;$('show-sequence').hidden=true;
  $('show-hint').hidden=game.id!=='palavra-pecas'||level==='easy';
  $('show-hint').textContent='Dica: mostrar nome';$('show-hint').disabled=false;
  $('next').hidden=true;
}
function phase(label, help) { $('phase').textContent=label;$('task-help').textContent=help; }
function record(ok, choice, expected, extra={}) {
  clinic.round({ correct:ok, choice, expected, item:challenge.object.id, hintUsed, responseMs:Math.max(0,Math.round(performance.now()-shownAt)), ...extra });
  if(ok)correct++;else errors++;
  $('score').textContent=`${correct} ${correct===1?'acerto':'acertos'}`;
}
function feedback(ok, message) {
  state='feedback'; cancelTimer();
  $('play').dataset.stage='feedback';
  for(const el of $('board').querySelectorAll('button')) el.disabled=true;
  $('confirm').hidden=true; $('undo').hidden=true;
  $('close-pair').hidden=true;$('show-hint').hidden=true;
  $('phase').textContent=ok?'Resposta conferida · acerto':'Resposta conferida · vamos aprender';
  $('progress-bar').value=round;
  $('task-help').textContent=round===roundLimit?'Esta foi a última rodada. Toque em Ver resultado.':'Observe a resposta e avance quando estiver pronto.';
  $('feedback').textContent=message; $('feedback').dataset.kind=ok?'correct':'incorrect';
  $('feedback').append(image(`${ASSETS}/ui/${ok?'gold-star':'bronze-star'}.svg`,'','feedback-star'));
  cat(ok?'happy':'pointing'); sound(ok);
  $('next').hidden=false; $('next').textContent=round===roundLimit?'Ver resultado':'Próxima rodada →';
  $('next').focus({preventScroll:true});
}
function answer(value, el) {
  if(state!=='answer')return;
  const ok=value===challenge.answer;
  record(ok,value,challenge.answer);
  el?.classList.add(ok?'is-correct':'is-incorrect');
  const expected = game.id==='cada-coisa'?categories[challenge.answer]:game.id==='olho-lince'?challenge.object.name:challenge.answer;
  if(!ok) {
    const index=challenge.options.findIndex(option=>(option.id||option)===challenge.answer);
    $('board').children[index]?.classList.add('is-correct');
  }
  feedback(ok,ok?`Muito bem! ${game.id==='jardim-letras'?`${challenge.object.name} começa com ${expected}.`:game.id==='conta-brinca'?`Há ${expected} figuras iguais ao modelo dentro do quadro.`:game.id==='cada-coisa'?`${challenge.object.name} pertence ao grupo ${expected}.`:`Você encontrou ${expected}.`}`:`A resposta correta é ${expected}. Ela está marcada em verde.`);
  if(!ok&&game.id==='olho-lince') {
    const correction=document.createElement('div');correction.className='correction';correction.append(text('span','Figura correta:'),image(challenge.object.image,challenge.object.name));$('feedback').append(correction);
  }
}
function promptObject(showName=false, label='') {
  const card=document.createElement('div');card.className='reference-card';
  if(label)card.append(text('span',label,'reference-label'));
  card.append(image(challenge.object.image,showName?challenge.object.name:'Figura do desafio'));
  if(showName)card.append(text('strong',challenge.object.name));
  $('prompt').append(card);
}
function renderSlots() {
  $('slots').replaceChildren();
  const total=challenge.answer.length;
  $('selection-count').textContent=`${selected.length} de ${total} ${game.id==='palavra-pecas'?'espaços preenchidos':'posições preenchidas'}`;
  $('selection-label').textContent=game.id==='palavra-pecas'?'Complete os espaços vazios':game.id==='trilha-alfabeto'?'Sua ordem alfabética':'Sua sequência completa';
  const ready=selected.length===total;
  $('confirm').disabled=!ready;
  $('selection-help').textContent=ready?'Tudo preenchido. Revise e toque em Conferir.':game.id==='palavra-pecas'?'O próximo espaço vazio está destacado.':`Escolha a figura para a ${selected.length+1}ª posição${game.id==='trilha-alfabeto'?' do alfabeto':''}.`;
  if(game.id==='trilha-alfabeto'&&!ready)$('selection-help').textContent=`Escolha a letra para a ${selected.length+1}ª posição.`;
  if(game.id==='palavra-pecas') {
    challenge.letters.forEach((letter,i)=>{
      const missingIndex=challenge.missing.indexOf(i), value=missingIndex<0?letter:selected[missingIndex];
      const slot=text('span','','letter-slot');
      if(missingIndex>=0)slot.classList.add('is-missing');
      if(value)slot.append(letterVisual(value,missingIndex<0?'regular':'colored'));
      if(missingIndex===selected.length)slot.classList.add('is-current');
      slot.setAttribute('aria-label',`Posição ${i+1}: ${value?`letra ${value}`:'espaço vazio'}`); $('slots').append(slot);
    });
    $('confirm').disabled=selected.length!==challenge.answer.length;
  } else {
    const size=challenge.answer.length;
    for(let i=0;i<size;i++) {
      const slot=text('span','','sequence-slot'); const value=selected[i];
      if(value) {
        if(game.id==='trilha-alfabeto')slot.append(letterVisual(value));
        else { const item=challenge.options.find(item=>item.id===value); slot.append(image(item.image,item.name)); }
      } else slot.append(text('span','?','slot-placeholder'));
      slot.append(text('small',`${i+1}ª`,'slot-number'));
      if(i===selected.length)slot.classList.add('is-current');
      slot.setAttribute('aria-label',`Posição ${i+1}: ${value?(game.id==='trilha-alfabeto'?value:challenge.options.find(item=>item.id===value).name):'vazia'}`);
      $('slots').append(slot);
    }
  }
  $('undo').disabled=!selected.length||state!=='answer';
}
function select(value,index,el) {
  if(state!=='answer')return;
  if(game.id!=='sequencia-magica'&&used.includes(index))return;
  const max=challenge.answer.length;
  if(selected.length>=max)return;
  selected.push(value);used.push(index);
  if(game.id!=='sequencia-magica'){el.disabled=true;el.classList.add('is-used');}
  renderSlots();
  if(selected.length===max)$('confirm').focus({preventScroll:true});
}
function confirmSelection() {
  if(state!=='answer'||selected.length!==challenge.answer.length)return;
  const ok=selected.every((item,i)=>item===challenge.answer[i]);
  record(ok,[...selected],challenge.answer);
  const expected=game.id==='palavra-pecas'?challenge.object.name:game.id==='trilha-alfabeto'?challenge.answer.join(' → '):challenge.sequence.map(item=>item.name).join(' → ');
  feedback(ok,ok?`Você conseguiu! ${game.id==='palavra-pecas'?challenge.object.name:'Sequência completa.'}`:`A sequência correta é: ${expected}.`);
  if(!ok) {
    const correction=document.createElement('div');correction.className='correction';
    (game.id==='palavra-pecas'?challenge.letters:challenge.answer).forEach((value,i)=>{
      const position=document.createElement('span');position.className='correction-position';
      if(game.id==='sequencia-magica'){const item=challenge.options.find(item=>item.id===value);position.append(image(item.image,item.name));}
      else position.append(letterVisual(value));
      position.append(text('small',`${i+1}ª`));correction.append(position);
    });
    $('feedback').append(correction);
  }
}
function memoryGuide() {
  const pairs=matched.size/2,total=challenge.cards.length/2;
  $('task-help').textContent=`${pairs} de ${total} pares encontrados. ${opened.length?'Agora escolha a segunda carta.':'Escolha a primeira carta de um novo par.'}`;
}
function flip(index,el) {
  if(state!=='answer'||matched.has(index)||opened.includes(index)||opened.length>=2)return;
  const item=challenge.cards[index].object;
  el.replaceChildren(image(item.image,item.name));el.classList.add('is-open');el.setAttribute('aria-label',item.name);
  opened.push(index);
  memoryGuide();if(opened.length!==2)return;
  const [a,b]=opened, ok=challenge.cards[a].object.id===challenge.cards[b].object.id;
  record(ok,challenge.cards[b].object.id,challenge.cards[a].object.id,{cardPositions:[a,b]});
  if(ok) {
    matched.add(a);matched.add(b);opened=[];
    for(const i of [a,b]) {const card=$('board').children[i];card.classList.add('is-matched');card.disabled=true;}
    sound(true);cat('happy');$('feedback').textContent='Par encontrado! As duas cartas ficam abertas.';memoryGuide();
    if(matched.size===challenge.cards.length)feedback(true,'Todos os pares encontrados! Boa memória.');
    else shownAt=performance.now();
  } else {
    state='memory-review';cat('thinking');$('feedback').textContent='As figuras são diferentes. Memorize onde cada uma está.';
    phase('Observe as duas cartas','Quando estiver pronto, toque em Fechar estas cartas para tentar outro par.');
    for(const card of $('board').children)card.disabled=true;
    $('close-pair').hidden=false;$('close-pair').focus({preventScroll:true});
  }
}
function revealSequence() {
  if(state!=='sequence-ready')return;
  let position=0;state='watch';$('undo').disabled=true;cat('thinking');
  $('play').dataset.stage='watch';
  $('show-sequence').hidden=true;$('slots-panel').hidden=true;
  phase('1 · Observe e memorize',`Você verá ${challenge.sequence.length} figuras. Espere todas aparecerem para responder.`);
  const frame=()=>{
    if(state!=='watch')return;
    $('prompt').replaceChildren();
    if(position===challenge.sequence.length) {
      $('instruction').textContent=`Repita a sequência completa de ${challenge.sequence.length} figuras.`;
      phase('2 · Monte sua resposta','Toque nas figuras na ordem em que apareceram, do começo ao fim. A mesma figura pode se repetir.');
      $('slots-panel').hidden=false;$('confirm').hidden=false;$('undo').hidden=false;renderSlots();
      $('board').hidden=false;$('board-label').hidden=false;state='answer';$('play').dataset.stage='answer';shownAt=performance.now();cat('pointing');
      $('board').querySelector('button')?.focus({preventScroll:true});return;
    }
    const item=challenge.sequence[position++];
    $('instruction').textContent=`Memorize a sequência inteira de ${challenge.sequence.length} figuras.`;
    const card=document.createElement('div');card.className='reference-card sequence-flash';
    card.append(text('span',`Figura ${position} de ${challenge.sequence.length}`,'reference-label'),image(item.image,item.name));$('prompt').append(card);
    timer=setTimeout(()=>{ $('prompt').replaceChildren();timer=setTimeout(frame,250); },sequenceMs);
  };
  // Let the game surface become visible before the first timed figure.
  timer=setTimeout(frame,500);
}
async function nextRound() {
  cancelTimer();
  if(round>=roundLimit) { finish();return; }
  const previous=challenge?.object.id;
  challenge=makeChallenge(game.id,level,Math.random,previous); round++;
  state='answer';selected=[];used=[];opened=[];matched=new Set();hintUsed=false;
  $('play').dataset.stage='answer';
  $('progress').textContent=`${game.id==='pares-gatinho'?'Tabuleiro':'Rodada'} ${round} de ${roundLimit}`;
  $('progress-bar').value=round-1;$('progress-bar').max=roundLimit;
  $('feedback').replaceChildren();$('feedback').dataset.kind='';
  $('board').replaceChildren();$('board').hidden=false;$('board').className=`play-board board-${game.id}`;
  $('prompt').replaceChildren();$('slots').replaceChildren();cat('idle');controls();
  $('slots-panel').hidden=!multiChoice;$('board-label').hidden=false;
  $('board-label').textContent='Escolha uma opção';
  $('slots').setAttribute('aria-label',game.id==='palavra-pecas'?'Palavra em construção':'Posições da sua resposta, na ordem');
  phase('Sua vez','Toque em uma única opção abaixo para responder.');
  switch(game.id) {
    case 'jardim-letras':
      $('instruction').textContent='Qual é a primeira letra desta palavra?';promptObject(true);
      $('board-label').textContent='Escolha a letra inicial';
      $('task-help').textContent='Leia o nome abaixo da figura e toque na primeira letra da palavra.';
      challenge.options.forEach((letter,i)=>{const el=letterButton(letter,()=>answer(letter,el),i);$('board').append(el);});break;
    case 'palavra-pecas':
      $('instruction').textContent=level==='hard'?'Monte o nome completo da figura.':'Complete os espaços vazios da palavra.';promptObject();renderSlots();
      $('prompt').append(text('p',`${challenge.letters.length} letras${level==='easy'?' · '+challenge.object.name:''}`,'word-hint'));
      $('task-help').textContent=`Preencha ${challenge.missing.length===1?'o espaço vazio':'os '+challenge.missing.length+' espaços vazios'} da esquerda para a direita e toque em Conferir palavra.`;
      $('board-label').textContent='Letras disponíveis · toque para usar';
      challenge.bank.forEach((letter,i)=>{const el=letterButton(letter,()=>select(letter,i,el),i);$('board').append(el);});break;
    case 'trilha-alfabeto':
      $('instruction').textContent=`Organize todas as ${challenge.answer.length} letras em ordem alfabética.`;renderSlots();
      $('task-help').textContent=`Trecho desta rodada: de ${challenge.answer[0]} até ${challenge.answer.at(-1)}. Preencha todas as posições e confira a ordem.`;
      $('board-label').textContent='Letras disponíveis · use todas';
      challenge.options.forEach((letter,i)=>{const el=letterButton(letter,()=>select(letter,i,el),i);$('board').append(el);});break;
    case 'pares-gatinho':
      $('instruction').textContent=`Encontre os ${challenge.cards.length/2} pares de figuras iguais.`;
      memoryGuide();$('board-label').textContent='Escolha duas cartas por tentativa';
      challenge.cards.forEach((_,i)=>{const el=button(`Carta ${i+1}, fechada`,()=>flip(i,el),'piece memory-card');el.append(image(`${ASSETS}/cat/idle.svg`,''));$('board').append(el);});break;
    case 'olho-lince':
      $('instruction').textContent='Encontre uma figura igual ao modelo.';promptObject(false,'Modelo para encontrar');
      $('board-label').textContent='Procure a mesma figura entre estas opções';
      $('task-help').textContent='Compare as opções com o modelo. Toque somente na figura igual.';
      challenge.options.forEach((item,i)=>{const el=objectButton(item,()=>answer(item.id,el),i);$('board').append(el);});break;
    case 'conta-brinca': {
      $('instruction').textContent='Quantas figuras iguais ao modelo estão no quadro?';
      $('task-help').textContent='Conte apenas as figuras dentro da área de contagem. O modelo acima fica de fora.';
      const target=document.createElement('div');target.className='count-target';target.append(image(challenge.object.image,challenge.object.name),text('strong',`Modelo: ${challenge.object.name}`),text('small','O modelo fica fora da contagem'));$('prompt').append(target);
      $('prompt').append(text('p','Área de contagem','count-field-label'));
      const field=document.createElement('div');field.className='count-field';field.setAttribute('aria-label','Figuras para contar');
      challenge.items.forEach(item=>field.append(image(item.image,item.name)));$('prompt').append(field);
      $('board-label').textContent='Escolha a quantidade que você contou no quadro';
      challenge.options.forEach((value,i)=>{const el=button(`Quantidade ${value}`,()=>answer(value,el),'piece number-piece');el.dataset.option=String(i);el.textContent=String(value);$('board').append(el);});break;
    }
    case 'sequencia-magica':
      $('instruction').textContent=`Memorize e repita uma sequência de ${challenge.sequence.length} figuras.`;
      phase('1 · Prepare-se para observar',`Você verá ${challenge.sequence.length} figuras, uma por vez. Depois, preencha as ${challenge.sequence.length} posições na mesma ordem. A mesma figura pode se repetir.`);
      state='sequence-ready';$('play').dataset.stage='sequence-ready';$('slots-panel').hidden=true;$('board').hidden=true;$('confirm').hidden=true;$('undo').hidden=true;
      $('board-label').textContent='Figuras disponíveis · você pode tocar na mesma mais de uma vez';
      $('board-label').hidden=true;
      $('show-sequence').hidden=false;$('show-sequence').textContent=`Ver sequência de ${challenge.sequence.length} figuras`;
      challenge.options.forEach((item,i)=>{const el=objectButton(item,()=>select(item.id,i,el),i);$('board').append(el);});break;
    case 'cada-coisa':
      $('instruction').textContent='Qual grupo combina com esta figura?';promptObject(true);
      $('task-help').textContent='Leia os exemplos dos grupos abaixo e escolha um deles.';$('board-label').textContent='Escolha um grupo';
      challenge.options.forEach((value,i)=>{const el=button(`${categories[value]}. ${categoryExamples[value]}`,()=>answer(value,el),'piece category-piece');el.dataset.option=String(i);el.append(text('strong',categories[value]),text('small',categoryExamples[value]));$('board').append(el);});break;
  }
  shownAt=performance.now();clinic.mark();
  if(state==='sequence-ready')$('show-sequence').focus({preventScroll:true});
  else if(state==='answer') {
    const first=$('board').querySelector('button');first?.focus({preventScroll:true});
  }
}
function finish(interrupted=false, reason='') {
  if(['setup','result'].includes(state))return;
  const completedRounds=round-(state==='feedback'?0:1);
  cancelTimer();state='result';
  const attempts=correct+errors, accuracy=attempts?Math.round(correct/attempts*100):0;
  clinic.finish({correct,errors,totalRounds:roundLimit,completedRounds:interrupted?Math.max(0,completedRounds):round,accuracy,...(reason?{reason}:{})},interrupted?'interrupted':'completed');
  $('result-title').textContent=interrupted?'Partida encerrada':'Mais uma descoberta!';
  const unit=game.id==='pares-gatinho'?'par encontrado':'rodada respondida corretamente';
  const units=game.id==='pares-gatinho'?'pares encontrados':'rodadas respondidas corretamente';
  $('summary').textContent=attempts?`${correct} ${correct===1?unit:units} em ${attempts} ${attempts===1?'tentativa':'tentativas'}.`:'Nenhuma resposta foi enviada nesta partida.';
  const seconds=Math.max(0,Math.round((performance.now()-startedAt)/1000));
  $('result-detail').textContent=`${attempts?`Você acertou ${accuracy}% das tentativas. `:''}Tempo de jogo: ${Math.floor(seconds/60)}min ${String(seconds%60).padStart(2,'0')}s. ${reason==='hidden'?'A partida foi encerrada porque a página ficou em segundo plano.':'Cada tentativa é uma oportunidade de aprender.'}`;
  $('result-save').textContent=clinic.isProfessional()?'Confira o salvamento na barra superior.':'Partida livre · jogue novamente quando quiser.';
  $('result-mascot').src=`${ASSETS}/cat/${interrupted?'idle':'celebrate'}.svg`;
  $('result-award').src=`${ASSETS}/ui/${accuracy>=80?'trophy':accuracy>=50?'gold-star':'silver-star'}.svg`;
  $('result').classList.toggle('is-celebrating',!interrupted&&!reducedMotion);
  showScreen('result');$('again').focus({preventScroll:true});
}
$('start-form').onsubmit=async event=>{
  event.preventDefault();if(state!=='setup')return;
  const startButton=$('start');startButton.disabled=true;
  try {
    await clinic.ready;await clinic.confirmReady();
    level=$('level').value;roundLimit=Number($('rounds').value);sequenceMs=Number($('sequence-speed').value);
    if(!['easy','medium','hard'].includes(level)||!Number.isInteger(roundLimit)||roundLimit<1||roundLimit>15)throw new Error('Confira a configuração da partida.');
    if(document.hidden){$('setup-error').textContent='Volte para esta página e inicie a partida novamente.';return;}
    correct=0;errors=0;round=0;challenge=null;startedAt=performance.now();
    clinic.start(game.id,level,{rounds:roundLimit,sequenceMs,sound:$('sound').checked});
    $('score').textContent='0 acertos';showScreen('play');await nextRound();
    clinic.focusGame($('play'));
  } catch(error) { $('setup-error').textContent=error.message;state='setup';showScreen('setup'); }
  finally {startButton.disabled=false;}
};
$('undo').onclick=()=>{
  if(state!=='answer'||!selected.length)return;
  selected.pop();const index=used.pop();
  if(game.id!=='sequencia-magica'){$('board').children[index].disabled=false;$('board').children[index].classList.remove('is-used');}
  renderSlots();
};
$('show-sequence').onclick=revealSequence;
$('show-hint').onclick=()=>{
  if(state!=='answer'||game.id!=='palavra-pecas'||hintUsed)return;
  hintUsed=true;$('prompt').append(text('strong',`Nome da figura: ${challenge.object.name}`,'revealed-hint'));
  $('show-hint').disabled=true;$('show-hint').textContent='Dica exibida';
};
$('close-pair').onclick=()=>{
  if(state!=='memory-review')return;
  for(const i of opened) {
    const card=$('board').children[i];card.replaceChildren(image(`${ASSETS}/cat/idle.svg`,''));card.classList.remove('is-open');card.setAttribute('aria-label',`Carta ${i+1}, fechada`);
  }
  for(let i=0;i<challenge.cards.length;i++)$('board').children[i].disabled=matched.has(i);
  opened=[];state='answer';shownAt=performance.now();$('feedback').textContent='Escolha mais duas cartas.';
  $('close-pair').hidden=true;phase('Sua vez','');memoryGuide();
  $('board').querySelector('button:not(:disabled)')?.focus({preventScroll:true});
};
$('confirm').onclick=confirmSelection;
$('next').onclick=()=>{if(state==='feedback')void nextRound();};
$('stop').onclick=()=>finish(true);
$('again').onclick=()=>{state='setup';showScreen('setup');$('setup-error').textContent='';$('start').focus({preventScroll:true});};
function updateDifficulty() {
  const index={easy:0,medium:1,hard:2}[$('level').value]??0;
  const descriptions={
    'jardim-letras':['Escolha a letra inicial entre 3 opções coloridas.','Escolha a letra inicial entre 4 opções.','Escolha a letra inicial entre 6 letras em contorno.'],
    'palavra-pecas':['Complete 1 espaço em uma palavra de até 4 letras. O nome da figura fica visível.','Complete 2 espaços em uma palavra de até 6 letras. Uma dica com o nome fica disponível.','Monte todas as letras de uma palavra de até 10 letras. Uma dica com o nome fica disponível.'],
    'trilha-alfabeto':['Organize todas as 3 letras do trecho.','Organize todas as 5 letras do trecho.','Organize todas as 7 letras do trecho.'],
    'pares-gatinho':['Encontre 3 pares em 6 cartas.','Encontre 4 pares em 8 cartas.','Encontre 6 pares em 12 cartas.'],
    'olho-lince':['Encontre o modelo entre 6 figuras.','Encontre o modelo entre 9 figuras.','Encontre o modelo entre 12 figuras.'],
    'conta-brinca':['Conte de 2 a 4 figuras iguais dentro do quadro.','Conte de 2 a 6 figuras iguais ao modelo, entre outras figuras.','Conte de 2 a 9 figuras iguais ao modelo, entre outras figuras.'],
    'sequencia-magica':['Observe 2 figuras e depois repita as 2, na mesma ordem.','Observe 3 figuras e depois repita as 3, na mesma ordem.','Observe 5 figuras e depois repita as 5, na mesma ordem.'],
    'cada-coisa':['Escolha o grupo correto entre 3 opções com exemplos.','Escolha o grupo correto entre 4 opções com exemplos.','Escolha o grupo correto entre 5 opções com exemplos.'],
  };
  $('difficulty-help').textContent=descriptions[game.id][index];
}
$('level').onchange=updateDifficulty;updateDifficulty();
document.addEventListener('visibilitychange',()=>{if(document.hidden)finish(true,'hidden');});
window.addEventListener('pagehide',cancelTimer);
document.addEventListener('keydown',event=>{
  if(state!=='answer'||event.altKey||event.ctrlKey||event.metaKey||event.target.closest('input,select,textarea,dialog'))return;
  if(/^[1-9]$/.test(event.key)) {
    const choice=$('board').children[Number(event.key)-1];if(choice&&!choice.disabled){event.preventDefault();choice.click();}
  }
});
