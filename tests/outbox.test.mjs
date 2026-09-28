import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';

test('empty flush does not block later saves; offline records retry and remain account-scoped', async()=>{
  const storage=new Map(),sent=[];let online=true;
  const localStorage={get length(){return storage.size;},key:i=>[...storage.keys()][i],getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)};
  const node={textContent:'',dataset:{},setAttribute(){},append(){},querySelector(){return {...node};}};
  const window={addEventListener(){},setInterval(){}};
  const document={body:{prepend(){}},querySelector:()=>node,createElement:()=>({...node}),addEventListener(){}};
  const fetch=async(url,options)=>{
    if(url==='/api/me')return {ok:true,json:async()=>({id:'owner-a',name:'Profissional'})};
    if(!online)throw new Error('offline');
    sent.push(JSON.parse(options.body));return {ok:true,json:async()=>({ok:true})};
  };
  const context=vm.createContext({window,document,localStorage,fetch,crypto:{randomUUID},location:{pathname:'/index.html'},performance:{now:()=>0}});
  vm.runInContext(readFileSync(new URL('../clinic.js',import.meta.url),'utf8'),context);
  const clinic=window.ReabilityClinic;await clinic.ready;
  const own='reability-outbox:owner-a:tab',other='reability-outbox:owner-b:tab';
  localStorage.setItem(own,JSON.stringify([{id:'event-1'}]));
  localStorage.setItem(other,JSON.stringify([{id:'private-event'}]));
  assert.equal(await clinic.flush(),true);assert.equal(sent.length,1);assert.equal(sent[0].events[0].id,'event-1');assert.equal(localStorage.getItem(own),null);assert.notEqual(localStorage.getItem(other),null);
  await clinic.flush(); // Another empty run must not latch the resolved promise.
  online=false;localStorage.setItem(own,JSON.stringify([{id:'event-2'}]));
  assert.equal(await clinic.flush(),false);assert.notEqual(localStorage.getItem(own),null);
  online=true;assert.equal(await clinic.flush(),true);assert.equal(sent.length,2);assert.equal(localStorage.getItem(own),null);
  assert.notEqual(localStorage.getItem(other),null);
});
