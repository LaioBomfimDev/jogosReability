(() => {
  const GAME_PAGES = {
    'jogo-memoria-neuro':'Memória Visual', 'jogo-numero-neuro':'Lógica Numérica', 'jogo-cerebro-feliz':'Atenção Plena',
    'jogo-cubos-em-foco':'Cubos em Foco', 'jogo-matriz-neuro':'Matriz em Movimento', 'jogo-puzzle-rotacao':'Puzzle de Rotação',
    'jogo-ritmo-neuro':'Ritmo em Foco', 'jogo-termo-unico':'Termooo · Único', 'jogo-termo-dueto':'Termooo · Dueto',
    'jogo-termo-quarteto':'Termooo · Quarteto', 'jogo-atencao-cores':'Cores e Regras', 'jogo-rastreio-foco':'Siga o Foco',
  };
  const page = location.pathname.split('/')[1];
  const title = GAME_PAGES[page];
  let account, patient, active, flushing, storageFailed = false;
  const outboxSuffix = crypto.randomUUID();
  let memoryQueue = [];
  const api = async (url, data) => {
    const options = { credentials:'same-origin', cache:'no-store', ...(data === undefined ? {} : { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) }) };
    try {
      const response = await fetch(url, options);
      if ([404,405,501].includes(response.status) && window.ReabilityLocalAPI) return window.ReabilityLocalAPI.request(url, data, options.method || 'GET');
      const body = await response.json().catch(() => ({ error:'Não foi possível acessar os registros.' }));
      if (!response.ok) throw Object.assign(new Error(body.error || 'Não foi possível concluir.'), { status:response.status });
      return body;
    } catch (error) {
      if (!error.status && window.ReabilityLocalAPI) return window.ReabilityLocalAPI.request(url, data, options.method || 'GET');
      throw error;
    }
  };
  const safeReturn = value => /^\/(?!\/)[a-zA-Z0-9/_-]*(?:\.html)?$/.test(value || '') ? value : '/index.html';
  const login = () => location.assign(`/login.html?return=${encodeURIComponent(location.pathname)}`);
  const status = (message, error = false) => { const el = document.querySelector('#clinic-sync'); if (el) { el.textContent = message; el.dataset.error = String(error); } };
  const prefix = () => `reability-outbox:${account.id}:`;
  const key = () => prefix() + outboxSuffix;
  const pending = () => {
    const batches = [];
    try {
      for (let i=0; i<localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k.startsWith(prefix())) batches.push({ key:k, events:JSON.parse(localStorage.getItem(k) || '[]') });
      }
    } catch { storageFailed = true; }
    if (storageFailed && memoryQueue.length) batches.push({ key:null, events:[...memoryQueue] });
    return batches;
  };
  const flush = () => {
    if (!account) return Promise.resolve(false);
    if (flushing) return flushing;
    flushing = (async () => {
      try {
        for (const batch of pending()) {
          for (let i=0; i<batch.events.length; i+=25) {
            const events = batch.events.slice(i,i+25);
            if (!events.length) continue;
            status('Salvando registros…');
            await api('/api/events', { events });
            const ids = new Set(events.map(e => e.id));
            if (batch.key) {
              const rest = JSON.parse(localStorage.getItem(batch.key) || '[]').filter(e => !ids.has(e.id));
              if (rest.length) localStorage.setItem(batch.key, JSON.stringify(rest)); else localStorage.removeItem(batch.key);
            }
            memoryQueue = memoryQueue.filter(e => !ids.has(e.id));
          }
        }
        status(storageFailed ? 'Registro salvo · mantenha esta página aberta' : 'Registros salvos');
        return true;
      } catch (error) {
        status(`${error.status === 401 ? 'Sessão expirada. Entre novamente.' : 'Salvamento pendente. Tentaremos novamente.'}${storageFailed ? ' Não feche esta página.' : ''}`, true);
        return false;
      }
    })().finally(() => { flushing = null; });
    return flushing;
  };
  const emit = (kind, data) => {
    if (!active) return;
    const event = { id:crypto.randomUUID(), matchId:active.id, kind, at:new Date().toISOString(), data };
    memoryQueue.push(event);
    try { localStorage.setItem(key(), JSON.stringify(memoryQueue)); } catch { storageFailed = true; }
    void flush();
  };
  const finish = (summary = {}, result = 'completed') => {
    if (!active) return;
    emit('finish', { ...summary, durationMs:Math.round(performance.now()-active.started), rounds:active.rounds, status:result });
    active = null;
  };
  const start = (game, level) => {
    if (!patient) throw new Error('Selecione o paciente antes de iniciar.');
    finish({}, 'interrupted');
    active = { id:crypto.randomUUID(), started:performance.now(), rounds:0, last:performance.now() };
    emit('start', { patientId:patient.id, age:patient.age, game, level });
  };
  const mark = () => { if (active) active.last = performance.now(); };
  const round = data => {
    if (!active) return;
    const now = performance.now();
    emit('round', { responseMs:Math.round(now-active.last), ...data, round:++active.rounds });
    active.last = now;
  };
  const toolbar = () => {
    const bar = document.createElement('nav');
    bar.className = 'clinic-bar'; bar.setAttribute('aria-label','Área da profissional');
    bar.innerHTML = '<span class="clinic-identity"></span><span id="clinic-sync" class="clinic-sync" role="status"></span><a href="/index.html">Jogos</a><a href="/profissional.html">Histórico</a>';
    const identity = bar.querySelector('.clinic-identity');
    identity.textContent = account ? account.name : 'Reability · Área da profissional';
    if (account) {
      const logout = document.createElement('button'); logout.textContent = 'Sair';
      logout.onclick = async () => {
        finish({}, 'interrupted');
        if (!(await flush())) { status('Há registros pendentes. Reconecte antes de sair.', true); return; }
        try { await api('/api/logout', {}); location.assign('/login.html'); } catch (error) { status(error.message,true); }
      };
      bar.append(logout);
    } else {
      const link = document.createElement('a'); link.href='/login.html'; link.textContent='Entrar'; bar.append(link);
    }
    document.body.prepend(bar);
  };
  const choosePatient = async () => {
    document.querySelector('main')?.setAttribute('inert','');
    const dialog = document.createElement('dialog'); dialog.className='clinic-dialog';
    dialog.innerHTML='<p class="clinic-kicker">Antes de começar</p><h2>Quem vai jogar?</h2><p id="clinic-game"></p><form class="clinic-form"><label>Paciente cadastrado<select name="existing"><option value="">Cadastrar novo paciente</option></select></label><label>Nome do paciente<input name="name" autocomplete="off" maxlength="120" required></label><label>Idade nesta sessão<input name="age" type="number" min="0" max="120" step="1" required></label><p class="clinic-error" role="alert"></p><button class="clinic-button">Continuar para o jogo</button><a href="/index.html">Voltar aos jogos</a></form>';
    dialog.querySelector('#clinic-game').textContent=title;
    document.body.append(dialog); dialog.showModal();
    dialog.addEventListener('cancel',e=>e.preventDefault());
    const form=dialog.querySelector('form'); const fields=form.elements;
    const error=dialog.querySelector('.clinic-error');
    let patients;
    try { patients=await api('/api/patients'); } catch(e) { error.textContent=e.message; fields.existing.disabled=true; patients=[]; }
    for (const p of patients) { const option=document.createElement('option'); option.value=p.id; option.textContent=`${p.name} · ${p.age} anos · ${p.id.slice(0,8)}`; fields.existing.append(option); }
    fields.existing.onchange=()=>{
      const selected=patients.find(p=>p.id===fields.existing.value);
      fields.name.value=selected?.name || ''; fields.name.readOnly=!!selected; fields.age.value=selected?.age ?? '';
    };
    await new Promise(resolve=>form.onsubmit=async e=>{
      e.preventDefault(); const button=form.querySelector('button'); button.disabled=true; error.textContent='';
      try {
        const selected=patients.find(p=>p.id===fields.existing.value);
        const saved=selected || await api('/api/patients',{name:fields.name.value.trim(),age:Number(fields.age.value)});
        patient={...saved,age:Number(fields.age.value)};
        document.querySelector('.clinic-identity').textContent=`${account.name} · Paciente: ${patient.name}, ${patient.age} anos`;
        dialog.close(); dialog.remove(); document.querySelector('main')?.removeAttribute('inert'); resolve();
      } catch(e) { error.textContent=e.message; button.disabled=false; }
    });
  };
  const ready = (async () => {
    if (title) document.querySelector('main')?.setAttribute('inert','');
    try { account=await api('/api/me'); }
    catch(e) {
      if (title || page==='profissional.html') { login(); return new Promise(()=>{}); }
    }
    toolbar();
    if (account) { await flush(); window.setInterval(flush,4000); }
    if (title) await choosePatient();
    return account;
  })();
  window.addEventListener('pagehide',()=>{ finish({},'interrupted'); });
  window.addEventListener('online',flush);
  window.addEventListener('beforeunload',event=>{ if (storageFailed && memoryQueue.length) { event.preventDefault(); event.returnValue=''; } });
  window.addEventListener('pageshow',event=>{ if(event.persisted) location.reload(); });
  // Avoid game keyboard shortcuts consuming input in the patient dialog.
  document.addEventListener('keydown',event=>{ if (event.target.closest('.clinic-dialog')) event.stopPropagation(); },true);
  window.ReabilityClinic={api,ready,start,round,mark,finish,flush,safeReturn,getPatient:()=>patient};
})();
