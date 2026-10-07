export const CATEGORIES = [
  {
    id: "mixed",
    name: "Todas as categorias",
    icon: "✦",
    description: "Uma jornada com desafios variados.",
  },
  {
    id: "images",
    name: "Criação de imagens",
    icon: "◈",
    description: "Escreva prompts e direções de arte.",
  },
  {
    id: "social",
    name: "Redes sociais",
    icon: "◎",
    description: "Crie legendas, carrosséis e campanhas.",
  },
  {
    id: "video",
    name: "Vídeos",
    icon: "▷",
    description: "Escreva roteiros que contam histórias.",
  },
  {
    id: "motion",
    name: "Motion design",
    icon: "⌁",
    description: "Planeje movimentos e animações.",
  },
  {
    id: "review",
    name: "Revisão de textos",
    icon: "¶",
    description: "Corrija e melhore a escrita.",
  },
  {
    id: "random",
    name: "Aleatórios",
    icon: "◇",
    description: "Resolva problemas criativos inesperados.",
  },
];

export const SLOTS = [
  ["helmet", "Capacete"],
  ["chest", "Peitoral"],
  ["boots", "Botas"],
  ["gloves", "Luvas"],
  ["shoulders", "Ombreiras"],
  ["belt", "Cinturão"],
  ["cape", "Capa"],
  ["shield", "Escudo"],
  ["weapon", "Arma"],
  ["amulet", "Amuleto"],
];

