import { alphabet, objects, categories } from './content.js';

export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i=result.length-1;i>0;i--) { const j=Math.floor(random()*(i+1)); [result[i],result[j]]=[result[j],result[i]]; }
  return result;
}
export function makeChallenge(id, level='easy', random=Math.random, previous=null) {
  const rank = { easy:0, medium:1, hard:2 }[level] ?? 0;
  const pick = list => list[Math.floor(random()*list.length)];
  const pool = objects.filter(item => item.id!==previous);
  const object = pick(pool);
  const choices = (correct, alternatives, count) => shuffle([correct,...shuffle(alternatives.filter(item=>item!==correct),random).slice(0,count-1)],random);
  const base = { object, id, level };
  switch (id) {
    case 'jardim-letras': return {...base, answer:object.word[0], options:choices(object.word[0],alphabet,[3,4,6][rank])};
    case 'palavra-pecas': {
      const words = pool.filter(item => /^[A-Z]+$/.test(item.word) && item.word.length >= 3 && item.word.length <= [4,6,10][rank]);
      const item=pick(words), letters=[...item.spelling];
      const missing=shuffle(letters.map((_,i)=>i),random).slice(0,[1,2,letters.length][rank]).sort((a,b)=>a-b);
      const bank=missing.map(i=>letters[i]);
      if(rank<2) bank.push(...shuffle(alphabet.filter(letter=>!bank.includes(letter)),random).slice(0,rank+2));
      return {...base,object:item,answer:missing.map(i=>letters[i]),missing,bank:shuffle(bank,random),letters};
    }
    case 'trilha-alfabeto': {
      const size=[3,5,7][rank], start=Math.floor(random()*(27-size));
      const answer=alphabet.slice(start,start+size);
      let options=shuffle(answer,random);
      if(options.join('')===answer.join('')) options=[...options.slice(1),options[0]];
      return {...base,answer,options};
    }
    case 'pares-gatinho': {
      const selected=shuffle(objects,random).slice(0,[3,4,6][rank]);
      return {...base,cards:shuffle(selected.flatMap(item=>[{object:item},{object:item}]),random)};
    }
    case 'olho-lince': return {...base,answer:object.id,options:shuffle([object,...shuffle(pool.filter(item=>item.id!==object.id),random).slice(0,[5,8,11][rank])],random)};
    case 'conta-brinca': {
      const answer=2+Math.floor(random()*[3,5,8][rank]);
      const distractors=shuffle(pool.filter(item=>item.id!==object.id),random).slice(0,[0,3,6][rank]);
      const items=shuffle([...Array(answer).fill(object),...distractors],random);
      const alternatives=Array.from({length:[5,8,11][rank]},(_,i)=>i+1);
      return {...base,answer,items,options:choices(answer,alternatives,[3,4,5][rank]).sort((a,b)=>a-b)};
    }
    case 'sequencia-magica': {
      const options=shuffle(objects,random).slice(0,[3,4,6][rank]);
      const sequence=Array.from({length:[2,3,5][rank]},()=>pick(options));
      return {...base,sequence,answer:sequence.map(item=>item.id),options};
    }
    case 'cada-coisa': {
      // The queen illustration depicts a person; avoid asking players to treat it as an object.
      const item=pick(pool.filter(item=>item.id!=='queen'));
      return {...base,object:item,answer:item.category,options:choices(item.category,Object.keys(categories),[3,4,5][rank])};
    }
    default: throw new Error(`Jogo desconhecido: ${id}`);
  }
}
