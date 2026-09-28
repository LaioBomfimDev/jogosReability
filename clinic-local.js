(() => {
  const ACCOUNT = { id:'6f0fcb5b-b4bf-4e86-987f-55832c00d3e8', name:'Denise Neves', username:'deniseneves' };
  const PASSWORD_HASH = 'fcfcca864793449e17687ade297f55e23d3c8ee88c3ee6a866fa519d943196b1';
  const DATA_KEY = 'reability-clinic-data-v1';
  const SESSION_KEY = 'reability-clinic-session-v1';
  const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
  const read = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(DATA_KEY) || '{}');
      return { patients:Array.isArray(saved.patients)?saved.patients:[], matches:Array.isArray(saved.matches)?saved.matches:[], events:Array.isArray(saved.events)?saved.events:[] };
    } catch { return { patients:[], matches:[], events:[] }; }
  };
  const write = data => {
    try { localStorage.setItem(DATA_KEY, JSON.stringify(data)); }
    catch { fail(507, 'O navegador não tem espaço para salvar novos registros. Exporte o histórico em CSV.'); }
  };
  const session = () => {
    try {
      const value = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      if (value?.accountId === ACCOUNT.id && value.expires > Date.now()) return ACCOUNT;
    } catch {}
    localStorage.removeItem(SESSION_KEY);
    fail(401, 'Entre na sua conta para continuar.');
  };
  const passwordHash = async value => {
    const bytes = new TextEncoder().encode(value);
    return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(byte=>byte.toString(16).padStart(2,'0')).join('');
  };
  const response = (data, status = 200) => ({ ...data, __localStatus:status });
  const validId = value => typeof value === 'string' && /^[a-f0-9-]{36}$/.test(value);

  async function request(url, body, method = body === undefined ? 'GET' : 'POST') {
    const route = new URL(url, location.origin).pathname;
    if (route === '/api/login' && method === 'POST') {
      const username = String(body?.username || '').trim().toLowerCase();
      const validPassword = await passwordHash(String(body?.password || '')) === PASSWORD_HASH;
      if (username !== ACCOUNT.username || !validPassword) fail(401, 'Usuário ou senha incorretos.');
      localStorage.setItem(SESSION_KEY, JSON.stringify({ accountId:ACCOUNT.id, expires:Date.now()+43200000 }));
      return ACCOUNT;
    }
    session();
    if (route === '/api/me' && method === 'GET') return ACCOUNT;
    if (route === '/api/logout' && method === 'POST') { localStorage.removeItem(SESSION_KEY); return { ok:true }; }
    const data = read();
    if (route === '/api/patients') {
      if (method === 'GET') return [...data.patients].sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
      const name = String(body?.name || '').trim();
      const patientAge = Number(body?.age);
      if (!name || name.length > 120 || !Number.isInteger(patientAge) || patientAge < 0 || patientAge > 120) fail(400, 'Informe nome e idade corretamente.');
      const patient = { id:crypto.randomUUID(), name, age:patientAge, created_at:new Date().toISOString() };
      data.patients.push(patient); write(data); return response(patient, 201);
    }
    if (route === '/api/events' && method === 'POST') {
      if (!Array.isArray(body?.events) || body.events.length < 1 || body.events.length > 50) fail(400, 'Lote inválido.');
      for (const event of body.events) {
        if (data.events.some(saved=>saved.id===event.id)) continue;
        if (!validId(event.id) || !validId(event.matchId) || !['start','round','finish'].includes(event.kind)) fail(400, 'Evento inválido.');
        if (event.kind === 'start') {
          const patient = data.patients.find(item=>item.id===event.data?.patientId);
          if (!patient) fail(404, 'Paciente não encontrado.');
          data.matches.push({ id:event.matchId, patient_id:patient.id, patient_name:patient.name, patient_age:Number(event.data.age), game:event.data.game, level:event.data.level, started_at:event.at, ended_at:null, status:'active', summary:{} });
        } else {
          const match = data.matches.find(item=>item.id===event.matchId);
          if (!match) fail(404, 'Partida não encontrada.');
          if (event.kind === 'finish') { match.ended_at=event.at; match.status=event.data.status; match.summary=event.data; }
        }
        data.events.push({ id:event.id, match_id:event.matchId, kind:event.kind, created_at:event.at, data:event.data });
      }
      write(data); return { ok:true };
    }
    if (route === '/api/history' && method === 'GET') return [...data.matches].sort((a,b)=>b.started_at.localeCompare(a.started_at)).map(match=>({ ...match, rounds:data.events.filter(event=>event.match_id===match.id&&event.kind==='round').length }));
    if (route.startsWith('/api/matches/') && method === 'GET') {
      const match = data.matches.find(item=>item.id===route.split('/').at(-1));
      if (!match) fail(404, 'Partida não encontrada.');
      return { ...match, events:data.events.filter(event=>event.match_id===match.id) };
    }
    fail(404, 'Recurso não encontrado.');
  }
  window.ReabilityLocalAPI = { request };
})();
