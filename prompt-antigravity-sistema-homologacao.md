# Prompt para o Antigravity — Sistema de Homologação SAJMP

Cole o conteúdo abaixo em uma nova tarefa do Antigravity (Agent Manager). Está escrito
em primeira pessoa, como uma especificação de produto, para o agente ter contexto
suficiente e tomar decisões sozinho sem parar toda hora para perguntar.

---

## Prompt

Quero que você construa, do zero, um sistema web para controlar o processo de
**homologação manual de versões** do sistema SAJ5 (módulos SAJMP, SAJADM, SAJWEB,
CADASTRO, INTEGRAÇÃO e DISTRIBUIÇÃO) usado por um órgão público (Ministério Público).

Hoje esse controle é feito numa planilha Excel compartilhada, onde uma equipe de 2 a 5
analistas testa manualmente cada item de um roteiro de testes e preenche status,
responsável, observações e chamados abertos. Isso já não escala: não há histórico de
quem mudou o quê, não há comparação entre versões, e a planilha trava quando duas
pessoas editam ao mesmo tempo. Quero substituir isso por uma aplicação web real, com
banco de dados, múltiplos usuários simultâneos e histórico de auditoria.

### Stack técnica (defina você os detalhes finos, mas siga esta base)

- **Next.js (App Router) + TypeScript** no frontend e backend (rotas de API/Server Actions).
- **Prisma ORM** com **SQLite** para desenvolvimento local e fácil de trocar para
  **PostgreSQL** em produção (deixe o schema compatível com os dois).
- **Tailwind CSS** para estilização.
- Autenticação simples: não precisa de login com senha corporativa nem SSO. Cada
  analista escolhe seu nome numa lista (ou cadastra um novo) na primeira vez que abre
  o sistema num navegador; isso fica salvo localmente e é usado para assinar as
  alterações que a pessoa fizer. Não é necessário criptografia de senha nem OAuth.
- Projeto deve rodar com `npm install && npm run dev` localmente e ter um `README.md`
  explicando como rodar, migrar o banco e popular os dados iniciais (seed).
- Estruture o código para ser fácil de implantar depois em qualquer host que rode
  Node.js (Vercel, um VPS com Docker, etc.). Inclua um `Dockerfile` simples.

### Modelo de dados

Cada **item de teste** (entidade principal, chamada `TestItem`) tem os campos:

| Campo | Tipo | Observação |
|---|---|---|
| id | int autoincrement | chave interna |
| numeroRoteiro | int | número original do item no roteiro (ex: 1, 2, 3...), único |
| sistema | string | ex: SAJMP, SAJADM, CADASTRO, INTEGRAÇÃO, DISTRIBUIÇÃO |
| modulo | string | ex: "Tela de autenticação" |
| tela | string | tela/funcionalidade testada |
| cenario | text | descrição do cenário de teste |
| requisitos | string | opcional |
| responsavel | string | nome do analista que testou |
| status | enum | `PENDENTE` (vazio), `FUNCIONA`, `FUNCIONA_COM_RESSALVAS`, `ERRO_IMPEDITIVO`, `ITEM_DESABILITADO` |
| chamado | string | referência livre de chamado (ex: "JIRA-1234", "GLPI-556"), sem integração automática por enquanto |
| statusChamado | string | texto livre |
| observacao | text | |
| subsidio | text | |
| arquivado | boolean | true quando o item deixou de existir numa versão mais nova importada |
| createdAt / updatedAt | datetime | |

Cada item tem um histórico (`TestItemHistory`, relação 1-N): `id, testItemId, timestamp,
usuario, descricao`. Toda alteração relevante em um item gera uma entrada aqui
(ex: `"Status alterado: PENDENTE → FUNCIONA"`, `"Responsável definido para FABRICIO"`,
`"Descrição do item atualizada na importação da versão 5.1"`).

Também existe uma entidade `RoteiroVersao` (a "rodada" de homologação atual):
`id, titulo, versao, cliente, dataInicio, dataFim, importadoEm`.

### Funcionalidades obrigatórias

1. **Seed inicial com dados reais**: no seed do banco (`prisma/seed.ts`), popule a
   tabela `TestItem` a partir do arquivo `seed-data.csv` que vou anexar ao projeto
   (formato: `ID;SISTEMA;MÓDULO;TELA/FUNCIONALIDADE;CENÁRIO;REQUISITOS;RESPONSÁVEL;
   STATUS;CHAMADO;STATUS CHAMADO;OBSERVAÇÃO;SUBSÍDIO`, delimitado por `;`, ~1.900
   linhas, pode estar em UTF-8 ou Windows-1252 — trate os dois casos). Isso já deixa
   o sistema pronto para uso no primeiro `npm run dev`, sem precisar importar nada
   manualmente.

