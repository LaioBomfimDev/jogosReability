import { ASSETS, games, categories, letterImage } from './content.js';
import { makeChallenge } from './engine.js';

const $ = id => document.getElementById(id);
const game = games.find(item=>item.id===document.body.dataset.alphabetGame);
const clinic = window.ReabilityClinic;
let state='setup', challenge, round=0, correct=0, errors=0, level='easy', roundLimit=5;
let selected=[], used=[], opened=[], matched=new Set(), timer, shownAt=0, startedAt=0, sequenceMs=1100;
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
const letterButton = (letter, handler, index) => {
  const el=button(`Letra ${letter}`,handler,'piece letter-piece'); el.dataset.option=String(index);
  const style=game.id==='jardim-letras'?{easy:'colored',medium:'regular',hard:'outline'}[level]:'colored';
  el.append(image(letterImage(letter,style),letter)); return el;
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
  $('undo').hidden=!['palavra-pecas','trilha-alfabeto','sequencia-magica'].includes(game.id);
  $('confirm').hidden=game.id!=='palavra-pecas'; $('confirm').disabled=true;
  $('next').hidden=true;
}
function record(ok, choice, expected, extra={}) {
  clinic.round({ correct:ok, choice, expected, item:challenge.object.id, responseMs:Math.max(0,Math.round(performance.now()-shownAt)), ...extra });
  if(ok)correct++;else errors++;
  $('score').textContent=`${correct} ${correct===1?'acerto':'acertos'}`;
}
function feedback(ok, message) {
  state='feedback'; cancelTimer();
  for(const el of $('board').querySelectorAll('button')) el.disabled=true;
  $('confirm').hidden=true; $('undo').hidden=true;
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
  feedback(ok,ok?'Muito bem! Você encontrou a resposta.':`Vamos aprender juntos: a resposta é ${expected}.`);
}
function promptObject(showName=false) {
  const card=document.createElement('div');card.className='reference-card';
  card.append(image(challenge.object.image,showName?challenge.object.name:'Figura do desafio'));
  if(showName)card.append(text('strong',challenge.object.name));
  $('prompt').append(card);
}
function renderSlots() {
  $('slots').replaceChildren();
  if(game.id==='palavra-pecas') {
    challenge.letters.forEach((letter,i)=>{
      const missingIndex=challenge.missing.indexOf(i), value=missingIndex<0?letter:selected[missingIndex];
      const slot=text('span','','letter-slot');
      if(missingIndex>=0)slot.classList.add('is-missing');
      if(value)slot.append(image(letterImage(value,missingIndex<0?'regular':'colored'),value));
      slot.setAttribute('aria-label',value?`Letra ${value}`:'Espaço para uma letra'); $('slots').append(slot);
    });
    $('confirm').disabled=selected.length!==challenge.answer.length;
  } else {
    const size=challenge.answer.length;
    for(let i=0;i<size;i++) {
      const slot=text('span','','sequence-slot'); const value=selected[i];
      if(value) {
        if(game.id==='trilha-alfabeto')slot.append(image(letterImage(value),value));
        else { const item=challenge.options.find(item=>item.id===value); slot.append(image(item.image,item.name)); }
      } else slot.append(text('span',String(i+1)));
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
  if(game.id!=='sequencia-magica')el.disabled=true;
  renderSlots();
  if(selected.length===max&&game.id!=='palavra-pecas')confirmSelection();
}
function confirmSelection() {
  if(state!=='answer'||selected.length!==challenge.answer.length)return;
  const ok=selected.every((item,i)=>item===challenge.answer[i]);
  record(ok,[...selected],challenge.answer);
  const expected=game.id==='palavra-pecas'?challenge.object.name:game.id==='trilha-alfabeto'?challenge.answer.join(' → '):challenge.sequence.map(item=>item.name).join(' → ');
  feedback(ok,ok?`Você conseguiu! ${game.id==='palavra-pecas'?challenge.object.name:'Sequência completa.'}`:`A sequência correta é: ${expected}.`);
  if(!ok) {
    const correction=document.createElement('div');correction.className='correction';
    challenge.answer.forEach(value=>{
      if(game.id==='sequencia-magica'){const item=challenge.options.find(item=>item.id===value);correction.append(image(item.image,item.name));}
      else correction.append(image(letterImage(value),value));
    });
    $('feedback').append(correction);
  }
}
function flip(index,el) {
  if(state!=='answer'||matched.has(index)||opened.includes(index)||opened.length>=2)return;
  const item=challenge.cards[index].object;
  el.replaceChildren(image(item.image,item.name));el.classList.add('is-open');el.setAttribute('aria-label',item.name);
  opened.push(index);
  if(opened.length!==2)return;
  const [a,b]=opened, ok=challenge.cards[a].object.id===challenge.cards[b].object.id;
  record(ok,challenge.cards[b].object.id,challenge.cards[a].object.id,{cardPositions:[a,b]});
  if(ok) {
    matched.add(a);matched.add(b);opened=[];
    for(const i of [a,b]) {const card=$('board').children[i];card.classList.add('is-matched');card.disabled=true;}
    sound(true);cat('happy');$('feedback').textContent='Um par encontrado!';
    if(matched.size===challenge.cards.length)feedback(true,'Todos os pares encontrados! Boa memória.');
    else shownAt=performance.now();
  } else {
    state='memory-wait';cat('thinking');$('feedback').textContent='Observe as figuras e memorize suas posições.';
    timer=setTimeout(()=>{
      for(const i of [a,b]) {
        const card=$('board').children[i];card.replaceChildren(image(`${ASSETS}/cat/idle.svg`,''));card.classList.remove('is-open');card.setAttribute('aria-label',`Carta ${i+1}, fechada`);
      }
      opened=[];state='answer';shownAt=performance.now();$('feedback').textContent='Escolha mais duas cartas.';
    },1300);
  }
}
function revealSequence() {
  let position=0;state='watch';$('undo').disabled=true;cat('thinking');
  $('board').hidden=true;
  const frame=()=>{
    if(state!=='watch')return;
    $('prompt').replaceChildren();
    if(position===challenge.sequence.length) {
      $('instruction').textContent='Sua vez! Repita as figuras na mesma ordem.';
      $('prompt').append(text('p','Qual figura veio primeiro?','your-turn'));
      $('board').hidden=false;state='answer';shownAt=performance.now();cat('pointing');
      $('board').querySelector('button')?.focus({preventScroll:true});return;
    }
    const item=challenge.sequence[position++];
    $('instruction').textContent=`Observe e memorize · ${position} de ${challenge.sequence.length}`;
    const card=document.createElement('div');card.className='reference-card sequence-flash';
    card.append(image(item.image,item.name));$('prompt').append(card);
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
  state='answer';selected=[];used=[];opened=[];matched=new Set();
  $('progress').textContent=`${game.id==='pares-gatinho'?'Tabuleiro':'Rodada'} ${round} de ${roundLimit}`;
  $('progress-bar').value=round-1;$('progress-bar').max=roundLimit;
  $('feedback').replaceChildren();$('feedback').dataset.kind='';
  $('board').replaceChildren();$('board').hidden=false;$('board').className=`play-board board-${game.id}`;
  $('prompt').replaceChildren();$('slots').replaceChildren();cat('idle');controls();
  switch(game.id) {
    case 'jardim-letras':
      $('instruction').textContent='Com qual letra essa palavra começa?';promptObject(true);
      challenge.options.forEach((letter,i)=>{const el=letterButton(letter,()=>answer(letter,el),i);$('board').append(el);});break;
    case 'palavra-pecas':
      $('instruction').textContent='Complete o nome da figura. Toque nas letras na ordem.';promptObject();renderSlots();
      $('prompt').append(text('p',`${challenge.letters.length} letras${level==='easy'?' · '+challenge.object.name:''}`,'word-hint'));
      challenge.bank.forEach((letter,i)=>{const el=letterButton(letter,()=>select(letter,i,el),i);$('board').append(el);});break;
    case 'trilha-alfabeto':
      $('instruction').textContent='Toque nas letras em ordem alfabética.';renderSlots();
      challenge.options.forEach((letter,i)=>{const el=letterButton(letter,()=>select(letter,i,el),i);$('board').append(el);});break;
    case 'pares-gatinho':
      $('instruction').textContent='Vire duas cartas e encontre as figuras iguais.';
      challenge.cards.forEach((_,i)=>{const el=button(`Carta ${i+1}, fechada`,()=>flip(i,el),'piece memory-card');el.append(image(`${ASSETS}/cat/idle.svg`,''));$('board').append(el);});break;
    case 'olho-lince':
      $('instruction').textContent='Encontre a figura igual ao modelo.';promptObject();
      challenge.options.forEach((item,i)=>{const el=objectButton(item,()=>answer(item.id,el),i);$('board').append(el);});break;
    case 'conta-brinca': {
      $('instruction').textContent=`Quantos itens iguais a ${challenge.object.name.toLocaleLowerCase('pt-BR')} você encontra?`;
      const target=document.createElement('div');target.className='count-target';target.append(text('span','Conte esta figura:'),image(challenge.object.image,challenge.object.name));$('prompt').append(target);
      const field=document.createElement('div');field.className='count-field';field.setAttribute('aria-label','Figuras para contar');
      challenge.items.forEach(item=>field.append(image(item.image,item.name)));$('prompt').append(field);
      challenge.options.forEach((value,i)=>{const el=button(`Quantidade ${value}`,()=>answer(value,el),'piece number-piece');el.dataset.option=String(i);el.textContent=String(value);$('board').append(el);});break;
    }
    case 'sequencia-magica':
      renderSlots();challenge.options.forEach((item,i)=>{const el=objectButton(item,()=>select(item.id,i,el),i);$('board').append(el);});revealSequence();break;
    case 'cada-coisa':
      $('instruction').textContent='A qual categoria esta figura pertence?';promptObject(true);
      challenge.options.forEach((value,i)=>{const el=button(categories[value],()=>answer(value,el),'piece category-piece');el.dataset.option=String(i);el.textContent=categories[value];$('board').append(el);});break;
  }
  shownAt=performance.now();clinic.mark();
  if(state==='answer') {
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
  $('summary').textContent=`${correct} ${correct===1?'acerto':'acertos'} em ${attempts} ${attempts===1?'tentativa':'tentativas'}. ${accuracy}% de precisão.`;
  const seconds=Math.max(0,Math.round((performance.now()-startedAt)/1000));
  $('result-detail').textContent=`Tempo de jogo: ${Math.floor(seconds/60)}min ${String(seconds%60).padStart(2,'0')}s. ${reason==='hidden'?'A partida foi encerrada porque a página ficou em segundo plano.':'Cada tentativa é uma oportunidade de aprender.'}`;
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
  if(game.id!=='sequencia-magica')$('board').children[index].disabled=false;
  renderSlots();
};
$('confirm').onclick=confirmSelection;
$('next').onclick=()=>{if(state==='feedback')void nextRound();};
$('stop').onclick=()=>finish(true);
$('again').onclick=()=>{state='setup';showScreen('setup');$('setup-error').textContent='';$('start').focus({preventScroll:true});};
document.addEventListener('visibilitychange',()=>{if(document.hidden)finish(true,'hidden');});
window.addEventListener('pagehide',cancelTimer);
document.addEventListener('keydown',event=>{
  if(state!=='answer'||event.altKey||event.ctrlKey||event.metaKey||event.target.closest('input,select,textarea,dialog'))return;
  if(/^[1-9]$/.test(event.key)) {
    const choice=$('board').children[Number(event.key)-1];if(choice&&!choice.disabled){event.preventDefault();choice.click();}
  }
});
