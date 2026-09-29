import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { randomUUID, webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';

test('static fallback authenticates the sole account and keeps patient history', async () => {
  const values = new Map();
  const localStorage = {
    getItem:key=>values.get(key) ?? null,
    setItem:(key,value)=>values.set(key,value),
    removeItem:key=>values.delete(key),
  };
  const window = {};
  const context = vm.createContext({ window, localStorage, location:{ origin:'https://example.test' }, crypto:{ subtle:webcrypto.subtle, randomUUID }, TextEncoder, Uint8Array, URL, Date });
  vm.runInContext(readFileSync(new URL('../clinic-local.js', import.meta.url), 'utf8'), context);
  const api = window.ReabilityLocalAPI;

  await assert.rejects(api.request('/api/login', { username:'deniseneves', password:'errada' }, 'POST'), /incorretos/);
  const account = await api.request('/api/login', { username:'deniseneves', password:'reability2026' }, 'POST');
  assert.equal(account.name, 'Denise Neves');
  const patient = await api.request('/api/patients', { name:'Paciente Teste', age:10 }, 'POST');
  const matchId = randomUUID();
  await api.request('/api/events', { events:[
    { id:randomUUID(), matchId, kind:'start', at:'2026-09-28T12:00:00.000Z', data:{ patientId:patient.id, age:10, game:'atencao-cores', level:'simple' } },
    { id:randomUUID(), matchId, kind:'round', at:'2026-09-28T12:00:01.000Z', data:{ round:1, correct:true, responseMs:450 } },
    { id:randomUUID(), matchId, kind:'finish', at:'2026-09-28T12:00:02.000Z', data:{ status:'completed', rounds:1, correct:1 } },
  ] }, 'POST');

  const history = await api.request('/api/history', undefined, 'GET');
  assert.equal(history.length, 1);
  assert.equal(history[0].patient_name, 'Paciente Teste');
  assert.equal(history[0].rounds, 1);
  const details = await api.request(`/api/matches/${matchId}`, undefined, 'GET');
  assert.equal(details.events.length, 3);
  const deleted = await api.request('/api/matches/delete', { ids:[matchId] }, 'POST');
  assert.equal(deleted.deleted, 1);
  assert.equal((await api.request('/api/history', undefined, 'GET')).length, 0);
  await assert.rejects(api.request(`/api/matches/${matchId}`, undefined, 'GET'), /não encontrada/);
});
