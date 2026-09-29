(() => {
  const names={'memoria-visual':'Memória Visual','logica-numerica':'Lógica Numérica','cerebro-feliz':'Atenção Plena','cubos-em-foco':'Cubos em Foco','matriz-em-movimento':'Matriz em Movimento','puzzle-rotacao':'Puzzle de Rotação','ritmo-em-foco':'Ritmo em Foco','jogo-de-palavras':'Termooo','atencao-cores':'Cores e Regras','rastreio-foco':'Siga o Foco'};
  const levels={easy:'Fácil',medium:'Médio',hard:'Difícil',simple:'Simples',leve:'Leve',ritmo:'Ritmo',intenso:'Intenso',unico:'Único',dueto:'Dueto',quarteto:'Quarteto'};
  const statuses={active:'Em aberto',completed:'Concluída',interrupted:'Interrompida',timeout:'Tempo esgotado'};
  const $=id=>document.getElementById(id); let rows=[];
  const date=value=>new Date(value).toLocaleString('pt-BR');
  const localDay=value=>{const d=new Date(value);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
  const selected=()=>rows.filter(r=>(!$('patient-filter').value||r.patient_id===$('patient-filter').value)&&(!$('game-filter').value||r.game===$('game-filter').value)&&(!$('from').value||localDay(r.started_at)>=$('from').value)&&(!$('to').value||localDay(r.started_at)<=$('to').value));
  const cell=(tr,value)=>{ const td=document.createElement('td');td.textContent=value;tr.append(td);return td; };
  const result=data=>data.outcome==='omission'?'Sem resposta':data.correct===true?'Acerto':data.correct===false?'Erro':'Movimento';
  const metricNames={score:'Pontos',correct:'Acertos',errors:'Erros',omissions:'Sem resposta',attempts:'Tentativas',matches:'Pares',moves:'Movimentos',won:'Concluiu o objetivo',correctAnswers:'Respostas corretas',solved:'Palavras resolvidas',perfect:'Pulsos perfeitos',good:'Pulsos bons',miss:'Pulsos perdidos',maxCombo:'Maior combo',correctSlots:'Peças corretas',durationMs:'Duração (ms)',rounds:'Rodadas',status:'Situação',responseMs:'Tempo de resposta (ms)',action:'Ação',outcome:'Resultado',response:'Resposta',expected:'Esperado',guess:'Palpite',rule:'Regra',color:'Cor',shape:'Forma',switched:'Houve troca de regra',trackingMs:'Tempo de acompanhamento (ms)',target:'Alvo',chosen:'Selecionado',count:'Quadrados',round:'Rodada',selected:'Selecionado',answer:'Resposta esperada',modifier:'Mecânica',newMatches:'Novas peças corretas',lostMatches:'Peças retiradas do lugar certo',lane:'Pista',timingErrorMs:'Desvio do pulso (ms)',elapsedMs:'Tempo de jogo (ms)',hits:'Pulsos',age:'Idade',game:'Jogo',level:'Nível'};
  const values={left:'Esquerda',right:'Direita',blue:'Azul',green:'Verde',circle:'Círculo',triangle:'Triângulo',color:'Cor',shape:'Forma',omission:'Sem resposta',error:'Erro',correct:'Acerto',move:'Movimento',early_or_late:'Fora da janela de resposta'};
  const readable=value=>typeof value==='boolean'?(value?'Sim':'Não'):value===null?'—':typeof value==='object'?JSON.stringify(value):(values[value]||String(value));
  const describe=data=>Object.entries(data).map(([k,v])=>`${k==='correct'&&typeof v==='boolean'?'Acertou':metricNames[k]||k}: ${k==='status'?(statuses[v]||v):readable(v)}`).join('\n');
  const duration=value=>{const seconds=Math.round(Number(value)/100)/10;if(!Number.isFinite(seconds))return readable(value);return seconds<60?`${seconds.toLocaleString('pt-BR')} s`:`${Math.floor(seconds/60)} min ${Math.round(seconds%60)} s`;};
  const summaryTone=key=>key==='correct'?'success':key==='errors'?'danger':key==='omissions'?'warning':key==='status'?'status':'';
  const resultTone=data=>data.outcome==='omission'?'warning':data.correct===true?'success':data.correct===false?'danger':'';
  const appendText=(parent,tag,text,className)=>{const element=document.createElement(tag);element.textContent=text;if(className)element.className=className;parent.append(element);return element;};
  async function details(id) {
    try {
      const m=await ReabilityClinic.api('/api/matches/'+id);
      const patient=document.createElement('span');appendText(patient,'strong',m.patient_name);patient.append(`, ${m.patient_age} anos`);
      const game=document.createElement('span');game.textContent=names[m.game]||m.game;
      const started=document.createElement('span');started.textContent=date(m.started_at);
      $('detail-title').replaceChildren(patient,game,started);
      const summary=document.createDocumentFragment();
      const priority=['score','correct','errors','omissions','durationMs','rounds','status'];
      const entries=Object.entries(m.summary||{}).sort(([a],[b])=>{const ai=priority.indexOf(a),bi=priority.indexOf(b);return (ai<0?priority.length:ai)-(bi<0?priority.length:bi);});
      for(const [key,value] of entries) {
        const metric=document.createElement('div');metric.className='detail-metric';metric.dataset.tone=summaryTone(key);
        appendText(metric,'span',metricNames[key]||key);
        appendText(metric,'strong',key==='durationMs'?duration(value):key==='status'?(statuses[value]||value):readable(value));
        summary.append(metric);
      }
      $('detail-summary').replaceChildren(summary);
      const rounds=m.events.filter(e=>e.kind==='round');
      $('detail-round-count').textContent=`${rounds.length} ${rounds.length===1?'rodada':'rodadas'}`;
      const roundList=document.createDocumentFragment();
      rounds.forEach((e,index)=>{
        const row=document.createElement('article');row.className='detail-round';row.dataset.result=resultTone(e.data);
        appendText(row,'div',String(e.data.round??index+1).padStart(2,'0'),'detail-round-number');
        appendText(row,'span',result(e.data),'detail-result');
        appendText(row,'div',e.data.responseMs==null?'Sem registro':`${Number(e.data.responseMs).toLocaleString('pt-BR')} ms`,'detail-round-time');
        const data=document.createElement('dl');data.className='detail-data';
        for(const [key,value] of Object.entries(e.data).filter(([key])=>!['round','correct','outcome','responseMs'].includes(key))) {
          const item=document.createElement('div');appendText(item,'dt',metricNames[key]||key);appendText(item,'dd',readable(value));data.append(item);
        }
        row.append(data);roundList.append(row);
      });
      if(!rounds.length) appendText(roundList,'p','Nenhuma rodada foi registrada nesta partida.','detail-empty');
      $('detail-rows').replaceChildren(roundList);
      $('details').scrollTop=0;
      if(!$('details').open) {
        $('details').showModal();
      }
    } catch(e) {$('history-error').textContent=e.message;}
  }
  function render() {
    const filtered=selected();$('history-body').replaceChildren();$('empty').hidden=filtered.length>0;
    const patients=new Set(filtered.map(r=>r.patient_id)).size;
    $('history-stats').textContent=`${filtered.length} ${filtered.length===1?'partida':'partidas'} · ${patients} ${patients===1?'paciente':'pacientes'} · ${filtered.reduce((sum,r)=>sum+r.rounds,0)} rodadas registradas`;
    for(const r of filtered) {
      const tr=document.createElement('tr');cell(tr,`${r.patient_name} · ${r.patient_age} anos`);cell(tr,date(r.started_at));cell(tr,`${names[r.game]||r.game} · ${levels[r.level]||r.level}`);cell(tr,r.rounds);cell(tr,statuses[r.status]);
      const button=document.createElement('button');button.textContent='Ver rodadas';button.onclick=()=>details(r.id);cell(tr,'').append(button);$('history-body').append(tr);
    }
  }
  async function load() {
    $('history-error').textContent='';
    try {
      await ReabilityClinic.ready; await ReabilityClinic.flush(); rows=await ReabilityClinic.api('/api/history');
      for(const [field,values] of [['patient-filter',new Map(rows.map(r=>[r.patient_id,`${r.patient_name} · ${r.patient_id.slice(0,8)}`]))],['game-filter',new Map(rows.map(r=>[r.game,names[r.game]||r.game]))]]) {
        const select=$(field), current=select.value;while(select.options.length>1)select.remove(1);
        for(const [value,label] of values) {const option=document.createElement('option');option.value=value;option.textContent=label;select.append(option);}select.value=current;
      }
      render();
    } catch(e) {$('history-error').textContent=e.message;$('history-stats').textContent='Não foi possível carregar os registros.';}
  }
  function download(table,name) {
    const quote=value=>'"'+String(value??'').replace(/^[=+@\-\t\r]/,"'$&").replaceAll('"','""')+'"';
    const blob=new Blob(['\ufeff'+table.map(row=>row.map(quote).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function exportData(rounds) {
    const button=$(rounds?'export-rounds':'export');button.disabled=true;$('history-error').textContent='';
    try {
      const filtered=selected();
      const table=[['Partida ID','Paciente ID','Paciente','Idade','Data ISO','Jogo','Nível',...(rounds?['Rodada','Resultado','Tempo (ms)','Dados']:['Situação','Rodadas','Resumo'])]];
      for(const r of filtered) {
        const base=[r.id,r.patient_id,r.patient_name,r.patient_age,r.started_at,names[r.game]||r.game,levels[r.level]||r.level];
        if(rounds) {const match=await ReabilityClinic.api('/api/matches/'+r.id);for(const e of match.events.filter(e=>e.kind==='round'))table.push([...base,e.data.round,result(e.data),e.data.responseMs,JSON.stringify(e.data)]);}
        else table.push([...base,statuses[r.status],r.rounds,JSON.stringify(r.summary)]);
      }
      download(table,`reability-${rounds?'rodadas':'partidas'}-${localDay(new Date())}.csv`);
    } catch(e) {$('history-error').textContent=e.message;} finally {button.disabled=false;}
  }
  ['patient-filter','game-filter','from','to'].forEach(id=>$(id).onchange=render);
  $('refresh').onclick=load;$('export').onclick=()=>exportData(false);$('export-rounds').onclick=()=>exportData(true);
  [$('close-details'),...document.querySelectorAll('.js-close-details')].forEach(button=>button.onclick=()=>$('details').close());
  $('details').onclick=event=>{if(event.target===$('details'))$('details').close();};
  load();
})();
