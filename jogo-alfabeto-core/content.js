export const ASSETS = '/assets/alphabet-kit';
export const alphabet = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
export const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
export const categories = { animals: 'Animais', food: 'Alimentos', nature: 'Plantas, céu e paisagens', transport: 'Transportes', things: 'Objetos e construções' };
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
  ['yo-yo','Ioiô','things'], ['igloo','Iglu','things'], ['quill','Pena de escrever','things'],
  ['x-ray','Radiografia','things'], ['key','Chave','things'], ['ball','Bola','things'],
  ['hat','Chapéu','things'], ['queen','Rainha','things'], ['kite','Pipa','things'],
  ['pencil','Lápis','things'], ['gift','Presente','things'], ['vase','Vaso','things'],
  ['xylophone','Xilofone','things'], ['notebook','Caderno','things'],
];
export const objects = entries.map(([id, name, category]) => ({ id, name, category, word: normalize(name), spelling: name.toLocaleUpperCase('pt-BR'), image: `${ASSETS}/objects/${id}.svg` }));
export const letterImage = (letter, style = 'colored') => `${ASSETS}/letters/${style}/${letter}.svg`;
export const games = [
  { id:'jardim-letras', slug:'jogo-jardim-letras', title:'Jardim das Letras', skill:'Letras e sons iniciais', tag:'Linguagem', color:'#a6d991', background:1, images:['apple','cat'], letters:['A','G'], description:'Uma imagem, uma descoberta. Encontre a primeira letra de cada palavra com a ajuda do gatinho.', steps:['Observe a figura e o nome em português.', 'Escolha a primeira letra da palavra.', 'Confira a resposta e siga para a próxima descoberta.'] },
  { id:'palavra-pecas', slug:'jogo-palavra-pecas', title:'Palavra em Peças', skill:'Escrita e organização', tag:'Palavras', color:'#ffc77c', background:2, images:['ball','flower'], letters:['B','O'], description:'Transforme letras coloridas em palavras. Preencha os espaços vazios e confira o nome da figura.', steps:['Observe a figura. Se precisar, toque em Mostrar nome para receber uma dica.', 'Preencha somente os espaços vazios, da esquerda para a direita. As letras com acento também são peças.', 'Use Desfazer para trocar a última peça. Quando tudo estiver preenchido, toque em Conferir palavra.'] },
  { id:'trilha-alfabeto', slug:'jogo-trilha-alfabeto', title:'Trilha do Alfabeto', skill:'Ordem e planejamento', tag:'Alfabeto', color:'#92cafa', background:3, images:['rocket'], letters:['A','B','C'], description:'Organize todas as letras do trecho em ordem alfabética, da primeira à última.', steps:['Observe o trecho indicado e todas as letras disponíveis.', 'Toque em todas as letras em ordem alfabética. Cada toque preenche uma posição numerada.', 'Revise a trilha. Você pode Desfazer a última escolha antes de tocar em Conferir ordem.'] },
  { id:'pares-gatinho', slug:'jogo-pares-gatinho', title:'Pares do Gatinho', skill:'Memória visual', tag:'Memória', color:'#d1b2fa', background:4, images:['cat','dog','panda'], letters:[], description:'Vire duas cartas por vez e encontre todos os pares de figuras iguais.', steps:['Escolha uma carta e depois uma segunda carta.', 'Se forem diferentes, observe com calma e toque em Fechar estas cartas para tentar outro par.', 'Os pares iguais permanecem abertos. Encontre todos para completar o tabuleiro.'] },
  { id:'olho-lince', slug:'jogo-olho-lince', title:'Olho de Lince', skill:'Atenção e busca visual', tag:'Atenção', color:'#ffc1d7', background:1, images:['frog','umbrella','sun'], letters:[], description:'Entre tantas figuras, uma é especial. Observe o modelo e encontre a imagem igual no painel.', steps:['Observe a figura no cartão de referência.', 'Procure a mesma figura entre as opções.', 'Toque na sua escolha e confira o resultado.'] },
  { id:'conta-brinca', slug:'jogo-conta-brinca', title:'Conta e Brinca', skill:'Contagem e percepção', tag:'Números', color:'#f5db7c', background:2, images:['orange','apple','grape'], letters:[], description:'Veja o modelo e conte as figuras iguais a ele dentro da área de contagem.', steps:['Observe o modelo, que fica acima do quadro.', 'Conte somente as figuras iguais ao modelo dentro da área de contagem. O modelo fica fora da contagem.', 'Toque no número que representa a quantidade encontrada.'] },
  { id:'sequencia-magica', slug:'jogo-sequencia-magica', title:'Sequência Mágica', skill:'Memória e sequência', tag:'Sequências', color:'#9be2dc', background:3, images:['moon','star','sun'], letters:[], description:'Observe todas as figuras e depois repita a sequência inteira, na mesma ordem.', steps:['Toque em Ver sequência quando estiver pronto. Observe todas as figuras, uma de cada vez.', 'Na sua vez, preencha todas as posições na ordem em que as figuras apareceram. A mesma figura pode se repetir.', 'Revise sua sequência. Use Desfazer para corrigir e Conferir sequência para enviar a resposta completa.'] },
  { id:'cada-coisa', slug:'jogo-cada-coisa', title:'Cada Coisa no seu Lugar', skill:'Categorias e associação', tag:'Associação', color:'#b7d8fa', background:4, images:['train','elephant','mango'], letters:[], description:'Observe a figura e escolha o grupo que combina com ela. Os exemplos ajudam a reconhecer cada grupo.', steps:['Observe a figura e leia o nome apresentado.', 'Compare os grupos. Cada opção mostra exemplos do que faz parte dela.', 'Escolha um único grupo: animais, alimentos, plantas e paisagens, transportes ou objetos e construções.'] },
].map((game, index) => ({ ...game, number: String(index + 10).padStart(2,'0') }));
