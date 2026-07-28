# Sistema de Homologação SAJMP

Aplicação web para o controle colaborativo da homologação manual de versões do sistema SAJ5, substituindo a antiga planilha Excel por um sistema com concorrência segura, rastreabilidade e análise inteligente de diff (importação de novas versões mantendo o que já foi testado).

## Como rodar localmente (Desenvolvimento)

O projeto requer Node.js (v20 ou v22+) e usa SQLite por padrão para simplificar o desenvolvimento.

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Crie e popule o banco de dados inicial:**
   Este comando criará o arquivo SQLite `prisma/dev.db`, aplicará a estrutura de tabelas e carregará os dados contidos no `prisma/seed-data.csv` (1.911 itens).
   ```bash
   npx prisma migrate dev --name init
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

## Como fazer o deploy para Produção (PostgreSQL + Docker)

O schema do Prisma foi projetado para ser compatível tanto com SQLite (desenvolvimento) quanto com PostgreSQL (produção).

1. No arquivo `prisma/schema.prisma`, altere o provider da fonte de dados:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. Defina a variável de ambiente `DATABASE_URL` no seu host apontando para o seu banco PostgreSQL:
   ```
   DATABASE_URL="postgresql://user:password@host:port/database"
   ```

3. Usando Docker:
   O repositório já inclui um `Dockerfile` otimizado para deploy usando o recurso standalone do Next.js.
   ```bash
   docker build -t homologacao-saj5 .
   docker run -p 3000:3000 -e DATABASE_URL="..." homologacao-saj5
   ```

## Funcionalidades principais implementadas

- **Dashboard**: Acompanhamento de progresso geral e breakdown por sistema (SAJMP, CADASTRO, SAJADM, etc.).
- **Lista de Itens**: Filtros robustos, paginação e design acessível (status indicados por cor e rótulo).
- **Drawer de Edição**: Edição de campos com registro automático de histórico de alterações (quem e o que alterou).
- **Importação inteligente**: Capacidade de colar um novo CSV e obter um diff entre o banco atual e a nova planilha (identificando itens novos, removidos, com descrições alteradas e preservados).
- **Exportação CSV**: Exportação do estado atual do banco no formato exato da planilha Excel original.
