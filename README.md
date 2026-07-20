# MJM Orcamentos

Aplicacao web interna para criacao e gerenciamento de orcamentos de servicos de software.

O produto e organizado como um monorepo pnpm. O frontend e o backend continuam sendo aplicacoes independentes, e o backend e a fonte de verdade das regras de negocio e dos futuros calculos financeiros.

## Estado atual

O estado atual contempla:

- estrutura inicial do monorepo;
- API Express com TypeScript;
- PostgreSQL e Prisma;
- entidade `User`;
- autenticacao com JWT em cookie HttpOnly;
- seed de um administrador;
- rotas `POST /auth/login`, `POST /auth/logout` e `GET /auth/me`;
- frontend com login, painel, projetos e fluxo de orcamentos WEBSITE;
- testes automatizados da autenticacao;
- documentacao OpenAPI das rotas implementadas.
- CRUD backend de projetos;
- configuracoes de preco WEBSITE no banco;
- motor de precificacao WEBSITE independente de Express;
- orcamentos `Budget` versionados com itens `BudgetItem` congelados;
- recalculo explicito e finalizacao controlada para rascunhos;
- testes unitarios e integrados do fluxo financeiro.

O frontend permite criar e acompanhar projetos, criar novas versoes de orcamento WEBSITE, editar e recalcular rascunhos, visualizar itens e finalizar o orcamento. A precificacao completa deste ciclo atende apenas projetos `WEBSITE`, nas categorias landing page, institucional e portal de conteudo. E-commerce e plataforma web permanecem como familias separadas, ainda sem calculo automatico.

## Estrutura

```text
apps/
  api/       API, regras de negocio, Prisma e OpenAPI
  web/       aplicacao React com Tailwind CSS
packages/
  shared/    contratos pequenos compartilhados
```

## Pre-requisitos

- Node.js 22 ou superior
- pnpm 10
- Docker com Docker Compose

## Instalacao

```bash
pnpm install
Copy-Item .env.example .env
```

Preencha todas as variaveis obrigatorias do `.env`. Nao use as credenciais do exemplo em ambientes reais.

## Banco de dados

Inicie o PostgreSQL a partir da raiz:

```bash
docker compose up -d postgres
```

Gere o Prisma Client, execute as migrations e o seed:

```bash
pnpm db:generate
pnpm db:migrate:deploy
pnpm db:seed
```

O seed exige `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD`. Ele e idempotente para o e-mail informado e para as configuracoes de preco WEBSITE. Configuracoes ja existentes preservam o valor ajustado no banco; o seed atualiza apenas seus dados descritivos e estado ativo.

O arquivo `apps/api/prisma.config.ts` carrega o `.env` da raiz para que os comandos Prisma possam ser executados pelos scripts do monorepo sem duplicar variaveis dentro de `apps/api`.

## Desenvolvimento

```bash
pnpm dev
```

Aplicacoes isoladas:

```bash
pnpm dev:api
pnpm dev:web
```

- API: `http://localhost:3001`
- Web: `http://localhost:5173`
- Healthcheck: `GET http://localhost:3001/health`

O backend tambem pode ser iniciado com Docker:

```bash
docker compose up --build api
```

## Qualidade

```bash
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

O build do frontend nao depende do banco de dados. A autenticacao usa Prisma isolado por mock e o fluxo de orcamentos usa `mjm_orcamentos_test`, separado do banco de desenvolvimento.

## Autenticacao

A API usa um JWT assinado, armazenado em cookie HttpOnly. O token contem somente o identificador do usuario e sua expiracao. Em cada rota privada, a API valida o token e consulta o usuario para confirmar que ele continua ativo.

O logout remove o cookie no navegador. Como a autenticacao e stateless, nao existe revogacao individual antecipada: um token copiado permanece valido ate expirar. Por isso, a duracao e configuravel por `JWT_EXPIRES_IN_SECONDS`.

Protecoes iniciais:

- Argon2id para senhas;
- cookie HttpOnly, SameSite e Secure configuravel;
- CORS com origem explicita;
- validacao de origem em operacoes mutaveis;
- Helmet;
- rate limit no login;
- mensagens de credenciais uniformes;
- respostas sem `passwordHash`.

## OpenAPI

A especificacao das rotas implementadas esta em `apps/api/openapi.yaml`.

## Principais decisoes

- monorepo apenas com pnpm workspaces, sem Nx ou Turborepo;
- frontend React com Tailwind CSS e backend Express separados;
- apenas contratos estaveis podem entrar em `packages/shared`;
- JWT sem tabela de sessao no MVP;
- valores monetarios usam Decimal, com arredondamento `ROUND_HALF_UP` explicito no backend;
- orcamentos sao chamados `Budget` e seus itens `BudgetItem`;
- valores da API financeira sao serializados como strings decimais;
- alteracoes de preco nao modificam itens ja persistidos;
- complexidade, urgencia e desconto incidem somente sobre servicos, nao sobre infraestrutura ou recorrencias;
- hospedagem, dominio e manutencao possuem escopos e cobrancas separados;
- finalizar um rascunho preserva o calculo existente; somente uma acao explicita de recalculo aplica a tabela de precos atual;
- o contrato de campos WEBSITE experimental anterior foi substituido diretamente e nao possui camada `V1`/`V2` de compatibilidade; as versoes de negociacao de um orcamento continuam sendo historicos independentes;
- nenhuma credencial real e versionada.
