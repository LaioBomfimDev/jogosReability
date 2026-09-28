import { DatabaseSync } from 'node:sqlite';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const str = (value, max = 120) => typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max ? value.trim() : fail(400, 'Preencha os campos corretamente.');
const id = value => /^[a-f0-9-]{36}$/.test(value) ? value : fail(400, 'Identificador inválido.');
const age = value => Number.isInteger(value) && value >= 0 && value <= 120 ? value : fail(400, 'Informe uma idade entre 0 e 120 anos.');
const digest = token => createHash('sha256').update(token).digest('hex');
const games = new Set(['memoria-visual', 'logica-numerica', 'cerebro-feliz', 'cubos-em-foco', 'matriz-neuro', 'matriz-em-movimento', 'puzzle-rotacao', 'ritmo-neuro', 'ritmo-em-foco', 'termo', 'termooo', 'jogo-de-palavras', 'atencao-cores', 'rastreio-foco']);
const soleAccount = {
  id: '6f0fcb5b-b4bf-4e86-987f-55832c00d3e8',
  name: 'Denise Neves',
  username: 'deniseneves',
  password: 'd12ede38e50b865e4de7c59de5980e54:00b1e3fc4f94e89d25153803b1626b2be1cf685eddb25f9612e6d6f5cae9957f6773fb0fb5f7e7472b9a6270e8ed4e3b9f5a852fa78d2f43cf9d0a5eb0300922',
};

