(() => {
  const $=id=>document.getElementById(id), size=46;
  let items=[],target=0,phase='idle',frame,round=0,correct=0,count=10,roundLimit=10,started,previous,trackingMs,freezeAt,run=0;
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
  const limits=()=>count===10?{min:200,max:335}:count===15?{min:235,max:385}:{min:270,max:440};
  const redirect=(p,angle=Math.random()*Math.PI*2)=>{
    const {min,max}=limits(),speed=min+Math.random()*(max-min);
    p.vx=Math.cos(angle)*speed;p.vy=Math.sin(angle)*speed;
  };
  const rotate=(p,angle)=>{
    const cos=Math.cos(angle),sin=Math.sin(angle),vx=p.vx*cos-p.vy*sin;
    p.vy=p.vx*sin+p.vy*cos;p.vx=vx;
  };
  const bounceWall=(p,axis,side)=>{
    if(axis==='x')p.vx=side*Math.abs(p.vx);else p.vy=side*Math.abs(p.vy);
    rotate(p,(Math.random()-.5)*.36);
    // The small random deflection must never point the piece back into the wall.
    if(axis==='x')p.vx=side*Math.abs(p.vx);else p.vy=side*Math.abs(p.vy);
  };
  const protectTarget=(maxX,maxY)=>{
    const tracked=items[target],exposure=12;
    // Leave at least a visible strip of the tracked piece; partial overlaps remain allowed.
    const clear=(x,y)=>items.every(p=>p===tracked||Math.abs(p.x-x)>=exposure||Math.abs(p.y-y)>=exposure);
    if(clear(tracked.x,tracked.y))return;
    const xs=[tracked.x,0,maxX],ys=[tracked.y,0,maxY];
    for(let x=0;x<=maxX;x+=exposure)xs.push(x);
    for(let y=0;y<=maxY;y+=exposure)ys.push(y);
    let best=null;
    for(const x of xs)for(const y of ys)if(clear(x,y)) {
      const distance=(x-tracked.x)**2+(y-tracked.y)**2;
      if(!best||distance<best.distance)best={x,y,distance};
    }
    if(best){tracked.x=best.x;tracked.y=best.y;}
  };
  function next() {
    if(round>=roundLimit){finish();return;}
    round++;phase='tracking';$('next').hidden=true;$('feedback').textContent='';$('instruction').textContent='Acompanhe o quadrado dourado.';
    $('progress').textContent=`Rodada ${round} de ${roundLimit}`;$('score').textContent=`${correct} pontos`;
    $('arena').replaceChildren();items=[];
    const width=$('arena').clientWidth,height=$('arena').clientHeight;
    target=Math.floor(Math.random()*count);
    for(let i=0;i<count;i++) {
      const el=document.createElement('button');el.type='button';el.className='tracking-square';el.disabled=true;el.setAttribute('aria-label',`Quadrado ${i+1}`);el.style.zIndex=i===target?'1':String(2+Math.floor(Math.random()*4));if(i===target)el.classList.add('is-target');el.onclick=()=>answer(i);$('arena').append(el);
      const point=position(width,height);
      const p={el,...point,vx:0,vy:0,hitUntil:0};
      redirect(p);
      items.push(p);
    }
    started=previous=performance.now();trackingMs=7000+Math.random()*2000;paint();frame=requestAnimationFrame(tick);
  }
  function tick(now) {
    if(phase!=='tracking')return;
    const dt=Math.min((now-previous)/1000,.04);previous=now;
    const maxX=$('arena').clientWidth-size,maxY=$('arena').clientHeight-size;
    for(const p of items) {
      p.x+=p.vx*dt;p.y+=p.vy*dt;
      if(p.x<0){p.x=0;bounceWall(p,'x',1);}
      else if(p.x>maxX){p.x=maxX;bounceWall(p,'x',-1);}
      if(p.y<0){p.y=0;bounceWall(p,'y',1);}
      else if(p.y>maxY){p.y=maxY;bounceWall(p,'y',-1);}
    }
    // Pieces keep a straight course and only receive a new, slightly random course on impact.
    for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++) {
      const a=items[i],b=items[j],dx=b.x-a.x,dy=b.y-a.y;
      const overlapX=size-Math.abs(dx),overlapY=size-Math.abs(dy);
      if(overlapX>0&&overlapY>0&&now>a.hitUntil&&now>b.hitUntil) {
        const horizontal=overlapX<overlapY;
        const side=horizontal?(dx>=0?1:-1):(dy>=0?1:-1);
        a.hitUntil=b.hitUntil=now+90;
        if(horizontal) {
          const shift=overlapX/2+.2;
          a.x-=side*shift;b.x+=side*shift;
          [a.vx,b.vx]=[b.vx,a.vx];
          if(a.vx*side>0)a.vx*=-1;if(b.vx*side<0)b.vx*=-1;
        } else {
          const shift=overlapY/2+.2;
          a.y-=side*shift;b.y+=side*shift;
          [a.vy,b.vy]=[b.vy,a.vy];
          if(a.vy*side>0)a.vy*=-1;if(b.vy*side<0)b.vy*=-1;
        }
        rotate(a,(Math.random()-.5)*.28);rotate(b,(Math.random()-.5)*.28);
        if(horizontal){a.vx=-side*Math.abs(a.vx);b.vx=side*Math.abs(b.vx);}
        else{a.vy=-side*Math.abs(a.vy);b.vy=side*Math.abs(b.vy);}
        a.el.style.zIndex=String(2+Math.floor(Math.random()*8));
        b.el.style.zIndex=String(2+Math.floor(Math.random()*8));
      }
    }
    for(const p of items){p.x=Math.max(0,Math.min(maxX,p.x));p.y=Math.max(0,Math.min(maxY,p.y));}
    paint();
    if(now-started>=trackingMs) {
      protectTarget(maxX,maxY);paint();
      phase='answer';freezeAt=performance.now();ReabilityClinic.mark();
      items.forEach(p=>{p.el.classList.remove('is-target');p.el.disabled=false;});
      $('instruction').textContent='Onde estava o quadrado dourado?';$('feedback').textContent='Escolha um dos quadrados.';
      return;
    }
    frame=requestAnimationFrame(tick);
  }
  function answer(chosen) {
    if(phase!=='answer')return;phase='feedback';const ok=chosen===target;if(ok)correct++;
    items.forEach(p=>p.el.disabled=true);items[target].el.style.zIndex='30';items[target].el.classList.add('is-target','is-answer');
    ReabilityClinic.round({correct:ok,chosen:chosen+1,target:target+1,count,totalRounds:roundLimit,trackingMs:Math.round(freezeAt-started),responseMs:Math.round(performance.now()-freezeAt)});
    $('feedback').textContent=ok?'Acertou! Você acompanhou o alvo.':'O alvo foi destacado. Vamos tentar novamente.';$('score').textContent=`${correct} pontos`;
    $('next').textContent=round===roundLimit?'Ver resultado':'Próxima rodada';$('next').hidden=false;$('next').focus();
  }
  function finish(interrupted=false) {
    if(phase==='idle'||phase==='done')return;cancelAnimationFrame(frame);run++;
    const answered=phase==='feedback'?round:round-1;phase='done';
    ReabilityClinic.finish({score:correct,correct,errors:answered-correct,totalRounds:roundLimit},interrupted?'interrupted':'completed');
    $('play').hidden=true;$('result').hidden=false;$('summary').textContent=`${correct} acertos em ${answered} rodadas respondidas.${interrupted?' Partida encerrada antes do fim.':''}`;
  }
  async function start(e) {
    e?.preventDefault();const token=++run;await ReabilityClinic.ready;if(token!==run)return;
    await ReabilityClinic.confirmReady();if(token!==run)return;
    cancelAnimationFrame(frame);count=Number($('count').value);roundLimit=Math.max(1,Math.min(30,Math.round(Number($('rounds').value)||10)));$('rounds').value=String(roundLimit);round=correct=0;
    ReabilityClinic.start('rastreio-foco',String(count));$('setup').hidden=true;$('result').hidden=true;$('play').hidden=false;next();
  }
  $('start-form').onsubmit=start;$('next').onclick=next;$('stop').onclick=()=>finish(true);$('again').onclick=()=>{$('result').hidden=true;$('setup').hidden=false;};
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&['tracking','answer','feedback'].includes(phase))finish(true);});
})();
