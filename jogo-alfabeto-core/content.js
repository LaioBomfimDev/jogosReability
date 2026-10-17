export const ASSETS = '/assets/alphabet-kit';
export const alphabet = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
export const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
export const categories = { animals: 'Animais', food: 'Alimentos', nature: 'Natureza', transport: 'Transportes', things: 'Objetos' };
const entries = [
  ['ant','Formiga','animals'], ['panda','Panda','animals'], ['zebra','Zebra','animals'],
  ['octopus','Polvo','animals'], ['lion','Leão','animals'], ['elephant','Elefante','animals'],
  ['unicorn','Unicórnio','animals'], ['whale','Baleia','animals'], ['dog','Cachorro','animals'],
  ['bear','Urso','animals'], ['frog','Sapo','animals'], ['cat','Gato','animals'],
  ['grape','Uva','food'], ['mango','Manga','food'], ['juice','Suco','food'],
  ['donut','Rosquinha','food'], ['ice-cream','Sorvete','food'], ['egg','Ovo','food'],
  ['jelly','Geleia','food'], ['watermelone','Melancia','food'], ['apple','Maçã','food'], ['orange','Laranja','food'],
  ['volcano','Vulcão','nature'], ['rainbow','Arco-íris','nature'], ['leaf','Folha','nature'],
  ['star','Estrela','nature'], ['sun','Sol','nature'], ['flower','Flor','nature'],
  ['nest','Ninho','nature'], ['tree','Árvore','nature'], ['moon','Lua','nature'],
  ['train','Trem','transport'], ['yacht','Iate','transport'], ['car','Carro','transport'], ['rocket','Foguete','transport'],
  ['zipper','Zíper','things'], ['house','Casa','things'], ['umbrella','Guarda-chuva','things'],
  ['yo-yo','Ioiô','things'], ['igloo','Iglu','things'], ['quill','Pena','things'],
  ['x-ray','Raio X','things'], ['key','Chave','things'], ['ball','Bola','things'],
  ['hat','Chapéu','things'], ['queen','Rainha de brinquedo','things'], ['kite','Pipa','things'],
  ['pencil','Lápis','things'], ['gift','Presente','things'], ['vase','Vaso','things'],
  ['xylophone','Xilofone','things'], ['notebook','Caderno','things'],
];
export const objects = entries.map(([id, name, category]) => ({ id, name, category, word: normalize(name), image: `${ASSETS}/objects/${id}.svg` }));
export const letterImage = (letter, style = 'colored') => `${ASSETS}/letters/${style}/${letter}.svg`;
export const games = [
  { id:'jardim-letras', slug:'jogo-jardim-letras', title:'Jardim das Letras', skill:'Letras e sons iniciais', tag:'Linguagem', color:'#a6d991', background:1, images:['apple','cat'], letters:['A','G'], description:'Uma imagem, uma descoberta. Encontre a primeira letra de cada palavra com a ajuda do gatinho.', steps:['Observe a figura e o nome em português.', 'Escolha a primeira letra da palavra.', 'Confira a resposta e siga para a próxima descoberta.'] },
  { id:'palavra-pecas', slug:'jogo-palavra-pecas', title:'Palavra em Peças', skill:'Escrita e organização', tag:'Palavras', color:'#ffc77c', background:2, images:['ball','flower'], letters:['B','O'], description:'Transforme letras coloridas em palavras. Toque nas peças para completar o nome de cada figura.', steps:['Descubra qual palavra representa a imagem.', 'Toque nas letras para preencher os espaços da esquerda para a direita.', 'Use Desfazer para trocar uma peça e Confirmar para conferir.'] },
  { id:'trilha-alfabeto', slug:'jogo-trilha-alfabeto', title:'Trilha do Alfabeto', skill:'Ordem e planejamento', tag:'Alfabeto', color:'#92cafa', background:3, images:['rocket'], letters:['A','B','C'], description:'As letras saíram do caminho! Organize cada trecho do alfabeto e ajude o gatinho a seguir em frente.', steps:['Observe as letras que apareceram fora de ordem.', 'Toque nelas seguindo a ordem do alfabeto.', 'Confira sua trilha e experimente um novo trecho.'] },
  { id:'pares-gatinho', slug:'jogo-pares-gatinho', title:'Pares do Gatinho', skill:'Memória visual', tag:'Memória', color:'#d1b2fa', background:4, images:['cat','dog','panda'], letters:[], description:'Vire as cartas, descubra as figuras e encontre todos os pares neste jardim de memórias.', steps:['Vire duas cartas por vez.', 'Se forem diferentes, memorize suas posições antes de fecharem.', 'Encontre todos os pares para completar o tabuleiro.'] },
  { id:'olho-lince', slug:'jogo-olho-lince', title:'Olho de Lince', skill:'Atenção e busca visual', tag:'Atenção', color:'#ffc1d7', background:1, images:['frog','umbrella','sun'], letters:[], description:'Entre tantas figuras, uma é especial. Observe o modelo e encontre a imagem igual no painel.', steps:['Observe a figura no cartão de referência.', 'Procure a mesma figura entre as opções.', 'Toque na sua escolha e confira o resultado.'] },
  { id:'conta-brinca', slug:'jogo-conta-brinca', title:'Conta e Brinca', skill:'Contagem e percepção', tag:'Números', color:'#f5db7c', background:2, images:['orange','apple','grape'], letters:[], description:'Frutas, bichinhos e brinquedos se misturaram. Conte apenas a figura indicada e escolha a quantidade.', steps:['Veja qual figura você precisa contar.', 'Conte somente as figuras iguais ao modelo.', 'Escolha o número correspondente. Sem pressa!'] },
  { id:'sequencia-magica', slug:'jogo-sequencia-magica', title:'Sequência Mágica', skill:'Memória e sequência', tag:'Sequências', color:'#9be2dc', background:3, images:['moon','star','sun'], letters:[], description:'Observe as figuras que aparecem uma a uma. Depois, reconstrua a sequência na mesma ordem.', steps:['Assista à sequência de figuras até o fim.', 'Quando aparecer Sua vez, toque nas figuras na mesma ordem.', 'Confira sua resposta. Você pode ajustar a velocidade antes de começar.'] },
  { id:'cada-coisa', slug:'jogo-cada-coisa', title:'Cada Coisa no seu Lugar', skill:'Categorias e associação', tag:'Associação', color:'#b7d8fa', background:4, images:['train','elephant','mango'], letters:[], description:'O que combina com o quê? Descubra a família de cada figura e organize esse mundo de descobertas.', steps:['Observe a figura que o gatinho trouxe.', 'Escolha a categoria à qual ela pertence.', 'Conheça animais, alimentos, natureza, transportes e objetos.'] },
].map((game, index) => ({ ...game, number: String(index + 10).padStart(2,'0') }));
