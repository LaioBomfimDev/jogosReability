import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

function harness(file) {
  const elements=new Map(),handlers={},events=[];let now=0,serial=0;
  let seed=0x12345678;const seededMath=Object.create(Math);seededMath.random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  const timers=new Map(),frames=new Map();
  const element=()=>({hidden:false,disabled:false,textContent:'',dataset:{},style:{},value:'10',clientWidth:280,clientHeight:360,children:[],classList:{add(){},remove(){},toggle(){}},setAttribute(){},focus(){},append(e){this.children.push(e);},replaceChildren(){this.children=[];}});
  const get=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id);};
  const choices=['colors','shapes','hard'].map(mode=>({...element(),dataset:{mode}}));
  const document={hidden:false,getElementById:get,querySelectorAll:()=>choices,createElement:element,addEventListener:(name,fn)=>handlers[name]=fn};
  const clinic={ready:Promise.resolve(),start:(...args)=>events.push({type:'start',args}),round:data=>events.push({type:'round',data}),finish:(data,status)=>events.push({type:'finish',data,status}),mark(){}};
  const context=vm.createContext({document,ReabilityClinic:clinic,performance:{now:()=>now},Math:seededMath,setTimeout:(fn,delay)=>{const id=++serial;timers.set(id,{fn,at:now+delay});return id;},clearTimeout:id=>timers.delete(id),requestAnimationFrame:fn=>{const id=++serial;frames.set(id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id)});
  vm.runInContext(readFileSync(new URL(file,import.meta.url),'utf8'),context);
  return {get,events,choices,document,handlers,
    async startColor(mode){await choices.find(c=>c.dataset.mode===mode).onclick();},
    async startTrack(){await get('start-form').onsubmit({preventDefault(){}});},
    timer(){assert.ok(timers.size,'timer available');const [id,timer]=[...timers].sort((a,b)=>a[1].at-b[1].at)[0];timers.delete(id);now=timer.at;timer.fn();},
    frame(ms=16){now+=ms;const pending=[...frames];frames.clear();pending.forEach(([,fn])=>fn(now));},
  };
}

for(const mode of ['colors','shapes','hard'])test(`colors: ${mode} has 12 correct rounds, stable mappings and no duplicate clicks`,async()=>{
  const h=harness('../jogo-atencao-cores/script.js');await h.startColor(mode);const rules=[];
  for(let i=0;i<12;i++) {
    h.timer();
    const shape=h.get('symbol').dataset.shape,color=h.get('symbol').dataset.color,byColor=h.get('rule').textContent.includes('COR');rules.push(byColor?'color':'shape');
    const side=byColor?(color==='blue'?'left':'right'):(shape==='circle'?'left':'right');
    h.get(side).onclick();h.get(side).onclick();
    assert.equal(h.events.filter(e=>e.type==='round').length,i+1);h.timer();
  }
  const finish=h.events.find(e=>e.type==='finish');assert.equal(finish.data.correct,12);assert.equal(finish.data.errors,0);assert.equal(finish.status,'completed');
  const fixedRule=mode==='shapes'?'shape':'color';
  assert.deepEqual(rules,mode==='hard'?['color','color','color','shape','shape','shape','color','color','color','shape','shape','shape']:Array(12).fill(fixedRule));
  assert.equal(h.events.filter(e=>e.type==='round'&&e.data.switched).length,mode==='hard'?3:0);
  if(mode==='colors')assert.ok(h.events.filter(e=>e.type==='round').every(e=>e.data.shape==='circle'));
  if(mode==='shapes')assert.ok(h.events.filter(e=>e.type==='round').every(e=>e.data.color==='blue'));
});

test('colors: omissions have no reaction time; ending cancels pending stimuli',async()=>{
  const h=harness('../jogo-atencao-cores/script.js');await h.startColor('colors');h.timer();h.timer();h.timer();
  const round=h.events.find(e=>e.type==='round');assert.equal(round.data.outcome,'omission');assert.equal(round.data.responseMs,null);
  h.get('stop').onclick();assert.equal(h.events.at(-1).status,'interrupted');
});

test('tracking: 15 moving targets freeze, accept one answer and finish ten rounds',async()=>{
  const h=harness('../jogo-rastreio-foco/script.js');h.get('count').value='15';await h.startTrack();
  for(let round=0;round<10;round++) {
    assert.equal(h.get('arena').children.length,15);assert.ok(h.get('arena').children.every(e=>e.disabled));
    const starts=h.get('arena').children.map(e=>e.style.transform.match(/translate\(([-\d.]+)px,([-\d.]+)px\)/).slice(1).map(Number));
    assert.ok(Math.max(...starts.map(p=>p[0]))-Math.min(...starts.map(p=>p[0]))>150,'starts span the arena width');
    assert.ok(Math.max(...starts.map(p=>p[1]))-Math.min(...starts.map(p=>p[1]))>250,'starts span the arena height');
    const initial=h.get('arena').children[0].style.transform;h.frame(1000);assert.notEqual(h.get('arena').children[0].style.transform,initial);
    if(round===0) {
      const moved=h.get('arena').children.map(e=>e.style.transform.match(/translate\(([-\d.]+)px,([-\d.]+)px\)/).slice(1).map(Number));
      const deltas=moved.map((point,i)=>[point[0]-starts[i][0],point[1]-starts[i][1]]);
      assert.ok(deltas.some(d=>d[0]>0)&&deltas.some(d=>d[0]<0),'initial motion goes both left and right');
      assert.ok(deltas.some(d=>d[1]>0)&&deltas.some(d=>d[1]<0),'initial motion goes both up and down');
    }
    for(let i=0;i<9;i++)h.frame(1000);
    assert.equal(h.get('instruction').textContent,'Onde estava o quadrado dourado?');
    const button=h.get('arena').children[0];button.onclick();button.onclick();
    assert.equal(h.events.filter(e=>e.type==='round').length,round+1);h.get('next').onclick();
  }
  const finish=h.events.find(e=>e.type==='finish');assert.equal(finish.status,'completed');assert.equal(finish.data.correct+finish.data.errors,10);
});
