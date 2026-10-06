import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';

test('game pages allow guest play without login or clinical persistence', async () => {
  const redirects=[];
  const main={setAttribute(){},removeAttribute(){}};
  const identity={textContent:''};
  const bar={
    className:'',
    setAttribute(){},
    append(){},
    querySelector:()=>identity,
    set innerHTML(value){this.html=value;},
  };
  const document={
    readyState:'complete',
    body:{prepend(){}},
    querySelector:selector=>selector==='main'?main:null,
    createElement:()=>bar,
    addEventListener(){},
  };
  const fetch=async()=>({ok:false,status:401,json:async()=>({error:'Entre para continuar.'})});
  const location={pathname:'/jogo-cerebro-feliz/index.html',assign:value=>redirects.push(value)};
  const window={
    addEventListener(){},
    setInterval(){},
    setTimeout(callback){callback();},
    requestAnimationFrame(callback){callback();return 1;},
    cancelAnimationFrame(){},
    matchMedia:()=>({matches:true}),
  };
  class MutationObserver { observe(){} }
  const context=vm.createContext({window,document,fetch,location,localStorage:{length:0,key(){},getItem(){},setItem(){},removeItem(){}},crypto:{randomUUID},performance:{now:()=>10},MutationObserver,URL,encodeURIComponent});

  vm.runInContext(readFileSync(new URL('../clinic.js',import.meta.url),'utf8'),context);
  const clinic=window.ReabilityClinic;
  await clinic.ready;

  assert.equal(redirects.length,0);
  assert.equal(clinic.getMode(),'guest');
  assert.equal(clinic.isProfessional(),false);
  assert.equal(clinic.getPatient().guest,true);
  assert.equal(clinic.getPatient().name,'Jogador livre');
  assert.doesNotThrow(()=>clinic.start('atencao-plena','facil'));
  assert.doesNotThrow(()=>clinic.round({correct:true}));
  assert.doesNotThrow(()=>clinic.finish({score:1}));
});