// Every track has ten authored briefs. The server selects the same immutable brief.
const BRIEFS = {
  images: [
    [
      "Uma imagem, uma ideia",
      "Escreva um prompt para criar a imagem de um gato laranja dormindo em uma poltrona azul.",
      [
        "Diga qual é o assunto e onde ele está.",
        "Escolha um estilo visual e descreva a luz.",
      ],
    ],
    [
      "Café da manhã",
      "Crie um prompt para uma foto de uma xícara de café sobre uma mesa de madeira, para uma cafeteria acolhedora.",
      [
        "Inclua enquadramento e iluminação.",
        "Mantenha a xícara como destaque.",
      ],
    ],
    [
      "Pequeno mundo",
      "Descreva uma ilustração de uma casa na árvore para a capa de um livro infantil.",
      ["Defina cores e clima.", "Reserve espaço para inserir o título depois."],
    ],
    [
      "Produto em foco",
      "Escreva a direção de uma imagem vertical 4:5 para uma garrafa reutilizável verde. Público: pessoas que usam bicicleta na cidade.",
      [
        "Indique cenário, materiais e composição.",
        "Deixe área livre para a chamada, sem pedir texto dentro da imagem.",
        "Evite alegações ambientais sem comprovação.",
      ],
    ],
    [
      "Uma coleção coerente",
      "Crie três prompts de imagens para uma campanha de uma livraria: descoberta, leitura e troca de livros.",
      [
        "Mantenha paleta e estilo entre as três imagens.",
        "Varie a cena de cada uma.",
        "Defina formato e uso de cada peça.",
      ],
    ],
    [
      "Mesma ideia, dois formatos",
      "Planeje a arte de um festival fictício de jazz para versões horizontal 16:9 e vertical 9:16.",
      [
        "Descreva hierarquia e iluminação.",
        "Explique como recompor sem cortar o assunto.",
        "Separe arte e tipografia.",
      ],
    ],
    [
      "Direção de arte inclusiva",
      "Crie uma campanha visual de uma biblioteca acessível, com três cenas e pessoas em situações cotidianas.",
      [
        "Mostre acessibilidade sem estereótipos.",
        "Defina continuidade de personagens e linguagem visual.",
        "Preveja recortes e contraste para texto.",
      ],
    ],
    [
      "O produto não pode mudar",
      "Planeje a produção de imagens de um tênis branco com detalhes azuis. A forma, o logotipo autorizado e as cores devem permanecer fiéis à referência fornecida na produção.",
      [
        "Escreva o prompt e as restrições de preservação.",
        "Descreva uma checagem de fidelidade.",
        "Explique o que fazer se a geração alterar o produto.",
      ],
    ],
    [
      "Campanha em sistema",
      "Crie a direção de seis imagens para uma marca fictícia de mobiliário modular em espaços pequenos.",
      [
        "Defina uma linguagem comum e seis cenas distintas.",
        "Considere escala, ergonomia e consistência do produto.",
        "Inclua formatos e critérios de aprovação.",
      ],
    ],
    [
      "A direção impossível",
      "Em até 450 palavras, proponha um sistema visual para um museu de ciência: 6 imagens coerentes, 3 formatos por imagem e duas faixas etárias. A campanha deve ser executável em um dia.",
      [
        "Forneça prompt mestre, variações e restrições.",
        "Planeje consistência, acessibilidade e revisão humana.",
        "Priorize entregas e explicite os compromissos de prazo.",
        "Inclua critérios objetivos para aceitar ou refazer uma imagem.",
      ],
    ],
  ],
  social: [
    [
      "O primeiro post",
      "Escreva uma legenda curta para uma cafeteria que acabou de abrir no bairro.",
      ["Use um tom acolhedor.", "Convide a pessoa a conhecer o lugar."],
    ],
    [
      "Uma dica útil",
      "Escreva um post com uma dica simples para organizar a mesa de trabalho.",
      ["Dê uma ação prática.", "Termine com uma pergunta relacionada ao tema."],
    ],
    [
      "Convite para ler",
      "Escreva uma legenda para convidar pessoas a uma troca de livros no sábado às 10h, na Praça das Flores.",
      [
        "Preserve local, dia e horário.",
        "Diga para levar um livro em bom estado.",
      ],
    ],
    [
      "Carrossel que ensina",
      "Crie um carrossel de 5 telas ensinando iniciantes a cuidar de uma planta em vaso.",
      [
        "Escreva o texto de cada tela.",
        "Use abertura clara e uma ação final.",
        "Evite recomendações universais sobre rega sem considerar a planta.",
      ],
    ],
    [
      "Uma marca, duas vozes",
      "Divulgue uma oficina fictícia de fotografia com celular para iniciantes, em uma legenda informal e outra profissional.",
      [
        "Mantenha a mesma proposta nas duas versões.",
        "Ajuste vocabulário ao público.",
        "Não invente preço, data ou benefícios garantidos.",
      ],
    ],
    [
      "Planeje uma semana",
      "Monte três posts para uma padaria: apresentação, conteúdo útil e convite à visita.",
      [
        "Dê objetivo, texto e ideia visual para cada post.",
        "Mantenha coerência de voz.",
        "Explique o que observar para avaliar os posts.",
      ],
    ],
    [
      "Comentário difícil",
      "Uma loja recebeu o comentário: “Meu pedido atrasou e ninguém responde”. Escreva a resposta pública e a mensagem privada de acompanhamento.",
      [
        "Acolha sem culpar o cliente.",
        "Não peça dados pessoais em público.",
        "Explique próximo passo sem prometer um prazo desconhecido.",
      ],
    ],
    [
      "Um teste de verdade",
      "Crie duas versões de um post para divulgar uma aula de desenho e planeje um teste entre elas.",
      [
        "Mude uma variável principal.",
        "Defina hipótese e indicador alinhado ao objetivo.",
        "Explique como evitar concluir só pelo número de curtidas.",
      ],
    ],
    [
      "Lançamento em três atos",
      "Planeje uma campanha de lançamento para um clube de leitura: descoberta, interesse e inscrição.",
      [
        "Escreva uma peça por etapa e explique a conexão.",
        "Defina público, chamada e medição.",
        "Inclua uma adaptação acessível para os visuais.",
      ],
    ],
    [
      "A campanha final",
      "Em até 450 palavras, crie um plano de 7 dias para uma feira de produtores locais com equipe de duas pessoas e sem mídia paga.",
      [
        "Entregue calendário, três textos prontos e direção visual.",
        "Defina prioridades, público e indicadores.",
        "Inclua atendimento a dúvidas e acessibilidade.",
        "Explique como adaptar o plano se houver alcance alto e poucas visitas.",
      ],
    ],
  ],
  video: [
    [
      "Uma cena simples",
      "Escreva um roteiro de 10 segundos mostrando uma pessoa preparando um chá.",
      ["Descreva o que aparece na tela.", "Dê começo e fim à cena."],
    ],
    [
      "Mostre o detalhe",
      "Escreva um vídeo curto apresentando um caderno artesanal.",
      ["Descreva três planos.", "Inclua uma frase de encerramento."],
    ],
    [
      "Convite em movimento",
      "Crie um roteiro de 15 segundos convidando amigos para um piquenique no domingo.",
      ["Divida em início, meio e fim.", "Inclua uma fala ou texto curto."],
    ],
    [
      "Tutorial enxuto",
      "Roteirize um tutorial vertical de 30 segundos para organizar uma mochila.",
      [
        "Indique tempos, imagem e áudio.",
        "Faça a sequência ser executável.",
        "Inclua legendas ou texto de apoio.",
      ],
    ],
    [
      "História sem fala",
      "Roteirize 20 segundos sobre alguém que perde um ônibus e decide caminhar por um parque.",
      [
        "Conte a história sem narração.",
        "Indique enquadramentos e transições.",
        "Use som para apoiar a mudança de clima.",
      ],
    ],
    [
      "Antes e depois honesto",
      "Crie um vídeo de 30 segundos mostrando a organização de uma pequena estante.",
      [
        "Indique planos e duração.",
        "Mostre o processo sem sugerir transformação instantânea.",
        "Inclua abertura e conclusão.",
      ],
    ],
    [
      "Gravação com limites",
      "Planeje um vídeo de 45 segundos de uma livraria com um celular, uma pessoa e luz natural.",
      [
        "Entregue roteiro com tempos e lista de planos.",
        "Considere ruído, continuidade e limitações de luz.",
        "Inclua versão compreensível sem áudio.",
      ],
    ],
    [
      "Uma história em duas telas",
      "Adapte um mesmo vídeo de uma oficina de cerâmica para 16:9 e 9:16.",
      [
        "Escreva o roteiro base e as adaptações de enquadramento.",
        "Preserve a ação principal e áreas de texto.",
        "Defina ritmo e duração final.",
      ],
    ],
    [
      "Vinte segundos, uma virada",
      "Roteirize um anúncio de 20 segundos para conserto de bicicletas. Ele deve ter uma pequena virada narrativa.",
      [
        "Detalhe tempos, ações, falas e som.",
        "Mantenha a mensagem do serviço clara.",
        "Inclua fechamento e uma alternativa de produção mais simples.",
      ],
    ],
    [
      "O curta final",
      "Em até 450 palavras, planeje um filme de 60 segundos sobre a reabertura de um cinema de bairro. Uma diária, dois atores e uma locação.",
      [
        "Entregue roteiro cronometrado e lista de planos.",
        "Preveja som, continuidade e versão legendada.",
        "Inclua versões de 15 e 30 segundos.",
        "Explique prioridades e plano alternativo para chuva.",
      ],
    ],
  ],
  motion: [
    [
      "Faça a bola entrar",
      "Descreva uma animação de 3 segundos em que uma bola entra na tela e para no centro.",
      ["Diga de onde ela vem.", "Explique como ela desacelera ao parar."],
    ],
    [
      "Um título aparece",
      "Planeje a entrada da palavra “Olá” em uma animação de 4 segundos.",
      [
        "Descreva posição, movimento e tempo de leitura.",
        "Escolha um fundo que permita ler bem.",
      ],
    ],
    [
      "O botão responde",
      "Descreva uma pequena animação de confirmação ao apertar um botão “Salvar”.",
      ["Mostre a mudança de estado.", "Mantenha o texto legível."],
    ],
    [
      "Três passos",
      "Planeje uma animação de 8 segundos explicando: escolher, personalizar e finalizar um cartão.",
      [
        "Divida a duração entre os passos.",
        "Defina transições e hierarquia.",
        "Evite elementos demais competindo.",
      ],
    ],
    [
      "Loop contínuo",
      "Descreva um loop de 6 segundos com três formas geométricas.",
      [
        "Explique a volta ao primeiro quadro.",
        "Defina ritmo e aceleração.",
        "Mantenha uma linguagem visual consistente.",
      ],
    ],
    [
      "Marca em movimento",
      "Planeje uma vinheta de 5 segundos para uma marca fictícia de papelaria chamada Traço.",
      [
        "Defina início, transformação e assinatura.",
        "Reserve tempo para leitura do nome.",
        "Explique a relação do movimento com a marca.",
      ],
    ],
    [
      "Dados que se movem",
      "Planeje um gráfico animado comparando 20, 35 e 50 inscrições em três meses.",
      [
        "Preserve escala e valores.",
        "Defina ordem e duração das entradas.",
        "Inclua alternativa estática para redução de movimento.",
      ],
    ],
    [
      "Movimento acessível",
      "Redesenhe uma abertura com flashes e zooms rápidos para ser mais confortável.",
      [
        "Especifique movimentos, duração e transições.",
        "Preserve a identidade sem flashes.",
        "Inclua versão com movimento reduzido e leitura suficiente.",
      ],
    ],
    [
      "Um sistema de transições",
      "Crie três transições para uma série educativa: mudança de tema, exemplo e conclusão.",
      [
        "Defina regras de duração, curvas e direção.",
        "Diferencie funções mantendo unidade.",
        "Considere telas pequenas e textos longos.",
      ],
    ],
    [
      "A sequência final",
      "Em até 450 palavras, planeje uma peça de motion de 30 segundos sobre o ciclo de um livro: criação, impressão, leitura e troca.",
      [
        "Entregue storyboard textual cronometrado.",
        "Defina transições, curvas, som e estilo.",
        "Inclua versões 16:9, 9:16 e com movimento reduzido.",
        "Explique como produzir com poucos elementos reutilizáveis.",
      ],
    ],
  ],
  review: [
    [
      "Arrume a frase",
      "Corrija a frase: “Os aluno chegou cedo para a aula.”",
      ["Preserve o sentido.", "Explique a correção em uma frase."],
    ],
    [
      "Um convite claro",
      "Revise: “Venha conhecer nossa loja temos livros cadernos e canetas esperamos você”.",
      ["Corrija a pontuação.", "Mantenha um tom convidativo."],
    ],
    [
      "Concordância em dia",
      "Revise: “As nova oficinas começa amanhã e as inscrição está aberta.”",
      ["Corrija a concordância.", "Não acrescente informações."],
    ],
    [
      "Corte o excesso",
      "Reescreva com clareza: “Gostaríamos de estar informando que, neste presente momento, estamos realizando o início das inscrições para a oficina.”",
      [
        "Reduza a redundância.",
        "Preserve a informação.",
        "Explique uma escolha editorial.",
      ],
    ],
    [
      "Resolva a ambiguidade",
      "Revise: “Ana falou com Beatriz sobre seu projeto.” O projeto é de Beatriz.",
      [
        "Elimine a ambiguidade.",
        "Preserve as duas pessoas e a ação.",
        "Explique por que a versão está mais clara.",
      ],
    ],
    [
      "Tom profissional",
      "Reescreva: “Você preencheu tudo errado. Manda de novo ou não vai dar.” É uma mensagem de suporte sobre um formulário incompleto.",
      [
        "Seja respeitoso e objetivo.",
        "Dê um próximo passo.",
        "Não invente quais campos faltam.",
      ],
    ],
    [
      "Não invente evidência",
      "Revise: “Nosso curso é o melhor do país e garante emprego para todos em 30 dias.” Não há dados que sustentem essas afirmações.",
      [
        "Remova garantias e comparações sem fundamento.",
        "Preserve uma apresentação comercial honesta.",
        "Liste quais alegações precisariam de evidência.",
      ],
    ],
    [
      "Atenção aos fatos",
      "Revise: “O evento ocorre na sexta, 12 de maio, às 14h. As portas abrem às 15h.” O ano não foi informado.",
      [
        "Aponte a contradição de horários.",
        "Não adivinhe o ano nem o dia da semana.",
        "Entregue uma versão com pendências claramente marcadas.",
      ],
    ],
    [
      "Preserve a voz",
      "Edite: “Eu gosto da praça. Gosto do banco torto, da árvore grande, do barulho. A praça é tipo um abraço, sabe? E aí vão reformar tudo e eu fico pensando se ainda vai ser minha praça.”",
      [
        "Melhore fluidez sem apagar a voz pessoal.",
        "Preserve a metáfora e a dúvida final.",
        "Explique duas intervenções e algo que decidiu manter.",
      ],
    ],
    [
      "A edição final",
      "Em até 450 palavras, revise este anúncio e apresente uma nota editorial: “A biblioteca vai reabrir dia 8, segunda-feira. Depois de 2 anos fechado, oferecemos acesso gratuito para todos, menos quem não tem cadastro. Temos mais de 10 mil títulos, a maior coleção da cidade! Cadastre-se online no balcão, das 9h às 18h. A inauguração começa às 19h.”",
      [
        "Entregue um texto publicável com pendências sinalizadas.",
        "Corrija linguagem e identifique conflitos de acesso, datas e horários.",
        "Não confirme ranking, quantidade ou data sem fonte.",
        "Explique o que precisa ser validado antes da publicação.",
      ],
    ],
  ],
  random: [
    [
      "Dê um nome",
      "Crie um nome e uma frase curta para um clube de troca de livros.",
      [
        "Faça o nome combinar com a proposta.",
        "Explique sua ideia em uma frase.",
      ],
    ],
    [
      "Outro uso",
      "Proponha dois usos criativos para uma caixa de papelão vazia.",
      ["Descreva como fazer cada um.", "Use materiais fáceis de encontrar."],
    ],
    [
      "Um pequeno convite",
      "Escreva um convite de até 40 palavras para uma noite de jogos entre amigos.",
      ["Use um tom divertido.", "Deixe espaços para dia e local."],
    ],
    [
      "Explique de outro jeito",
      "Explique o que é uma senha forte para alguém que está aprendendo a usar a internet.",
      [
        "Use uma analogia simples.",
        "Inclua orientações práticas.",
        "Não peça que a pessoa compartilhe uma senha real.",
      ],
    ],
    [
      "Uma experiência melhor",
      "Proponha três melhorias para uma fila de uma pequena feira de livros.",
      [
        "Considere organização e comunicação.",
        "Inclua acessibilidade.",
        "Escolha uma prioridade e justifique.",
      ],
    ],
    [
      "Escolhas com limite",
      "Uma equipe tem duas horas para divulgar uma oficina. Proponha um plano com três ações.",
      [
        "Ordene por prioridade.",
        "Distribua o tempo.",
        "Diga o que deixará para depois e por quê.",
      ],
    ],
    [
      "O briefing mudou",
      "Uma exposição planejada ao ar livre precisa ir para uma sala pequena. Refaça o conceito mantendo a ideia de exploração.",
      [
        "Adapte circulação e sinalização.",
        "Considere acessibilidade.",
        "Explique o que preservar e o que simplificar.",
      ],
    ],
    [
      "Duas ideias em conflito",
      "Uma equipe quer uma campanha divertida; outra quer uma campanha séria para divulgar doação de livros. Proponha uma solução.",
      [
        "Reconheça as duas necessidades.",
        "Entregue um conceito e um texto de exemplo.",
        "Defina como validar a proposta com o público.",
      ],
    ],
    [
      "Resolva o imprevisto",
      "Um evento de criação terá metade do orçamento e o dobro de participantes. Replaneje a experiência.",
      [
        "Priorize o essencial.",
        "Proponha materiais e dinâmica viáveis.",
        "Inclua comunicação, acessibilidade e um plano de contingência.",
      ],
    ],
    [
      "O desafio da guilda",
      "Em até 450 palavras, crie uma experiência de 45 minutos que reúna desenho, escrita e movimento para 30 pessoas com idades e necessidades diferentes. Equipe: duas pessoas; materiais: papel e canetas.",
      [
        "Entregue programação com tempos e instruções claras.",
        "Inclua alternativas de participação e acessibilidade.",
        "Preveja atraso, pouca adesão e falta de material.",
        "Defina um jeito simples de avaliar a experiência e melhorá-la.",
      ],
    ],
  ],
};

const MIX = [
  "images",
  "social",
  "review",
  "video",
  "motion",
  "random",
  "social",
  "images",
  "video",
  "random",
];
export const RUBRIC = [
  { id: "brief", label: "Atendimento ao pedido", weight: 0.35 },
  { id: "clarity", label: "Clareza", weight: 0.25 },
  { id: "technique", label: "Técnica", weight: 0.25 },
  { id: "creativity", label: "Adequação criativa", weight: 0.15 },
];
export function difficulty(level) {
  if (!Number.isInteger(level) || level < 1 || level > 10)
    throw new Error("Nível inválido.");
  return level <= 3
    ? "Fácil"
    : level <= 6
      ? "Médio"
      : level <= 9
        ? "Difícil"
        : "Extremo";
}
export function challengeFor(track, level) {
  const tier = difficulty(level);
  if (!CATEGORIES.some((c) => c.id === track))
    throw new Error("Categoria inválida.");
  const category = track === "mixed" ? MIX[level - 1] : track;
  const [title, brief, requirements] = BRIEFS[category][level - 1];
  return {
    id: `${track}:${level}`,
    level,
    difficulty: tier,
    category,
    title,
    brief,
    requirements,
    slot: SLOTS[level - 1][1],
  };
}
