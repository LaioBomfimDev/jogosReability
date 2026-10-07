# Reability · jogos e acompanhamento

Aplicação em português com jogos cognitivos de acesso livre e acompanhamento opcional para profissionais da Clínica Reability.

O jogo de teste **[Forja Criativa](./jogo-forja-criativa/README.md)** tem 10 níveis de criação e escrita, correção por Gemini e equipamentos para o personagem. É independente do acompanhamento clínico e precisa de `GEMINI_API_KEY` no servidor/Vercel para corrigir respostas.

## Executar

Requer Node.js 22.13 ou superior (testado com Node 24). Não há dependências externas.

```sh
npm start
```

Abra http://127.0.0.1:4173. Qualquer visitante pode escolher um jogo e jogar sem conta. Essas partidas livres não criam paciente e não são enviadas ao histórico clínico.

O login é exclusivo para profissionais. Quando uma profissional autenticada abre um jogo, seleciona um paciente existente ou informa nome e idade; somente nesse modo a partida é vinculada ao paciente e registrada. A idade é confirmada em cada entrada e preservada em cada partida, sem modificar registros antigos. Pacientes com nomes iguais podem ter cadastros separados, identificados por código.

No **Histórico**, filtre por paciente, jogo e datas; abra **Ver rodadas** ou exporte partidas e respostas em CSV (UTF-8, separado por ponto e vírgula, compatível com Excel). As datas do filtro usam o fuso do navegador; o CSV preserva a data ISO.

## Dados e autenticação

- Banco SQLite persistente em `.data/clinic.sqlite`; nunca versionado nem servido como arquivo público. `REABILITY_DATA_DIR` permite escolher outro diretório.
- Conta profissional única, senha armazenada como hash scrypt, sessão de 12 horas em cookie HttpOnly/SameSite e autorização de todas as consultas e gravações.
- Jogos públicos funcionam em modo livre sem autenticação. O navegador não envia eventos clínicos nesse modo; login e seleção de paciente são exigidos somente para registrar resultados.
- Cada partida preserva paciente, idade, jogo, nível, início, rodadas e encerramento. Respostas são gravadas ao longo da partida; reiniciar ou sair marca a anterior como interrompida. Fechamentos abruptos podem permanecer **Em aberto**, com as respostas já recebidas preservadas.
- Fila local por profissional reenvia registros quando há conexão; IDs únicos evitam duplicações. O status **Registros salvos** confirma recebimento pelo servidor. Não limpe os dados do navegador enquanto houver salvamento pendente. Uma falha de armazenamento local é avisada e impede sair com registros pendentes.
- Não há cadastro público nem recuperação de senha nesta primeira versão.

## Hospedagem e backups

Esta versão funciona no servidor Node acima. **Publicar apenas os arquivos estáticos na Vercel não fornece a API nem a persistência do SQLite.** Para disponibilizar em outros dispositivos, hospede o servidor Node em um ambiente com volume persistente, HTTPS e `NODE_ENV=production`. Configure `HOST` e `PORT` conforme a hospedagem. Para uma plataforma serverless, será necessário adaptar a camada de dados para um banco externo antes de publicar.

Mantenha cópias de segurança do banco em local de acesso restrito. Com o servidor parado, copie o diretório de dados inteiro; não copie somente o arquivo principal enquanto houver gravações em WAL. Perder esse diretório significa perder contas e registros. Os dados de testes automatizados ficam em diretórios temporários separados.

## Regras e métricas

- Todos os jogos abrem na configuração ou na área ativa, centralizada no viewport. O profissional pode ajustar os parâmetros pertinentes antes de confirmar o início; a configuração usada é preservada no evento inicial da partida.
- **Cores e Regras simples:** azul à esquerda, verde à direita; quantidade de rodadas, exibição do estímulo e tempo de resposta configuráveis. O padrão continua sendo 12 estímulos de 700 ms e até 4 s para responder. O cronômetro visível reinicia em cada rodada e os sons começam ativados.
- **Difícil:** alterna COR/FORMA a cada três rodadas, mantendo a legenda visível. Pela forma, círculo à esquerda e triângulo à direita. Registra também regra, estímulo e se ocorreu troca de regra.
- **Siga o Foco:** 10, 15 ou 20 quadrados; alvo dourado durante todo o movimento, removido somente quando todos param. Quantidade de rodadas, tempo de acompanhamento e velocidade são configuráveis. Registra alvo, escolha, acerto, duração do acompanhamento e tempo após a parada. Sair da aba encerra os jogos novos como interrompidos para evitar medir tempos com o jogo invisível.
- **Memória:** uma rodada por par tentado. **Número:** uma por palpite válido. **Matriz:** uma por resposta. **Atenção Plena:** cliques e alvos não respondidos. **Cubos:** uma por movimento, registrando peças ganhas/perdidas; movimentos intermediários não são classificados automaticamente como erros. **Ritmo:** pulsos acertados/perdidos e toques fora da janela, com desvio temporal quando aplicável.
- Nos jogos antigos, `responseMs` representa o intervalo entre interações registradas (ou desde a apresentação quando há marcação explícita). No Ritmo, usa-se o desvio do pulso em vez de tempo de reação. A duração da partida é o tempo total decorrido, incluindo pausas.

Esses registros descrevem o desempenho nas tarefas; não constituem diagnóstico nem escala clínica validada.

## Verificação

```sh
npm test
```

Testes cobrem autenticação, isolamento entre contas, idade no momento da partida, persistência após reabrir o banco, reenvio idempotente, regras simples/difíceis, omissões e ciclo das dez rodadas de rastreamento.