export function createClinicAPI(dataDirectory) {
  mkdirSync(dataDirectory, { recursive: true });
  const db = new DatabaseSync(path.join(dataDirectory, 'clinic.sqlite'));
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS professionals(id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS logins(token TEXT PRIMARY KEY, professional_id TEXT NOT NULL REFERENCES professionals(id), expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS patients(id TEXT PRIMARY KEY, professional_id TEXT NOT NULL REFERENCES professionals(id), name TEXT NOT NULL, age INTEGER NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS matches(id TEXT PRIMARY KEY, professional_id TEXT NOT NULL REFERENCES professionals(id), patient_id TEXT NOT NULL REFERENCES patients(id), patient_name TEXT NOT NULL, patient_age INTEGER NOT NULL, game TEXT NOT NULL, level TEXT NOT NULL, started_at TEXT NOT NULL, ended_at TEXT, status TEXT NOT NULL DEFAULT 'active', summary TEXT NOT NULL DEFAULT '{}');
    CREATE TABLE IF NOT EXISTS events(id TEXT PRIMARY KEY, match_id TEXT NOT NULL REFERENCES matches(id), kind TEXT NOT NULL, created_at TEXT NOT NULL, data TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS matches_owner ON matches(professional_id, started_at);
    CREATE INDEX IF NOT EXISTS events_match ON events(match_id);
  `);
  db.prepare('INSERT OR IGNORE INTO professionals VALUES (?,?,?,?)').run(soleAccount.id, soleAccount.name, soleAccount.username, soleAccount.password);
  db.prepare('UPDATE professionals SET name=?,password=? WHERE email=?').run(soleAccount.name, soleAccount.password, soleAccount.username);
  const authAttempts = new Map();
  const send = (res, status, data, headers = {}) => {
    res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers });
    res.end(JSON.stringify(data));
  };
  const readBody = async req => {
    if (!req.headers['content-type']?.startsWith('application/json')) fail(415, 'Envie JSON.');
    let data = '';
    for await (const chunk of req) { data += chunk; if (Buffer.byteLength(data) > 65536) fail(413, 'Requisição muito grande.'); }
    try { return JSON.parse(data); } catch { fail(400, 'Dados inválidos.'); }
  };
  const authorize = req => {
    const token = /(?:^|;\s*)reability_session=([^;]+)/.exec(req.headers.cookie || '')?.[1];
    const account = token && db.prepare('SELECT p.id,p.name,p.email AS username FROM logins l JOIN professionals p ON p.id=l.professional_id WHERE l.token=? AND l.expires>? AND p.email=?').get(digest(token), Date.now(), soleAccount.username);
    if (!account) fail(401, 'Entre na sua conta para continuar.');
    return account;
  };
  const cookie = (req, value, maxAge) => `reability_session=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${process.env.NODE_ENV === 'production' || req.socket.encrypted ? '; Secure' : ''}`;
  return { db, async handle(req, res) {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (!['GET', 'POST'].includes(req.method)) fail(405, 'Método não permitido.');
      if (req.method === 'POST' && req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) fail(403, 'Origem não permitida.');
      const route = url.pathname;
      if (req.method === 'POST' && route === '/api/register') fail(404, 'Cadastro de contas não está disponível.');
      if (req.method === 'POST' && route === '/api/login') {
        const address = req.socket.remoteAddress;
        const now = Date.now();
        if (authAttempts.size > 1000) for (const [key, value] of authAttempts) if (value.until < now) authAttempts.delete(key);
        let rate = authAttempts.get(address);
        if (!rate || rate.until < now) { rate = { count: 0, until: now + 600000 }; authAttempts.set(address, rate); }
        if (++rate.count > 30) fail(429, 'Muitas tentativas. Aguarde alguns minutos.');
        const body = await readBody(req);
        const username = str(body.username, 40).toLowerCase();
        const password = str(body.password, 200);
        const row = username === soleAccount.username ? db.prepare('SELECT * FROM professionals WHERE email=?').get(username) : undefined;
        const [salt, hash] = (row?.password || `${'0'.repeat(32)}:${'0'.repeat(128)}`).split(':');
        if (!timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(hash, 'hex')) || !row) fail(401, 'Usuário ou senha incorretos.');
        const account = { id: row.id, name: row.name, username: row.email };
        const token = randomBytes(32).toString('hex');
        db.prepare('DELETE FROM logins WHERE expires<=?').run(now);
        db.prepare('INSERT INTO logins VALUES (?,?,?)').run(digest(token), account.id, now + 43200000);
        send(res, 200, account, { 'set-cookie': cookie(req, token, 43200) });
        return;
      }
      const account = authorize(req);
      if (route === '/api/me' && req.method === 'GET') return send(res, 200, account);
      if (route === '/api/logout' && req.method === 'POST') {
        const token = /(?:^|;\s*)reability_session=([^;]+)/.exec(req.headers.cookie || '')?.[1];
        db.prepare('DELETE FROM logins WHERE token=?').run(digest(token));
        return send(res, 200, { ok: true }, { 'set-cookie': cookie(req, '', 0) });
      }
      if (route === '/api/patients') {
        if (req.method === 'GET') return send(res, 200, db.prepare('SELECT id,name,age FROM patients WHERE professional_id=? ORDER BY name').all(account.id));
        const body = await readBody(req);
        const patient = { id: randomUUID(), name: str(body.name), age: age(body.age) };
        db.prepare('INSERT INTO patients VALUES (?,?,?,?,?)').run(patient.id, account.id, patient.name, patient.age, new Date().toISOString());
        return send(res, 201, patient);
      }
      if (route === '/api/events' && req.method === 'POST') {
        const body = await readBody(req);
        if (!Array.isArray(body.events) || body.events.length < 1 || body.events.length > 50) fail(400, 'Lote inválido.');
        db.exec('BEGIN IMMEDIATE');
        try {
          for (const event of body.events) {
            id(event.id); id(event.matchId);
            if (!['start', 'round', 'finish'].includes(event.kind) || !event.data || typeof event.data !== 'object' || Array.isArray(event.data)) fail(400, 'Evento inválido.');
            if (!Number.isFinite(Date.parse(event.at))) fail(400, 'Data inválida.');
            const existing = db.prepare('SELECT e.id,m.professional_id FROM events e JOIN matches m ON m.id=e.match_id WHERE e.id=?').get(event.id);
            if (existing) { if (existing.professional_id !== account.id) fail(403, 'Registro indisponível.'); continue; }
            const data = event.data;
            if (event.kind === 'start') {
              const patient = db.prepare('SELECT * FROM patients WHERE id=? AND professional_id=?').get(id(data.patientId), account.id);
              if (!patient) fail(404, 'Paciente não encontrado.');
              if (!games.has(data.game)) fail(400, 'Jogo inválido.');
              db.prepare('INSERT INTO matches(id,professional_id,patient_id,patient_name,patient_age,game,level,started_at) VALUES (?,?,?,?,?,?,?,?)').run(event.matchId, account.id, patient.id, patient.name, age(data.age), data.game, str(data.level, 60), event.at);
            } else {
              const match = db.prepare('SELECT * FROM matches WHERE id=? AND professional_id=?').get(event.matchId, account.id);
              if (!match) fail(404, 'Partida não encontrada.');
              if (match.status !== 'active') fail(409, 'Partida já encerrada.');
              if (event.kind === 'finish') {
                if (!['completed', 'interrupted', 'timeout'].includes(data.status)) fail(400, 'Resultado inválido.');
                db.prepare('UPDATE matches SET ended_at=?,status=?,summary=? WHERE id=?').run(event.at, data.status, JSON.stringify(data), event.matchId);
              }
            }
            db.prepare('INSERT INTO events VALUES (?,?,?,?,?)').run(event.id, event.matchId, event.kind, event.at, JSON.stringify(data));
          }
          db.exec('COMMIT');
        } catch (error) { db.exec('ROLLBACK'); throw error; }
        return send(res, 200, { ok: true });
      }
      if (route === '/api/history' && req.method === 'GET') {
        const rows = db.prepare(`SELECT m.*, (SELECT count(*) FROM events e WHERE e.match_id=m.id AND e.kind='round') AS rounds FROM matches m WHERE professional_id=? ORDER BY started_at DESC`).all(account.id);
        return send(res, 200, rows.map(row => ({ ...row, summary: JSON.parse(row.summary) })));
      }
      if (route.startsWith('/api/matches/') && req.method === 'GET') {
        const match = db.prepare('SELECT * FROM matches WHERE id=? AND professional_id=?').get(id(route.split('/').at(-1)), account.id);
        if (!match) fail(404, 'Partida não encontrada.');
        const events = db.prepare('SELECT * FROM events WHERE match_id=? ORDER BY rowid').all(match.id);
        return send(res, 200, { ...match, summary: JSON.parse(match.summary), events: events.map(e => ({ ...e, data: JSON.parse(e.data) })) });
      }
      fail(404, 'Recurso não encontrado.');
    } catch (error) { send(res, error.status || 500, { error: error.status ? error.message : 'Não foi possível salvar ou consultar. Tente novamente.' }); }
  } };
}
