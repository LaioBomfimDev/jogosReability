# Forja Criativa

Protótipo independente de treino criativo: 10 níveis por jornada (3 fáceis, 3 médios, 3 difíceis e 1 extremo). Seis trilhas com dez briefings próprios e uma trilha mista. Respostas digitadas; o Gemini avalia apenas o texto (não gera imagens, vídeos ou motion).

## Ativar a IA

1. Crie uma chave no [Google AI Studio](https://aistudio.google.com/api-keys).
2. Na Vercel, projeto `jogos-reability`, adicione `GEMINI_API_KEY` em Settings → Environment Variables, para Production (e Preview, se necessário). Nunca coloque a chave no HTML, JavaScript do navegador ou Git.
3. Faça um novo deploy. `GET /api/creative-grade` retorna somente `available: true/false` para a interface.
4. Opcional: `GEMINI_MODEL` seleciona outro modelo compatível. Padrão: `gemini-3.5-flash-lite`.

Localmente, configure `GEMINI_API_KEY` no ambiente do processo e rode `npm start`, ou use `node --env-file=.env.local static-server.mjs` se salvou a variável no arquivo local ignorado pelo Git. Sem chave válida a interface preserva rascunhos, mas não inventa correções nem libera equipamentos.

Referências: [modelos Gemini](https://ai.google.dev/gemini-api/docs/models), [JSON estruturado](https://ai.google.dev/gemini-api/docs/generate-content/structured-output). A integração usa REST e não instala SDKs. A disponibilidade/cota/cobrança depende do projeto Google. Configure os limites do provedor antes de abrir o protótipo a grande volume de usuários.

## Avaliação e progressão

- Quatro notas inteiras de 1 a 10: pedido (35%), clareza (25%), técnica (25%) e adequação criativa (15%). O servidor calcula a média ponderada e arredonda para a nota inteira de 1 a 10. A IA recebe instruções para calibrar exigência pela dificuldade e preservar fatos em revisões.
- Cada nível entrega uma peça: capacete, peitoral, botas, luvas, ombreiras, cinturão, capa, escudo, arma e amuleto. A nota define um entre dez materiais; poder = nível × 10 + nota. As peças aparecem no personagem e no inventário.
- O gráfico usa somente resultados concluídos. O aviso compara as duas últimas notas; não apresenta essa diferença como uma medição de capacidade cognitiva. A dificuldade e o tema podem variar.
- Rascunho, personagem e notas ficam no `localStorage` deste navegador. Não há histórico clínico nem sincronização entre dispositivos. Uma correção por nível; iniciar outra jornada pede confirmação antes de substituir o progresso.

## API e limites do protótipo

`api/creative-grade.js` funciona como Vercel Function e no servidor Node local. O servidor escolhe o briefing por categoria/nível (não aceita rubricas do cliente), valida tamanho e tipo da entrada, checa o JSON do modelo, calcula a nota, aplica timeout de 45 segundos e devolve erros sem detalhes do provedor ou da chave. Textos são renderizados como texto, não HTML.

Há deduplicação por resposta, limite de concorrência e limite de 30 pedidos/hora por IP **por instância**, em memória, para o teste. Esses limites reiniciam ao reciclar a função e não são uma quota global. Para uso público em escala, usar rate limit compartilhado/autenticação e limites de orçamento do provedor. Resultados salvos no navegador são editáveis pelo usuário; não servem como ranking competitivo ou certificação.

Os testes automatizados usam respostas simuladas do provedor, isoladas em testes, para validar transporte e regras. A aplicação não tem modo de avaliação simulada.
