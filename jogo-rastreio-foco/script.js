(() => {
  const $=id=>document.getElementById(id), size=46;
  let items=[],target=0,phase='idle',frame,round=0,correct=0,count=10,started,previous,trackingMs,freezeAt,run=0;
  const paint=()=>items.forEach(p=>p.el.style.transform=`translate(${p.x}px,${p.y}px)`);
  const position=(width,height)=>{
    const maxX=width-size,maxY=height-size,gap=size+8;
    for(let attempt=0;attempt<180;attempt++) {
      const point={x:6+Math.random()*Math.max(0,maxX-12),y:6+Math.random()*Math.max(0,maxY-12)};
      if(items.every(p=>Math.abs(p.x-point.x)>=gap||Math.abs(p.y-point.y)>=gap))return point;
    }
    const cell=size+8,cols=Math.max(1,Math.floor(width/cell)),i=items.length;
    return {x:6+(i%cols)*Math.max(1,(maxX-12)/Math.max(1,cols-1)),y:6+Math.floor(i/cols)*cell};
  };
  const wander=p=>{
    const speed=75+Math.random()*60;
    const angle=Math.atan2(p.vy,p.vx)+(Math.random()-.5)*Math.PI*1.7;
    p.vx=Math.cos(angle)*speed;p.vy=Math.sin(angle)*speed;p.turnIn=170+Math.random()*330;
  };
  function next() {
    if(round>=10){finish();return;}
    round++;phase='tracking';$('next').hidden=true;$('feedback').textContent='';$('instruction').textContent='Acompanhe o quadrado dourado.';
    $('progress').textContent=`Rodada ${round} de 10`;$('score').textContent=`${correct} pontos`;
    $('arena').replaceChildren();items=[];
    const width=$('arena').clientWidth,height=$('arena').clientHeight;
    target=Math.floor(Math.random()*count);
    const headingOffset=Math.random()*Math.PI*2;
    for(let i=0;i<count;i++) {
      const el=document.createElement('button');el.type='button';el.className='tracking-square';el.disabled=true;el.setAttribute('aria-label',`Quadrado ${i+1}`);if(i===target)el.classList.add('is-target');el.onclick=()=>answer(i);$('arena').append(el);
      const point=position(width,height);
      // Spread headings around the full circle, with jitter, so motion is mixed from the first frame.
      const angle=headingOffset+(i+Math.random())*Math.PI*2/count,speed=75+Math.random()*55;
      items.push({el,...point,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,turnIn:140+Math.random()*340});
    }
    started=previous=performance.now();trackingMs=5500+Math.random()*2500;paint();frame=requestAnimationFrame(tick);
  }
  function tick(now) {
    if(phase!=='tracking')return;
    const dt=Math.min((now-previous)/1000,.04);previous=now;
    const maxX=$('arena').clientWidth-size,maxY=$('arena').clientHeight-size;
    for(const p of items) {
      p.turnIn-=dt*1000;if(p.turnIn<=0)wander(p);
      p.x+=p.vx*dt;p.y+=p.vy*dt;
      if(p.x<0||p.x>maxX){p.x=Math.max(0,Math.min(maxX,p.x));p.vx*=-1;}
      if(p.y<0||p.y>maxY){p.y=Math.max(0,Math.min(maxY,p.y));p.vy*=-1;}
    }
    // Resolve collisions so no square can completely hide another.
    for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++) {
      const a=items[i],b=items[j],dx=b.x-a.x,dy=b.y-a.y,overX=size+3-Math.abs(dx),overY=size+3-Math.abs(dy);
      if(overX>0&&overY>0) {
        if(overX<overY){const s=Math.sign(dx)||1;a.x-=s*overX/2;b.x+=s*overX/2;a.vx=-s*Math.abs(a.vx);b.vx=s*Math.abs(b.vx);}
        else{const s=Math.sign(dy)||1;a.y-=s*overY/2;b.y+=s*overY/2;a.vy=-s*Math.abs(a.vy);b.vy=s*Math.abs(b.vy);}
      }
    }
    for(const p of items){p.x=Math.max(0,Math.min(maxX,p.x));p.y=Math.max(0,Math.min(maxY,p.y));}
    paint();
    if(now-started>=trackingMs) {
      phase='answer';freezeAt=performance.now();ReabilityClinic.mark();
      items.forEach(p=>{p.el.classList.remove('is-target');p.el.disabled=false;});
      $('instruction').textContent='Onde estava o quadrado dourado?';$('feedback').textContent='Escolha um dos quadrados.';
      return;
    }
    frame=requestAnimationFrame(tick);
  }
  function answer(chosen) {
    if(phase!=='answer')return;phase='feedback';const ok=chosen===target;if(ok)correct++;
    items.forEach(p=>p.el.disabled=true);items[target].el.classList.add('is-target','is-answer');
    ReabilityClinic.round({correct:ok,chosen:chosen+1,target:target+1,count,trackingMs:Math.round(freezeAt-started),responseMs:Math.round(performance.now()-freezeAt)});
    $('feedback').textContent=ok?'Acertou! Você acompanhou o alvo.':'O alvo foi destacado. Vamos tentar novamente.';$('score').textContent=`${correct} pontos`;
    $('next').textContent=round===10?'Ver resultado':'Próxima rodada';$('next').hidden=false;$('next').focus();
  }
  function finish(interrupted=false) {
    if(phase==='idle'||phase==='done')return;cancelAnimationFrame(frame);run++;
    const answered=phase==='feedback'?round:round-1;phase='done';
    ReabilityClinic.finish({score:correct,correct,errors:answered-correct},interrupted?'interrupted':'completed');
    $('play').hidden=true;$('result').hidden=false;$('summary').textContent=`${correct} acertos em ${answered} rodadas respondidas.${interrupted?' Partida encerrada antes do fim.':''}`;
  }
  async function start(e) {
    e?.preventDefault();const token=++run;await ReabilityClinic.ready;if(token!==run)return;
    cancelAnimationFrame(frame);count=Number($('count').value);round=correct=0;
    ReabilityClinic.start('rastreio-foco',String(count));$('setup').hidden=true;$('result').hidden=true;$('play').hidden=false;next();
  }
  $('start-form').onsubmit=start;$('next').onclick=next;$('stop').onclick=()=>finish(true);$('again').onclick=()=>{$('result').hidden=true;$('setup').hidden=false;};
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&['tracking','answer','feedback'].includes(phase))finish(true);});
})();
