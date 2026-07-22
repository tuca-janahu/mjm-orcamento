# MJM Orcamentos

Aplicacao web interna para criacao e gerenciamento de orcamentos de servicos de software.

O produto e organizado como um monorepo pnpm. O frontend e o backend continuam sendo aplicacoes independentes, e o backend e a fonte de verdade das regras de negocio e dos calculos financeiros.

## Estado atual

O estado atual contempla:

- estrutura inicial do monorepo;
- API Express com TypeScript;
- PostgreSQL e Prisma;
- entidade `User`;
- autenticacao com JWT em cookie HttpOnly;
- seed de um administrador;
- rotas `POST /auth/login`, `POST /auth/logout` e `GET /auth/me`;
- frontend com login, painel, projetos e fluxos de orcamento WEBSITE, PLATAFORMA_WEB e SISTEMA_INTERNO;
- testes automatizados da autenticacao;
- documentacao OpenAPI das rotas implementadas.
- CRUD backend de projetos;
- configuracoes de preco WEBSITE, PLATAFORMA_WEB e SISTEMA_INTERNO no banco;
- motores de precificacao WEBSITE, PLATAFORMA_WEB e SISTEMA_INTERNO independentes de Express;
- orcamentos `Budget` versionados com itens `BudgetItem` congelados;
- recalculo explicito e finalizacao controlada para rascunhos;
- exclusao explicita de projetos sem orcamentos e de orcamentos ainda em rascunho;
- testes unitarios e integrados do fluxo financeiro.

O frontend permite criar e acompanhar projetos, criar novas versoes de orcamento, salvar e recalcular rascunhos, visualizar itens e finalizar o orcamento mediante confirmacao. Exclusoes tambem exigem confirmacao explicita na interface. A precificacao automatica atende projetos `WEBSITE`, `PLATAFORMA_WEB` e `SISTEMA_INTERNO`. Os demais tipos, incluindo `ECOMMERCE`, continuam sem calculo automatico.

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

O seed exige `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD`. Ele e idempotente para o e-mail informado e para as configuracoes de preco WEBSITE, PLATAFORMA_WEB e SISTEMA_INTERNO. Configuracoes ja existentes preservam o valor comercial ajustado no banco; o seed atualiza seus dados descritivos, estado ativo e, para a base de Sistema Interno, as franquias aprovadas em metadata.

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

## Precificacao suportada

Cada tipo possui schema, configuracoes e motor proprios. O backend carrega o tipo do projeto antes de validar o JSON do orcamento e o confirma novamente na transacao de persistencia, impedindo que campos ou precos de WEBSITE sejam usados em PLATAFORMA_WEB e vice-versa.

Em PLATAFORMA_WEB, o valor-base inclui a fundacao frontend/backend, persistencia, autenticacao por e-mail e senha, cinco telas, dois perfis e um idioma. O restante e detalhado por estrutura de contas, design, modulos funcionais, backoffice, dashboards, relatorios, autenticacao adicional, pagamentos, notificacoes, arquivos, auditoria, integracoes e migracao de dados. A data de lancamento nao pode estar antes do dia UTC atual. A implantacao da hospedagem e um item unico sem multiplicadores; hospedagem mensal e manutencao ficam separadas no total recorrente.

### Sistema Interno e Plataforma Web

`SISTEMA_INTERNO` representa uma aplicacao cujo valor principal e entregue aos colaboradores de uma organizacao para executar ou controlar processos internos. Exemplos incluem gestao operacional, CRM de uso interno, estoque, ativos, ordens de servico, solicitacoes, contratos, projetos, aprovacoes e gestao documental.

`PLATAFORMA_WEB` representa um produto ou servico digital cujo valor principal e entregue a clientes, membros, fornecedores, parceiros ou outros usuarios externos. SaaS, multitenancy, marketplace, assinatura comercial, pagamentos do proprio produto e portais de autoatendimento externos pertencem a Plataforma Web. A tecnologia nao determina a classificacao: um Sistema Interno pode funcionar no navegador e uma Plataforma Web pode possuir backoffice interno.

### Escopo e base de Sistema Interno

Sistema Interno utiliza uma unica configuracao-base, `INTERNAL_SYSTEM_BASE`. Categorias como CRM, estoque ou ordens de servico nao selecionam bases diferentes; toda funcionalidade de negocio deve ser descrita por um modulo nomeado. Cada modulo e integracao produz um `BudgetItem` individual, com nome, descricao, complexidade, quantidade e preco congelados.

A base cobre somente a fundacao tecnica:

- autenticacao por e-mail e senha;
- estrutura inicial da aplicacao;
- dois perfis de acesso com permissoes padrao;
- administracao basica de usuarios e parametros;
- um dashboard simples;
- notificacoes dentro do sistema.

Essas franquias ficam em `PricingConfig.metadata`. O motor valida o metadata, calcula somente os excedentes e copia as franquias e quantidades informadas para o item-base. Assim, uma alteracao futura de franquias nao torna ambiguo um orcamento antigo.

Modulos possuem complexidade `SIMPLE`, `STANDARD` ou `COMPLEX`, que escolhe seu preco unitario. O ajuste global `NONE`, `MODERATE` ou `HIGH` e reservado a fatores transversais nao capturados pelos modulos. A existencia de um modulo complexo, isoladamente, nao justifica aplicar complexidade global.

O workflow global representa um processo transversal compartilhado por mais de um modulo. Um fluxo exclusivo de um modulo deve ser refletido na complexidade daquele modulo, evitando dupla cobranca. Workflow personalizado e fluxo documental podem coexistir quando forem entregas independentes.

### Calculo de Sistema Interno

```text
servicos ajustados =
  subtotal dos servicos ajustaveis
  x multiplicador de complexidade
  x multiplicador de urgencia
  x (1 - desconto / 100)

total final =
  servicos ajustados
  + implantacao de hospedagem

total mensal =
  hospedagem mensal
  + manutencao mensal
```

Base, modulos, perfis adicionais, permissoes, autenticacao adicional, workflow, documentos, dashboards adicionais, relatorios, notificacoes, integracoes e migracao sao ajustaveis. Implantacao de hospedagem e pontual e nao recebe complexidade, urgencia ou desconto. Hospedagem mensal e manutencao sao recorrentes e nao entram no total inicial.

Custos de consumo de e-mail, WhatsApp, SMS, SSO, nuvem ou outros fornecedores externos nao estao incluidos, salvo indicacao comercial expressa.

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
- custos de terceiros por consumo, como gateways, e-mail, WhatsApp, SMS e nuvem, nao sao incluidos automaticamente;
- o tipo do projeto determina o schema e o motor de calculo; ele nao e repetido no JSON do orcamento;
- o tipo do projeto nao pode ser alterado depois que o primeiro orcamento for criado;
- finalizar um rascunho preserva o calculo existente; somente uma acao explicita de recalculo aplica a tabela de precos atual;
- a criacao iniciada pelo frontend usa `Idempotency-Key` como UUID do proprio orcamento, evitando uma nova versao quando a resposta se perde; repetir a finalizacao de um orcamento ja finalizado tambem e seguro;
- apenas orcamentos em rascunho podem ser excluidos; versoes finalizadas permanecem no historico;
- projetos so podem ser excluidos enquanto nao possuirem orcamentos;
- o contrato de campos WEBSITE experimental anterior foi substituido diretamente e nao possui camada `V1`/`V2` de compatibilidade; as versoes de negociacao de um orcamento continuam sendo historicos independentes;
- nenhuma credencial real e versionada.
