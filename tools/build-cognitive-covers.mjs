import { mkdir, readFile, writeFile } from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const output=new URL('assets/games/collection/',root);
await mkdir(output,{recursive:true});
async function illustration(name,prefix,x,y,width,height) {
  let svg=await readFile(new URL(`assets/alphabet-kit/objects/${name}.svg`,root),'utf8');
  svg=svg.replace(/<\?xml[^>]*\?>\s*/,'').replace(/cls-(\d+)/g,`${prefix}-cls-$1`)
    .replace(/id="([^"]+)"/g,(_,id)=>`id="${prefix}-${id}"`)
    .replace(/url\(#([^)]+)\)/g,(_,id)=>`url(#${prefix}-${id})`)
    .replace(/xlink:href="#([^"]+)"/g,(_,id)=>`xlink:href="#${prefix}-${id}"`)
    .replace('<svg ',`<svg x="${x}" y="${y}" width="${width}" height="${height}" `);
  return `<g filter="url(#ink)">${svg}</g>`;
}
const defs=`<defs>
  <linearGradient id="paper" x2="1" y2="1"><stop stop-color="#fcfaf2"/><stop offset="1" stop-color="#e7e5d8"/></linearGradient>
  <linearGradient id="navy" x2="1" y2="1"><stop stop-color="#15374a"/><stop offset="1" stop-color="#071d30"/></linearGradient>
  <filter id="ink"><feColorMatrix type="saturate" values=".23"/></filter>
  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#e6dfc2" stroke-opacity=".045"/></pattern>
</defs>`;
const frame=`<rect width="960" height="540" fill="url(#navy)"/><rect width="960" height="540" fill="url(#grid)"/>
  <rect x="35" y="35" width="890" height="470" rx="24" fill="none" stroke="#bbb48a" stroke-opacity=".25"/>
  <path d="M64 83h42M64 83v42M896 457h-42M896 457v-42" fill="none" stroke="#b8ad78" stroke-width="2"/>
  <circle cx="850" cy="99" r="4" fill="#baa975"/>`;
const tag=(value,y=466)=>`<text x="480" y="${y}" text-anchor="middle" fill="#d4d0ba" font-family="Segoe UI,Arial,sans-serif" font-size="13" letter-spacing="4">${value}</text>`;
const wrap=(title,content)=>`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 960 540" role="img" aria-label="${title}">${defs}${frame}${content}</svg>`;
const colors=wrap('Cores e Regras',`
  <text x="92" y="107" fill="#c1b58c" font-family="Segoe UI,Arial,sans-serif" font-size="12" letter-spacing="3">ATENÇÃO E FLEXIBILIDADE</text>
  <rect x="150" y="151" width="264" height="238" rx="21" fill="url(#paper)" transform="rotate(-5 282 270)"/>
  <rect x="439" y="151" width="264" height="238" rx="21" fill="url(#paper)" transform="rotate(5 571 270)"/>
  <circle cx="282" cy="261" r="61" fill="#1461c9"/><circle cx="282" cy="261" r="73" fill="none" stroke="#1461c9" stroke-opacity=".15"/>
  <path d="M571 192L644 324H498Z" fill="#148151"/>
  <path d="M260 365h44M549 365h44" stroke="#a99b69" stroke-width="2"/>
  <g opacity=".55">${await illustration('leaf','leaf',745,309,85,105)}</g>
  <g opacity=".55" transform="rotate(18 774 205)">${await illustration('pencil','pencil',748,112,57,172)}</g>
  ${tag('OBSERVE · ASSOCIE · RESPONDA')}`);
const back=(x,angle)=>`<g transform="rotate(${angle} ${x+77} 270)"><rect x="${x}" y="163" width="154" height="214" rx="13" fill="#193c4f" stroke="#7b816d"/><rect x="${x+10}" y="173" width="134" height="194" rx="8" fill="none" stroke="#d4c894" stroke-opacity=".45"/><path d="M${x+58} 238h40v48h-40zM${x+66} 246h40v48h-40z" stroke="#c5b786" fill="none"/><text x="${x+77}" y="343" text-anchor="middle" font-family="Arial,sans-serif" font-size="8" letter-spacing="2.5" fill="#d8d0ad">REABILITY</text></g>`;
const face=async(x,angle,name,prefix)=>`<g transform="rotate(${angle} ${x+77} 270)"><rect x="${x}" y="163" width="154" height="214" rx="13" fill="url(#paper)"/><rect x="${x+10}" y="173" width="134" height="194" rx="8" fill="none" stroke="#acb1a1" stroke-opacity=".5"/>${await illustration(name,prefix,x+30,204,94,132)}<circle cx="${x+77}" cy="351" r="3" fill="#a99d74"/></g>`;
const memory=wrap('Memória Visual',`
  <text x="92" y="107" fill="#c1b58c" font-family="Segoe UI,Arial,sans-serif" font-size="12" letter-spacing="3">FORMAS DO COTIDIANO</text>
  ${back(127,-9)}${await face(311,-3,'leaf','leaf')}${await face(495,4,'key','key')}${back(679,10)}
  ${tag('PERCEBA · LEMBRE · ENCONTRE')}`);
await writeFile(new URL('cores-e-regras.svg',output),colors);
await writeFile(new URL('memoria-visual.svg',output),memory);
console.log('Built two self-contained collection covers from the supplied illustrations.');
