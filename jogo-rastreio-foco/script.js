(() => {
  const $=id=>document.getElementById(id), size=46;
  let items=[],target=0,phase='idle',frame,round=0,correct=0,count=10,started,previous,trackingMs,freezeAt,run=0,chaosIn=0;
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
  const limits=()=>count===10?{min:105,max:185,crowd:4}:count===15?{min:125,max:215,crowd:5}:{min:145,max:245,crowd:7};
  const redirect=(p,angle=Math.random()*Math.PI*2,boost=1)=>{
    const {min,max}=limits(),speed=(min+Math.random()*(max-min))*boost;
    p.vx=Math.cos(angle)*speed;p.vy=Math.sin(angle)*speed;
    p.spin=(Math.random()-.5)*(2.2+count/18);
    p.turnIn=90+Math.random()*260;
  };
  const crowdBurst=(width,height)=>{
    const {crowd}=limits();
    const anchor=Math.random()<.62?items[Math.floor(Math.random()*items.length)]:{x:Math.random()*(width-size),y:Math.random()*(height-size)};
    const shuffled=[...items].sort(()=>Math.random()-.5).slice(0,crowd);
    shuffled.forEach((p,index)=>{
      const angle=Math.atan2(anchor.y-p.y,anchor.x-p.x)+(Math.random()-.5)*.42;
      redirect(p,angle,1.05+Math.random()*.28);
      p.el.style.zIndex=String(2+index);
    });
    const escape=items[Math.floor(Math.random()*items.length)];
    redirect(escape,Math.random()*Math.PI*2,1.25);
    chaosIn=320+Math.random()*650;
  };
  function next() {
    if(round>=10){finish();return;}
    round++;phase='tracking';$('next').hidden=true;$('feedback').textContent='';$('instruction').textContent='Acompanhe o quadrado dourado.';
    $('progress').textContent=`Rodada ${round} de 10`;$('score').textContent=`${correct} pontos`;
    $('arena').replaceChildren();items=[];
    const width=$('arena').clientWidth,height=$('arena').clientHeight;
    target=Math.floor(Math.random()*count);
    for(let i=0;i<count;i++) {
      const el=document.createElement('button');el.type='button';el.className='tracking-square';el.disabled=true;el.setAttribute('aria-label',`Quadrado ${i+1}`);if(i===target)el.classList.add('is-target');el.onclick=()=>answer(i);$('arena').append(el);
      const point=position(width,height);
      const p={el,...point,vx:0,vy:0,spin:0,turnIn:0,hitUntil:0};
      redirect(p);
      items.push(p);
    }
    chaosIn=180+Math.random()*260;started=previous=performance.now();trackingMs=6200+Math.random()*2200;paint();frame=requestAnimationFrame(tick);
  }
  function tick(now) {
    if(phase!=='tracking')return;
    const dt=Math.min((now-previous)/1000,.04);previous=now;
    const maxX=$('arena').clientWidth-size,maxY=$('arena').clientHeight-size;
    chaosIn-=dt*1000;if(chaosIn<=0)crowdBurst(maxX+size,maxY+size);
    for(const p of items) {
      p.turnIn-=dt*1000;if(p.turnIn<=0)redirect(p);
      const turn=p.spin*dt,cos=Math.cos(turn),sin=Math.sin(turn),vx=p.vx*cos-p.vy*sin;
      p.vy=p.vx*sin+p.vy*cos;p.vx=vx;
      p.x+=p.vx*dt;p.y+=p.vy*dt;
      if(p.x<0||p.x>maxX){p.x=Math.max(0,Math.min(maxX,p.x));redirect(p,Math.atan2(p.vy,-p.vx)+(Math.random()-.5)*.85,1.08);}
      if(p.y<0||p.y>maxY){p.y=Math.max(0,Math.min(maxY,p.y));redirect(p,Math.atan2(-p.vy,p.vx)+(Math.random()-.5)*.85,1.08);}
    }
    // Some encounters bounce and others cross, so the group can obstruct and overtake the target.
    for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++) {
      const a=items[i],b=items[j],dx=b.x-a.x,dy=b.y-a.y,distance=Math.hypot(dx,dy);
      if(distance<size*.78&&now>a.hitUntil&&now>b.hitUntil) {
        a.hitUntil=b.hitUntil=now+170;
        if(Math.random()<.62) {
          const angle=Math.atan2(dy,dx),jolt=.55+Math.random()*.5;
          redirect(a,angle+Math.PI+(Math.random()-.5)*1.25,jolt);
          redirect(b,angle+(Math.random()-.5)*1.25,jolt);
        } else {
          a.spin*=-1.7;b.spin*=-1.7;
          a.el.style.zIndex=String(2+Math.floor(Math.random()*8));
          b.el.style.zIndex=String(2+Math.floor(Math.random()*8));
        }
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
