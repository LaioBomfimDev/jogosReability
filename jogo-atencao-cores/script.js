(() => {
  const $ = id => document.getElementById(id);
  const labels = { colors:'Cores', shapes:'Formas', hard:'Difícil' };
  let mode='colors',phase='idle',round=0,correct=0,errors=0,omissions=0,rule,lastRule,color,shape,shownAt,run=0;
  let roundLimit=12,stimulusMs=700,responseLimit=4000,soundEnabled=true,audioContext,clockFrame=0;
  const responseTimes=[];
  const timers=new Set();
  const later=(fn,ms)=>{const timer=setTimeout(()=>{timers.delete(timer);fn();},ms);timers.add(timer);return timer;};
  const stopClock=()=>{if(clockFrame){cancelAnimationFrame(clockFrame);clockFrame=0;}};
  const clear=()=>{timers.forEach(clearTimeout);timers.clear();stopClock();};
  const buttons=enabled=>{$('left').disabled=!enabled;$('right').disabled=!enabled;};
  const clamp=(value,min,max,fallback)=>Math.max(min,Math.min(max,Math.round(Number(value)||fallback)));
  const stageState=value=>{
    const stage=$('stage');
    ['is-waiting','is-answer','is-correct','is-error','is-omission','is-switch'].forEach(name=>stage.classList.remove(name));
    if(value)stage.classList.add(value);
  };
  const setResponse=(id,label,direction)=>{
    const button=$(id);
    if(typeof button.querySelector==='function')button.querySelector('.response-copy strong').textContent=label;
    else button.textContent=`${direction==='esquerda'?'← ':''}${label}${direction==='direita'?' →':''}`;
    button.setAttribute('aria-label',`${label}. Seta ${direction}.`);
  };
  const ensureAudio=async()=>{
    if(!soundEnabled)return;
    const AudioContextClass=globalThis.AudioContext||globalThis.webkitAudioContext;
    if(!AudioContextClass)return;
    try{audioContext??=new AudioContextClass();if(audioContext.state==='suspended')await audioContext.resume();}catch{}
  };
  const tone=(frequency,duration=.12,type='sine',volume=.055,delay=0)=>{
    if(!soundEnabled||!audioContext||audioContext.state!=='running')return;
    const start=audioContext.currentTime+delay,oscillator=audioContext.createOscillator(),gain=audioContext.createGain();
    oscillator.type=type;oscillator.frequency.setValueAtTime(frequency,start);gain.gain.setValueAtTime(.001,start);gain.gain.exponentialRampToValueAtTime(volume,start+.012);gain.gain.exponentialRampToValueAtTime(.001,start+duration);
    oscillator.connect(gain);gain.connect(audioContext.destination);oscillator.start(start);oscillator.stop(start+duration+.025);
  };
  const playSound=name=>{
    if(name==='stimulus')tone(620,.08,'sine',.04);
    if(name==='switch'){tone(440,.1,'triangle',.045);tone(660,.13,'triangle',.04,.08);}
    if(name==='correct'){tone(523,.12,'sine',.055);tone(784,.18,'sine',.045,.07);}
    if(name==='error')tone(155,.22,'triangle',.045);
    if(name==='omission'){tone(220,.1,'sine',.035);tone(180,.16,'sine',.03,.11);}
    if(name==='finish'){tone(392,.12,'sine',.04);tone(523,.14,'sine',.045,.09);tone(659,.2,'sine',.045,.18);}
  };
  const setSound=value=>{
    soundEnabled=!!value;
    $('sound-enabled').checked=soundEnabled;
    $('sound-button').setAttribute('aria-pressed',String(soundEnabled));
    $('sound-button').setAttribute('aria-label',soundEnabled?'Desativar sons':'Ativar sons');
    const copy=typeof $('sound-button').querySelector==='function'&&$('sound-button').querySelector('b');if(copy)copy.textContent=soundEnabled?'Som ligado':'Som desligado';
    syncSummary();
  };
  const syncSummary=()=>{
    const rounds=clamp($('rounds').value,1,30,12),seconds=Number($('response-time').value||4000)/1000;
    $('setup-summary').textContent=`${labels[mode]} · ${rounds} ${rounds===1?'rodada':'rodadas'} · ${String(seconds).replace('.',',')} s por rodada · som ${soundEnabled?'ativado':'desativado'}.`;
  };
  const chooseMode=value=>{
    mode=value;
    document.querySelectorAll('[data-mode]').forEach(button=>{
      const selected=button.dataset.mode===mode;button.classList.toggle('is-selected',selected);button.setAttribute('aria-pressed',String(selected));
      const select=typeof button.querySelector==='function'&&button.querySelector('.attention-select');if(select)select.innerHTML=selected?'Selecionado <b aria-hidden="true">✓</b>':'Selecionar <b aria-hidden="true">→</b>';
    });
    document.querySelector?.('.attention-shell')?.setAttribute('data-mode',mode);syncSummary();
  };
  const readConfig=()=>{
    roundLimit=clamp($('rounds').value,1,30,12);$('rounds').value=String(roundLimit);
    stimulusMs=clamp($('stimulus-time').value,300,2000,700);responseLimit=clamp($('response-time').value,1000,15000,4000);
    return {mode,rounds:roundLimit,stimulusMs,responseMs:responseLimit,sound:soundEnabled};
  };
  const updateClock=now=>{
    if(phase!=='answer')return;
    const remaining=Math.max(0,responseLimit-(now-shownAt)),ratio=remaining/responseLimit;
    $('round-timer').textContent=`${(remaining/1000).toFixed(1).replace('.',',')} s`;
    $('timer-fill').style.transform=`scaleX(${ratio})`;
    $('timer-fill').parentElement?.classList.toggle('is-urgent',ratio<=.3);
    if(remaining>0)clockFrame=requestAnimationFrame(updateClock);
  };
  function next(){
    if(round>=roundLimit){finish();return;}
    phase='waiting';buttons(false);round++;lastRule=rule;
    rule=mode==='hard'?(Math.floor((round-1)/3)%2===1?'shape':'color'):mode==='shapes'?'shape':'color';
    const switched=!!lastRule&&lastRule!==rule,ruleText=rule==='color'?'Responda pela cor':'Responda pela forma';
    $('rule-label').textContent=ruleText;$('rule').classList.toggle('is-switch',switched);
    setResponse('left',rule==='color'?'Azul':'Círculo','esquerda');setResponse('right',rule==='color'?'Verde':'Triângulo','direita');
    $('progress').textContent=`${round} de ${roundLimit}`;$('score').textContent=correct===1?'1 ponto':`${correct} pontos`;$('round-timer').textContent='--';$('timer-fill').style.transform='scaleX(0)';
    $('feedback').textContent=switched?'A regra mudou. Observe a legenda.':'Aguarde o próximo símbolo.';
    $('symbol').hidden=true;$('wait').hidden=false;$('wait').textContent=switched?'Atenção: nova regra':'Prepare-se';$('result-mark').textContent='';stageState(switched?'is-switch':'is-waiting');
    if(switched)playSound('switch');
    later(()=>{
      phase='answer';color=mode==='shapes'?'blue':Math.random()<.5?'blue':'green';shape=mode==='colors'?'circle':Math.random()<.5?'circle':'triangle';
      $('symbol').dataset.color=color;$('symbol').dataset.shape=shape;$('symbol').hidden=false;$('wait').hidden=true;
      $('symbol').setAttribute('role','img');$('symbol').setAttribute('aria-label',`${shape==='circle'?'Círculo':'Triângulo'} ${color==='blue'?'azul':'verde'}`);
      $('feedback').textContent='Qual é a resposta?';shownAt=performance.now();ReabilityClinic.mark();buttons(true);stageState('is-answer');playSound('stimulus');clockFrame=requestAnimationFrame(updateClock);
      later(()=>{$('symbol').hidden=true;},stimulusMs);later(()=>answer(null),responseLimit);
    },1200+Math.random()*400);
  }
  function answer(side){
    if(phase!=='answer')return;
    phase='feedback';clear();buttons(false);$('symbol').hidden=true;$('round-timer').textContent='--';$('timer-fill').style.transform='scaleX(0)';
    const expected=rule==='color'?(color==='blue'?'left':'right'):(shape==='circle'?'left':'right'),ok=side===expected,responseMs=side===null?null:Math.round(performance.now()-shownAt);
    if(side===null)omissions++;else if(ok)correct++;else errors++;if(responseMs!==null)responseTimes.push(responseMs);
    ReabilityClinic.round({correct:ok,outcome:side===null?'omission':ok?'correct':'error',response:side,expected,rule,color,shape,switched:!!lastRule&&lastRule!==rule,responseMs});
    const state=side===null?'is-omission':ok?'is-correct':'is-error';stageState(state);$('result-mark').textContent=side===null?'…':ok?'✓':'×';playSound(side===null?'omission':ok?'correct':'error');
    $('feedback').textContent=side===null?'Tempo da rodada encerrado.':ok?'Acertou! +1 ponto.':`A resposta era o botão ${expected==='left'?'esquerdo':'direito'}.`;
    $('score').textContent=correct===1?'1 ponto':`${correct} pontos`;later(next,1100);
  }
  function finish(interrupted=false){
    if(phase==='idle'||phase==='done')return;
    run++;clear();phase='done';buttons(false);playSound('finish');
    const answered=correct+errors+omissions,accuracy=answered?Math.round(correct/answered*100):0,averageResponseMs=responseTimes.length?Math.round(responseTimes.reduce((sum,value)=>sum+value,0)/responseTimes.length):null;
    ReabilityClinic.finish({score:correct,correct,errors,omissions,accuracy,averageResponseMs,totalRounds:roundLimit},interrupted?'interrupted':'completed');
    $('play').hidden=true;$('result').hidden=false;$('result-title').textContent=interrupted?'Partida encerrada':'Partida concluída';
    $('summary').textContent=`${correct} acertos · ${errors} erros · ${omissions} sem resposta · ${accuracy}% de precisão${averageResponseMs===null?'':` · média de ${(averageResponseMs/1000).toFixed(1).replace('.',',')} s`}. ${answered} de ${roundLimit} rodadas concluídas.`;
  }
  async function start(){
    const token=++run;await ReabilityClinic.ready;if(token!==run)return;await ReabilityClinic.confirmReady();if(token!==run)return;
    clear();readConfig();await ensureAudio();await globalThis.ReabilityGameShell?.countdown?.();if(token!==run)return;round=correct=errors=omissions=0;responseTimes.length=0;rule=lastRule=null;
    ReabilityClinic.start('atencao-cores',mode,{rounds:roundLimit,stimulusMs,responseMs:responseLimit,sound:soundEnabled});
    $('setup').hidden=true;$('result').hidden=true;$('play').hidden=false;$('mode-label').textContent=labels[mode];document.querySelector?.('.attention-shell')?.setAttribute('data-mode',mode);next();
  }
  document.querySelectorAll('[data-mode]').forEach(button=>button.onclick=()=>chooseMode(button.dataset.mode));
  ['rounds','stimulus-time','response-time'].forEach(id=>{$(id).oninput=syncSummary;$(id).onchange=syncSummary;});
  $('sound-enabled').onchange=()=>setSound($('sound-enabled').checked);$('sound-button').onclick=async()=>{setSound(!soundEnabled);await ensureAudio();};
  $('start').onclick=start;$('left').onclick=()=>answer('left');$('right').onclick=()=>answer('right');$('stop').onclick=()=>finish(true);$('again').onclick=start;
  $('change').onclick=()=>{$('result').hidden=true;$('setup').hidden=false;syncSummary();};
  document.addEventListener('keydown',event=>{if(event.repeat||event.target.closest('dialog')||phase!=='answer')return;if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();answer(event.key==='ArrowLeft'?'left':'right');}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&['answer','waiting','feedback'].includes(phase))finish(true);});
  chooseMode('colors');setSound(true);
})();
