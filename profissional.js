(() => {
  const names={'memoria-visual':'Memória Visual','logica-numerica':'Lógica Numérica','cerebro-feliz':'Atenção Plena','cubos-em-foco':'Cubos em Foco','matriz-em-movimento':'Matriz em Movimento','puzzle-rotacao':'Puzzle de Rotação','ritmo-em-foco':'Ritmo em Foco','jogo-de-palavras':'Termooo','atencao-cores':'Cores e Regras','rastreio-foco':'Siga o Foco'};
  const levels={easy:'Fácil',medium:'Médio',hard:'Difícil',simple:'Simples',leve:'Leve',ritmo:'Ritmo',intenso:'Intenso',unico:'Único',dueto:'Dueto',quarteto:'Quarteto'};
  const statuses={active:'Em aberto',completed:'Concluída',interrupted:'Interrompida',timeout:'Tempo esgotado'};
  const $=id=>document.getElementById(id); let rows=[]; const selectedIds=new Set();
  const date=value=>new Date(value).toLocaleString('pt-BR');
  const time=value=>new Date(value).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
  const detailDateTime=value=>{
    const parsed=new Date(value);
    const day=new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'}).format(parsed);
    return `${day} · ${time(value)}`;
  };
  const localDay=value=>{const d=new Date(value);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
  const dayLabel=value=>{const text=new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'}).format(new Date(`${value}T12:00:00`));return text.charAt(0).toUpperCase()+text.slice(1);};
  const selected=()=>rows.filter(r=>(!$('patient-filter').value||r.patient_id===$('patient-filter').value)&&(!$('game-filter').value||r.game===$('game-filter').value)&&(!$('from').value||localDay(r.started_at)>=$('from').value)&&(!$('to').value||localDay(r.started_at)<=$('to').value));
  const cell=(tr,value,label)=>{ const td=document.createElement('td');td.textContent=value;if(label)td.dataset.label=label;tr.append(td);return td; };
  const summaryCell=(tr,label,primary,secondary,className='')=>{const td=cell(tr,'',label);if(className)td.className=className;appendText(td,'strong',primary,'history-primary');if(secondary)appendText(td,'span',secondary,'history-secondary');return td;};
  const result=data=>data.outcome==='omission'?'Sem resposta':data.correct===true?'Acerto':data.correct===false?'Erro':'Movimento';
  const appendText=(parent,tag,text,className)=>{const element=document.createElement(tag);element.textContent=text;if(className)element.className=className;parent.append(element);return element;};
  const detailIcons={
    patient:['M20 21a8 8 0 0 0-16 0','M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8'],
    age:['M4 14h16v7H4z','M4 18c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2','M8 14v-3h8v3','M9 8V6','M12 8V5','M15 8V6'],
    game:['M8.5 12h-3','M7 10.5v3','M15 11h.01','M18 13h.01','M6.5 7h11a4 4 0 0 1 3.8 5.2l-1.4 5a2.5 2.5 0 0 1-4.2 1.1L14 16h-4l-1.7 2.3a2.5 2.5 0 0 1-4.2-1.1l-1.4-5A4 4 0 0 1 6.5 7Z'],
    calendar:['M8 3v4','M16 3v4','M3 10h18','M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2','M12 14v3l2 1']
  };
  const detailIcon=name=>{
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');
    for(const d of detailIcons[name]) {const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',d);svg.append(path);}
    return svg;
  };
  const detailInfo=(label,value,icon)=>{
    const item=document.createElement('div');item.className='detail-meta-item';
    const iconBox=document.createElement('span');iconBox.className='detail-meta-icon';iconBox.append(detailIcon(icon));
    appendText(item,'span',label,'detail-meta-label');appendText(item,'strong',value,'detail-meta-value');item.prepend(iconBox);
    return item;
  };
  const performanceFrom=rounds=>{
    const attempts=rounds.length;
    const correct=rounds.filter(event=>event.data?.correct===true&&event.data?.outcome!=='omission').length;
    const omissions=rounds.filter(event=>event.data?.outcome==='omission').length;
    const errors=rounds.filter(event=>event.data?.correct===false&&event.data?.outcome!=='omission').length;
    return {attempts,correct,errors,omissions};
  };
  const performanceFeedback=performance=>{
    const evaluated=performance.correct+performance.errors+performance.omissions;
    if(!performance.attempts)return {tone:'status',title:'Sem dados para avaliar',text:'Nenhuma tentativa foi registrada nesta partida.'};
    if(!evaluated)return {tone:'status',title:'Sem classificação de desempenho',text:'Esta atividade registrou movimentos, mas não classificou as tentativas como acerto, erro ou sem resposta.'};
    const accuracy=performance.correct/evaluated, omissionRate=performance.omissions/evaluated;
    if(accuracy>=.7&&omissionRate<=.2)return {tone:'success',title:'Foi bem',text:'A maioria das tentativas terminou em acerto, com poucas respostas ausentes.'};
    if(accuracy<.4||omissionRate>=.5)return {tone:'danger',title:'Abaixo do esperado',text:performance.omissions>=performance.errors?'Houve muitas tentativas sem resposta. Vale observar se o tempo ou a dificuldade estavam adequados.':'Os erros foram mais frequentes que os acertos. Vale ajustar a dificuldade e acompanhar a próxima partida.'};
    return {tone:'warning',title:'Desempenho mediano',text:'O resultado ficou entre acertos e dificuldades. A próxima partida pode ajudar a confirmar esse padrão.'};
  };
  function updateSelection() {
    const visible=selected(), selectedVisible=visible.filter(r=>selectedIds.has(r.id)).length;
    $('select-all').disabled=!visible.length;
    $('select-all').checked=visible.length>0&&selectedVisible===visible.length;
    $('select-all').indeterminate=selectedVisible>0&&selectedVisible<visible.length;
    $('export-selected').disabled=selectedIds.size===0;
    $('delete-selected').disabled=selectedIds.size===0;
    $('export-selected').textContent=selectedIds.size?`Exportar CSV (${selectedIds.size})`:'Exportar CSV';
    $('delete-selected').textContent=selectedIds.size?`Apagar (${selectedIds.size})`:'Apagar';
    $('selection-status').textContent=selectedIds.size===0?'Nenhuma partida selecionada.':`${selectedIds.size} ${selectedIds.size===1?'partida selecionada':'partidas selecionadas'}.`;
    document.querySelectorAll('.history-day-check').forEach(checkbox=>{
      const matches=visible.filter(r=>localDay(r.started_at)===checkbox.dataset.day), count=matches.filter(r=>selectedIds.has(r.id)).length;
      checkbox.checked=matches.length>0&&count===matches.length;checkbox.indeterminate=count>0&&count<matches.length;
    });
  }
  async function details(id) {
    try {
      const m=await ReabilityClinic.api('/api/matches/'+id);
      $('detail-title').replaceChildren(
        detailInfo('Paciente',m.patient_name,'patient'),
        detailInfo('Idade',`${m.patient_age} anos`,'age'),
        detailInfo('Jogo',names[m.game]||m.game,'game'),
        detailInfo('Data e horário',detailDateTime(m.started_at),'calendar')
      );
      const rounds=m.events.filter(e=>e.kind==='round');
      const performance=performanceFrom(rounds), feedback=performanceFeedback(performance);
      const summary=document.createDocumentFragment();
      for(const [key,label,tone] of [['attempts','Tentativas',''],['correct','Acertos','success'],['errors','Erros','danger'],['omissions','Sem resposta','warning']]) {
        const metric=document.createElement('div');metric.className='detail-metric';metric.dataset.tone=tone;
        appendText(metric,'span',label);
        appendText(metric,'strong',performance[key]);
        summary.append(metric);
      }
      const feedbackBox=document.createElement('div');feedbackBox.className='detail-feedback';feedbackBox.dataset.tone=feedback.tone;
      appendText(feedbackBox,'span','Feedback');appendText(feedbackBox,'strong',feedback.title);appendText(feedbackBox,'p',feedback.text);summary.append(feedbackBox);
      $('detail-summary').replaceChildren(summary);
      $('details').scrollTop=0;
      if(!$('details').open) {
        $('details').showModal();
      }
    } catch(e) {$('history-error').textContent=e.message;}
  }
  function render() {
    const filtered=[...selected()].sort((a,b)=>new Date(b.started_at)-new Date(a.started_at));$('history-body').replaceChildren();$('empty').hidden=filtered.length>0;
    const patients=new Set(filtered.map(r=>r.patient_id)).size;
    $('history-stats').textContent=`${filtered.length} ${filtered.length===1?'partida':'partidas'} · ${patients} ${patients===1?'paciente':'pacientes'} · ${filtered.reduce((sum,r)=>sum+r.rounds,0)} rodadas registradas`;
    let currentDay='';
    for(const r of filtered) {
      const rowDay=localDay(r.started_at);
      if(rowDay!==currentDay) {
        currentDay=rowDay;
        const dayRows=filtered.filter(item=>localDay(item.started_at)===rowDay), group=document.createElement('tr');group.className='history-date-group';
        const groupCell=document.createElement('td');groupCell.colSpan=7;
        const label=document.createElement('label');
        const dayCheck=document.createElement('input');dayCheck.type='checkbox';dayCheck.className='history-day-check';dayCheck.dataset.day=rowDay;dayCheck.setAttribute('aria-label',`Selecionar todas as partidas de ${dayLabel(rowDay)}`);dayCheck.onchange=()=>{for(const item of dayRows)if(dayCheck.checked)selectedIds.add(item.id);else selectedIds.delete(item.id);render();};
        const title=document.createElement('strong');title.textContent=dayLabel(rowDay);const count=document.createElement('small');count.textContent=`${dayRows.length} ${dayRows.length===1?'partida':'partidas'}`;
        label.append(dayCheck,title,count);groupCell.append(label);group.append(groupCell);$('history-body').append(group);
      }
      const tr=document.createElement('tr');
      const checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=selectedIds.has(r.id);checkbox.setAttribute('aria-label',`Selecionar partida de ${r.patient_name} em ${date(r.started_at)}`);checkbox.onchange=()=>{if(checkbox.checked)selectedIds.add(r.id);else selectedIds.delete(r.id);updateSelection();};cell(tr,'').className='history-check';tr.firstChild.append(checkbox);
      summaryCell(tr,'Paciente',r.patient_name,`${r.patient_age} anos`,'history-patient');
      summaryCell(tr,'Horário',time(r.started_at),'','history-time');
      summaryCell(tr,'Jogo',names[r.game]||r.game,levels[r.level]||r.level,'history-game');
      summaryCell(tr,'Rodadas',r.rounds,'','history-rounds');
      const statusCell=cell(tr,'','Resultado');const status=document.createElement('strong');status.className='history-status';status.dataset.status=r.status;status.textContent=statuses[r.status]||r.status;statusCell.append(status);
      const actions=document.createElement('div');actions.className='history-row-actions';
      const view=document.createElement('button');view.type='button';view.textContent='Ver detalhes';view.setAttribute('aria-label',`Ver detalhes da partida de ${r.patient_name}`);view.onclick=()=>details(r.id);
      const exportButton=document.createElement('button');exportButton.type='button';exportButton.textContent='CSV';exportButton.setAttribute('aria-label',`Exportar CSV da partida de ${r.patient_name}`);exportButton.className='history-export';exportButton.onclick=()=>exportRounds([r],exportButton);
      actions.append(view,exportButton);cell(tr,'','Ações').append(actions);$('history-body').append(tr);
    }
    updateSelection();
  }
  async function load() {
    $('history-error').textContent='';
    try {
      await ReabilityClinic.ready; await ReabilityClinic.flush(); rows=await ReabilityClinic.api('/api/history');
      for(const id of [...selectedIds]) if(!rows.some(r=>r.id===id)) selectedIds.delete(id);
      for(const [field,values] of [['patient-filter',new Map(rows.map(r=>[r.patient_id,r.patient_name]))],['game-filter',new Map(rows.map(r=>[r.game,names[r.game]||r.game]))]]) {
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
  async function exportRounds(matches,button) {
    button.disabled=true;$('history-error').textContent='';
    try {
      const table=[['Partida ID','Paciente ID','Paciente','Idade','Data ISO','Jogo','Nível','Rodada','Resultado','Tempo (ms)','Dados']];
      for(const r of matches) {
        const base=[r.id,r.patient_id,r.patient_name,r.patient_age,r.started_at,names[r.game]||r.game,levels[r.level]||r.level];
        const match=await ReabilityClinic.api('/api/matches/'+r.id);for(const e of match.events.filter(e=>e.kind==='round'))table.push([...base,e.data.round,result(e.data),e.data.responseMs,JSON.stringify(e.data)]);
      }
      download(table,`reability-rodadas-${matches.length}-${matches.length===1?'partida':'partidas'}-${localDay(new Date())}.csv`);
    } catch(e) {$('history-error').textContent=e.message;} finally {button.disabled=false;}
  }
  async function deleteSelected() {
    const matches=rows.filter(r=>selectedIds.has(r.id));
    if(!matches.length)return;
    const amount=`${matches.length} ${matches.length===1?'partida':'partidas'}`;
    if(!window.confirm(`Apagar permanentemente ${amount} e todas as rodadas vinculadas? Esta ação não pode ser desfeita.`))return;
    const button=$('delete-selected');button.disabled=true;$('export-selected').disabled=true;$('history-error').textContent='';
    try {
      await ReabilityClinic.api('/api/matches/delete',{ids:matches.map(r=>r.id)});
      selectedIds.clear();await load();$('selection-status').textContent=`${amount.charAt(0).toUpperCase()+amount.slice(1)} ${matches.length===1?'apagada':'apagadas'} com sucesso.`;
    } catch(e) {$('history-error').textContent=e.message;updateSelection();}
  }
  ['patient-filter','game-filter','from','to'].forEach(id=>$(id).onchange=render);
  $('refresh').onclick=load;
  $('select-all').onchange=()=>{for(const r of selected())if($('select-all').checked)selectedIds.add(r.id);else selectedIds.delete(r.id);render();};
  $('export-selected').onclick=()=>exportRounds(rows.filter(r=>selectedIds.has(r.id)),$('export-selected'));
  $('delete-selected').onclick=deleteSelected;
  [$('close-details'),...document.querySelectorAll('.js-close-details')].forEach(button=>button.onclick=()=>$('details').close());
  $('details').onclick=event=>{if(event.target===$('details'))$('details').close();};
  load();
})();
