import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import vm from 'node:vm';
import { games, objects, alphabet, categories, ASSETS, letterImage } from '../jogo-alfabeto-core/content.js';
import { makeChallenge } from '../jogo-alfabeto-core/engine.js';
const root=new URL('../',import.meta.url);
const levels=['easy','medium','hard'];
function random() { let seed=0x12345;return ()=>{ seed=(1664525*seed+1013904223)>>>0;return seed/4294967296; }; }

test('all 52 object illustrations are localized, unique and present; all alphabet variants exist',()=>{
  assert.equal(objects.length,52);assert.equal(new Set(objects.map(item=>item.id)).size,52);
  assert.equal(readdirSync(new URL('assets/alphabet-kit/objects/',root)).length,52);
  for(const item of objects) { assert.ok(existsSync(new URL(item.image.slice(1),root)));assert.ok(categories[item.category]);assert.match(item.word[0],/[A-Z]/);assert.doesNotMatch(readFileSync(new URL(item.image.slice(1),root),'utf8'),/<text\b/,'English word labels must not reveal answers'); }
  for(const style of ['colored','regular','outline'])for(const letter of alphabet)assert.ok(existsSync(new URL(letterImage(letter,style).slice(1),root)));
  assert.equal(objects.find(item=>item.id==='cat').word[0],'G');
  assert.equal(objects.find(item=>item.id==='apple').word,'MACA');
});

test('every generated challenge remains solvable across all games, levels and repeated letters',()=>{
  const rand=random();
  for(const game of games)for(const level of levels)for(let attempt=0;attempt<120;attempt++) {
    const c=makeChallenge(game.id,level,rand);
    switch(game.id) {
      case 'palavra-pecas': {
        const bank=[...c.bank];
        c.answer.forEach((letter,i)=>{const index=bank.indexOf(letter);assert.ok(index>=0);bank.splice(index,1);assert.equal(letter,c.letters[c.missing[i]]);});break;
      }
      case 'pares-gatinho': {
        const counts=new Map();c.cards.forEach(card=>counts.set(card.object.id,(counts.get(card.object.id)||0)+1));
        assert.ok([...counts.values()].every(n=>n===2));assert.equal(counts.size,{easy:3,medium:4,hard:6}[level]);break;
      }
      case 'trilha-alfabeto': assert.deepEqual([...c.options].sort(),c.answer);assert.notDeepEqual(c.options,c.answer);break;
      case 'conta-brinca': assert.equal(c.items.filter(item=>item.id===c.object.id).length,c.answer);assert.ok(c.options.includes(c.answer));break;
      case 'sequencia-magica': c.answer.forEach(id=>assert.ok(c.options.some(item=>item.id===id)));break;
      case 'olho-lince': assert.equal(c.options.filter(item=>item.id===c.answer).length,1);break;
      default:assert.equal(c.options.filter(item=>item===c.answer).length,1);
    }
    if(c.options)assert.equal(new Set(c.options.map(item=>item.id||item)).size,c.options.length);
  }
});

