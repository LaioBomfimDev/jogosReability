import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync,existsSync } from 'node:fs';
const root=new URL('../',import.meta.url);

function harness(level='easy',collection='objects') {
  const nodes=new Map(),events=[],timers=new Map();let now=1000,serial=0;
  class Element {
    constructor() {this.dataset={};this.attrs={};this.children=[];this.listeners={};this.hidden=false;this.open=false;this.disabled=false;this.value='';this.innerHTML='';const classes=new Set();this.classList={add:(...names)=>names.forEach(name=>classes.add(name)),remove:name=>classes.delete(name),contains:name=>classes.has(name),toggle:(name,active)=>active?classes.add(name):classes.delete(name)};}
    setAttribute(name,value){this.attrs[name]=value;}
    addEventListener(name,fn){this.listeners[name]=fn;}
    append(child){this.children.push(child);}
    replaceChildren(){this.children=[];}
    showModal(){this.open=true;}
    close(){this.open=false;}
    focus(){}
    async click(){if(!this.disabled)await this.listeners.click?.({currentTarget:this});}
  }
  const get=id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id);};
  const choices=['easy','medium','hard'].map(key=>{const item=new Element();item.dataset.level=key;return item;});
  get('memory-collection').value=collection;get('memory-time-limit').value='90';get('memory-reveal-time').value='700';
  const document={querySelector:selector=>get(selector.slice(1)),querySelectorAll:()=>choices,createElement:()=>new Element()};
  const clinic={confirmReady:async()=>{},start:(...args)=>events.push({kind:'start',args}),round:data=>events.push({kind:'round',data}),finish:(data,status)=>events.push({kind:'finish',data,status})};
  const daily={statusText:()=>'',updateLevelLock(){},showLimitDialog(){},getUsage:()=>({remaining:Infinity}),ensurePlayerName:async()=>'',recordAttempt:()=>({ok:true}),goals:{showGoalResult(){}}};
  const window={setTimeout:(fn,delay)=>{const id=++serial;timers.set(id,{fn,at:now+delay});return id;},clearTimeout:id=>timers.delete(id),setInterval:()=>1,clearInterval(){},location:{href:'http://localhost/jogo-memoria-neuro/'}};
  const context=vm.createContext({document,window,ReabilityClinic:clinic,ReabilityDaily:daily,ReabilityGameShell:{countdown:async()=>{}},Math,Date:{now:()=>now},navigator:{}});
  vm.runInContext(readFileSync(new URL('jogo-memoria-neuro/script.js',root),'utf8'),context);
  return {get,events,timers,choices,
    async start(){await choices.find(item=>item.dataset.level===level).click();await get('memory-start-button').click();},
    tick(){assert.ok(timers.size);const [id,item]=[...timers].sort((a,b)=>a[1].at-b[1].at)[0];timers.delete(id);now=item.at;item.fn();},
  };
}

for(const collection of ['objects','clinical'])for(const [level,pairCount] of [['easy',6],['medium',8],['hard',10]])test(`memory ${collection}/${level}: keeps complete pairs and records the selected collection`,async()=>{
  const h=harness(level,collection);await h.start();const cards=h.get('game-board').children;
  assert.equal(cards.length,pairCount*2);assert.equal(h.events[0].args[2].collection,collection);
  assert.equal(h.events[0].args[2].pairs,pairCount);
  const pairs=new Map();
  for(const card of cards) {
    pairs.set(card.dataset.symbol,[...(pairs.get(card.dataset.symbol)||[]),card]);
    assert.match(card.attrs['aria-label'],/fechada/);
    if(collection==='objects') {
      const path=card.innerHTML.match(/src="([^"]+)"/)[1];assert.ok(existsSync(new URL(path.slice(1),root)));assert.doesNotMatch(card.innerHTML,/title=/);
    } else assert.doesNotMatch(card.innerHTML,/<img/);
  }
  assert.equal(pairs.size,pairCount);
  for(const pair of pairs.values()) {
    assert.equal(pair.length,2);await pair[0].click();assert.equal(pair[0].attrs['aria-pressed'],'true');assert.match(pair[0].attrs['aria-label'],new RegExp(pair[0].dataset.label));
    await pair[1].click();assert.ok(pair.every(card=>card.disabled&&card.classList.contains('is-matched')));
  }
  assert.equal(h.events.filter(event=>event.kind==='round').length,pairCount);
  assert.ok(h.events.filter(event=>event.kind==='round').every(event=>event.data.correct));
  h.tick();assert.equal(h.events.at(-1).kind,'finish');assert.equal(h.events.at(-1).data.matches,pairCount);assert.equal(h.events.at(-1).data.errors,0);
});

test('memory mismatches close after the configured time and hide their accessible names again',async()=>{
  const h=harness();await h.start();const cards=h.get('game-board').children;
  const a=cards[0],b=cards.find(card=>card.dataset.symbol!==a.dataset.symbol);
  await a.click();await b.click();assert.equal(h.events.at(-1).data.correct,false);
  assert.match(h.get('memory-turn-guide').textContent,/diferentes/);
  h.tick();assert.equal(a.attrs['aria-pressed'],'false');assert.match(a.attrs['aria-label'],/fechada/);assert.match(b.attrs['aria-label'],/fechada/);
  assert.ok(!a.classList.contains('is-open'));
});