2. **Painel (dashboard)**: cards com contagem e percentual de cada status
   (Funciona, Item desabilitado, Funciona com ressalvas, Erro impeditivo), mais
   "Homologados" (soma de todos os status preenchidos) e "Restantes" (pendentes).
   Abaixo, uma quebra de progresso por sistema (SAJMP, CADASTRO, etc.) com barra de
   percentual testado.

3. **Lista de itens**: tabela paginada e filtrável por sistema, módulo, status e
   responsável, com busca textual por tela/cenário/requisito. Clicar num item abre
   um painel/modal de edição com todos os campos e o histórico de alterações daquele
   item, mais recente primeiro.

4. **Importação de nova versão**: uma tela para colar ou enviar (upload) um novo CSV
   no mesmo formato, mostrando uma prévia do diff antes de confirmar: quantos itens
   são novos, quantos sumiram (marcar como `arquivado = true`, nunca apagar do banco),
   quantos tiveram a descrição alterada, e quantos foram preservados com o status de
   teste intacto. Só grava no banco depois de o usuário confirmar.

5. **Exportação**: botão para baixar o estado atual como CSV, no mesmo layout de
   colunas do arquivo original (compatibilidade com quem ainda usa Excel).

6. **Concorrência**: como 2 a 5 pessoas editam ao mesmo tempo, use transações no
   Prisma para updates e trate o caso de dois analistas salvarem o mesmo item quase
   simultaneamente (last-write-wins está OK, mas registre ambas as entradas no
   histórico).

7. **Responsivo e acessível**: funciona bem em telas menores (analistas podem testar
   pelo celular), foco visível no teclado, sem depender só de cor para indicar status
   (use também um rótulo textual).

### Direção visual

Não use os clichês visuais mais comuns de apps gerados por IA (fundo bege/creme com
serifada + laranja-terracota; ou fundo quase preto com um único verde/vermelho neon;
ou layout "jornal" com hairlines e zero border-radius). Em vez disso:

- Paleta: tinta naval escura (`#16233D`) para cabeçalho/navegação, papel verde-acinzentado
  claro (`#EDF1EA`) como fundo do conteúdo, e cores de status: verde-floresta
  (`#2F6F4E` = Funciona), âmbar (`#B8842E` = Ressalvas), tijolo (`#A63B2E` = Erro
  impeditivo), cinza-pedra (`#65675E` = Desabilitado).
- Tipografia: uma serifada de peso forte (ex: Source Serif 4) só para títulos, uma
  sans-serif técnica (ex: IBM Plex Sans) para a interface e dados, e uma monoespaçada
  (ex: IBM Plex Mono) para IDs, datas e números de versão.
- Elemento de assinatura visual: um "selo de homologação" — um círculo com borda dupla
  (uma sólida, uma tracejada por dentro), levemente rotacionado, com o rótulo do status
  em letras maiúsculas dentro (ex: "HOMOLOGADO", "REPROVADO") — evocando um carimbo
  oficial de processo, já que este é literalmente um sistema de *homologação* de um
  órgão público. Use isso nos cards do painel, não espalhe em todo lugar.

### Critérios de aceite

- `npm install && npx prisma migrate dev && npx prisma db seed && npm run dev` sobe o
  sistema já com os ~1.900 itens da planilha carregados e o painel mostrando números
  batendo com o total do CSV.
- Dois usuários em abas/navegadores diferentes conseguem editar itens diferentes ao
  mesmo tempo sem erro.
- Importar um segundo CSV com itens novos, itens removidos e uma descrição alterada
  produz o diff correto e preserva o status já testado dos itens que não mudaram.
- Exportar CSV depois de algumas edições reflete o estado atual.
- `README.md` explica como rodar local e como trocar SQLite por Postgres em produção.

Ao final, me dê um resumo do que foi criado, os comandos para rodar, e qualquer
decisão de arquitetura que você tomou e que eu deveria saber.

---

### Observação (para você, antes de colar no Antigravity)

Anexe junto o arquivo `seed-data.csv` (a sua planilha atual exportada em CSV) na
tarefa do Antigravity, para que o agente use os dados reais no seed em vez de
inventar dados de exemplo.