function harness(gameId,level='easy',rounds=2) {
  const nodes=new Map(),events=[],handlers={},timers=new Map();let clock=0,serial=0;
  class Element {
    constructor(tag='div') { this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.hidden=false;this.disabled=false;this.checked=false;this.attrs={};this._text='';const classes=new Set();this.classList={add:(...names)=>names.forEach(n=>classes.add(n)),remove:(...names)=>names.forEach(n=>classes.delete(n)),contains:n=>classes.has(n),toggle:(n,v)=>v===false?classes.delete(n):classes.add(n)}; }
    set textContent(value) {this._text=String(value);this.children=[];}
    get textContent() {return this._text+this.children.map(child=>child.textContent||'').join('');}
    append(...items) {this.children.push(...items);}
    replaceChildren(...items) {this.children=items;this._text='';}
    setAttribute(name,value) {this.attrs[name]=value;}
    focus() {}
    querySelectorAll(selector) {return this.children.flatMap(child=>[...(selector==='button'&&child.tagName==='BUTTON'?[child]:[]),...child.querySelectorAll(selector)]);}
    querySelector(selector) {return this.querySelectorAll(selector)[0]||null;}
  }
  const get=id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id);};
  get('level').value=level;get('rounds').value=String(rounds);get('sequence-speed').value='700';get('sound').checked=false;
  const document={body:{dataset:{alphabetGame:gameId}},hidden:false,getElementById:get,createElement:tag=>new Element(tag),addEventListener:(type,fn)=>handlers[type]=fn};
  let latest;
  const make=(...args)=>{ latest=makeChallenge(...args);return latest; };
  const clinic={ready:Promise.resolve(),confirmReady:async()=>{},start:(...args)=>events.push({kind:'start',args}),round:data=>events.push({kind:'round',data}),finish:(data,status)=>events.push({kind:'finish',data,status}),mark(){},focusGame(){},isProfessional:()=>false};
  const context=vm.createContext({games,categories,ASSETS,letterImage,makeChallenge:make,document,window:{ReabilityClinic:clinic,matchMedia:()=>({matches:true}),addEventListener(){}},Math,performance:{now:()=>clock},setTimeout:(fn,ms)=>{const id=++serial;timers.set(id,{fn,at:clock+ms});return id;},clearTimeout:id=>timers.delete(id)});
  vm.runInContext(readFileSync(new URL('jogo-alfabeto-core/app.js',root),'utf8').replace(/^import .*;\r?\n/gm,''),context);
  const h={get,events,handlers,document,timers,challenge:()=>latest,
    start:()=>get('start-form').onsubmit({preventDefault(){}}),
    tick(){assert.ok(timers.size);const [id,item]=[...timers].sort((a,b)=>a[1].at-b[1].at)[0];timers.delete(id);clock=item.at;item.fn();},
    click(index){const node=get('board').children[index];assert.ok(node);assert.ok(!node.disabled);node.onclick();},
    solve(){
      const c=latest;
      if(gameId==='pares-gatinho') {
        const pairs=new Map();c.cards.forEach((card,i)=>pairs.set(card.object.id,[...(pairs.get(card.object.id)||[]),i]));
        for(const indexes of pairs.values()) {h.click(indexes[0]);h.click(indexes[1]);}
      } else if(['palavra-pecas','trilha-alfabeto','sequencia-magica'].includes(gameId)) {
        if(gameId==='sequencia-magica')while(timers.size)h.tick();
        const used=new Set(), options=c.bank||c.options;
        c.answer.forEach(value=>{const index=options.findIndex((option,i)=>(option.id||option)===value&&(gameId==='sequencia-magica'||!used.has(i)));used.add(index);h.click(index);});
        if(gameId==='palavra-pecas')get('confirm').onclick();
      } else h.click(c.options.findIndex(value=>(value.id||value)===c.answer));
    },
  };
  return h;
}

for(const game of games)for(const level of levels)test(`${game.title}: ${level} completes, records attempts once and restarts`,async()=>{
  const h=harness(game.id,level);await h.start();
  assert.equal(h.events[0].kind,'start');assert.equal(h.events[0].args[0],game.id);
  for(let i=0;i<2;i++) {
    h.solve();const attempts=h.events.filter(e=>e.kind==='round').length;
    h.get('confirm').onclick();assert.equal(h.events.filter(e=>e.kind==='round').length,attempts,'duplicate confirms ignored');
    assert.equal(h.get('next').hidden,false);h.get('next').onclick();
  }
  const finish=h.events.find(e=>e.kind==='finish');assert.equal(finish.status,'completed');assert.equal(finish.data.errors,0);assert.ok(finish.data.correct>0);assert.equal(finish.data.completedRounds,2);
  assert.equal(h.get('result').hidden,false);assert.equal(h.timers.size,0);
  h.get('again').onclick();assert.equal(h.get('setup').hidden,false);await h.start();assert.equal(h.events.filter(e=>e.kind==='start').length,2);
});

test('memory mismatches close and pending timers cannot alter an ended game',async()=>{
  const h=harness('pares-gatinho');await h.start();const c=h.challenge();
  const second=c.cards.findIndex(card=>card.object.id!==c.cards[0].object.id);
  h.click(0);h.click(second);assert.equal(h.events.at(-1).data.correct,false);assert.equal(h.timers.size,1);
  h.tick();assert.match(h.get('board').children[0].attrs['aria-label'],/fechada/);
  h.click(0);h.click(second);h.get('stop').onclick();assert.equal(h.timers.size,0);assert.equal(h.events.at(-1).status,'interrupted');
});

test('word pieces can be undone including repeated letters; sequence stops on hiding',async()=>{
  const h=harness('palavra-pecas','hard');await h.start();h.click(0);assert.equal(h.get('board').children[0].disabled,true);
  h.get('undo').onclick();assert.equal(h.get('board').children[0].disabled,false);h.solve();assert.equal(h.events.at(-1).data.correct,true);
  const sequence=harness('sequencia-magica');await sequence.start();assert.ok(sequence.get('board').hidden);
  sequence.document.hidden=true;sequence.handlers.visibilitychange();assert.equal(sequence.events.at(-1).status,'interrupted');assert.equal(sequence.events.at(-1).data.reason,'hidden');assert.equal(sequence.timers.size,0);
});

test('incorrect answers reveal feedback and never record duplicate responses',async()=>{
  const h=harness('jardim-letras');await h.start();const c=h.challenge(),wrong=c.options.findIndex(letter=>letter!==c.answer);
  h.click(wrong);h.get('board').children[wrong].onclick();assert.equal(h.events.filter(e=>e.kind==='round').length,1);assert.equal(h.events.at(-1).data.correct,false);assert.match(h.get('feedback').textContent,new RegExp(c.answer));
});
