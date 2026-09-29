(() => {
  const $=id=>document.getElementById(id);
  let mode, phase='idle', round=0, correct=0, errors=0, omissions=0, rule, lastRule, color, shape, shownAt, run=0;
  const timers=new Set();
  const later=(fn,ms)=>{const timer=setTimeout(()=>{timers.delete(timer);fn();},ms);timers.add(timer);};
  const clear=()=>{timers.forEach(clearTimeout);timers.clear();};
  const buttons=enabled=>{$('left').disabled=!enabled;$('right').disabled=!enabled;};
  const setResponse=(id,label,direction)=>{
    const button=$(id);
    if(typeof button.querySelector==='function')button.querySelector('.response-copy strong').textContent=label;
    else button.textContent=`${direction==='esquerda'?'← ':''}${label}${direction==='direita'?' →':''}`;
    button.setAttribute('aria-label',`${label}. Seta ${direction}.`);
  };
  function next() {
    if(round>=12) {finish();return;}
    phase='waiting';buttons(false);round++;
    lastRule=rule;
    rule=mode==='hard'?(Math.floor((round-1)/3)%2===1?'shape':'color'):mode==='shapes'?'shape':'color';
    const ruleText=rule==='color'?'Responda pela cor':'Responda pela forma';
    if(typeof $('rule').querySelector==='function')$('rule-label').textContent=ruleText;
    else $('rule').textContent=ruleText.toUpperCase();
    $('rule').classList.toggle('is-switch',!!lastRule&&lastRule!==rule);
    setResponse('left',rule==='color'?'Azul':'Círculo','esquerda');setResponse('right',rule==='color'?'Verde':'Triângulo','direita');
    $('progress').textContent=`${round} de 12`;$('score').textContent=correct===1?'1 ponto':`${correct} pontos`;
    $('feedback').textContent=lastRule&&lastRule!==rule?'A regra mudou. Observe a legenda.':'Aguarde o próximo símbolo.';
    $('symbol').hidden=true;$('wait').hidden=false;$('wait').textContent='Prepare-se';
    later(()=>{
      phase='answer';color=mode==='shapes'?'blue':Math.random()<.5?'blue':'green';shape=mode==='colors'?'circle':Math.random()<.5?'circle':'triangle';
      $('symbol').dataset.color=color;$('symbol').dataset.shape=shape;$('symbol').hidden=false;$('wait').hidden=true;
      $('symbol').setAttribute('role','img');$('symbol').setAttribute('aria-label',`${shape==='circle'?'Círculo':'Triângulo'} ${color==='blue'?'azul':'verde'}`);
      $('feedback').textContent='Qual é a resposta?';shownAt=performance.now();ReabilityClinic.mark();buttons(true);
      later(()=>{$('symbol').hidden=true;},700);
      later(()=>answer(null),4000);
    },1500+Math.random()*700);
  }
  function answer(side) {
    if(phase!=='answer')return;
    phase='feedback';clear();buttons(false);$('symbol').hidden=true;
    const expected=rule==='color'?(color==='blue'?'left':'right'):(shape==='circle'?'left':'right');
    const ok=side===expected;
    if(side===null)omissions++;else if(ok)correct++;else errors++;
    ReabilityClinic.round({correct:ok,outcome:side===null?'omission':ok?'correct':'error',response:side,expected,rule,color,shape,switched:!!lastRule&&lastRule!==rule,responseMs:side===null?null:Math.round(performance.now()-shownAt)});
    $('feedback').textContent=side===null?'Tempo para responder encerrado.':ok?'Acertou! +1 ponto.':`A resposta era o botão ${expected==='left'?'esquerdo':'direito'}.`;
    $('score').textContent=correct===1?'1 ponto':`${correct} pontos`;later(next,1200);
  }
  function finish(interrupted=false) {
    if(phase==='idle'||phase==='done')return;
    run++;clear();phase='done';buttons(false);
    ReabilityClinic.finish({score:correct,correct,errors,omissions},interrupted?'interrupted':'completed');
    $('play').hidden=true;$('result').hidden=false;
    $('result-title').textContent=interrupted?'Partida encerrada':'Partida concluída';
    $('summary').textContent=`${correct} acertos · ${errors} erros · ${omissions} sem resposta. ${correct+errors+omissions} de 12 rodadas respondidas ou encerradas por tempo.`;
  }
  async function start(value) {
    const token=++run;await ReabilityClinic.ready;if(token!==run)return;
    await ReabilityClinic.confirmReady();if(token!==run)return;
    clear();mode=value;round=correct=errors=omissions=0;rule=lastRule=null;
    ReabilityClinic.start('atencao-cores',mode);
    const labels={colors:'Cores',shapes:'Formas',hard:'Difícil'};
    $('setup').hidden=true;$('result').hidden=true;$('play').hidden=false;$('mode-label').textContent=labels[mode];next();
  }
  document.querySelectorAll('[data-mode]').forEach(button=>button.onclick=()=>start(button.dataset.mode));
  $('left').onclick=()=>answer('left');$('right').onclick=()=>answer('right');$('stop').onclick=()=>finish(true);$('again').onclick=()=>start(mode);
  $('change').onclick=()=>{$('result').hidden=true;$('setup').hidden=false;};
  document.addEventListener('keydown',e=>{if(e.repeat||e.target.closest('dialog')||phase!=='answer')return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();answer(e.key==='ArrowLeft'?'left':'right');}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&['answer','waiting','feedback'].includes(phase))finish(true);});
})();
