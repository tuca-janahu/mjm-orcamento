-- LANDING_PAGE passa a ser uma categoria interna da precificacao WEBSITE.
-- Os projetos e configuracoes existentes sao preservados e normalizados antes
-- de o valor ser removido do enum.
UPDATE "projects"
SET "application_type" = 'WEBSITE'
WHERE "application_type" = 'LANDING_PAGE';

UPDATE "pricing_configs"
SET "application_type" = 'WEBSITE'
WHERE "application_type" = 'LANDING_PAGE';

ALTER TYPE "ApplicationType" RENAME TO "ApplicationType_old";

CREATE TYPE "ApplicationType" AS ENUM (
  'WEBSITE',
  'ECOMMERCE',
  'PLATAFORMA_WEB',
  'APLICATIVO_MOBILE',
  'SISTEMA_INTERNO',
  'AUTOMACAO',
  'OUTRO'
);

ALTER TABLE "projects"
  ALTER COLUMN "application_type" TYPE "ApplicationType"
  USING ("application_type"::text::"ApplicationType");

ALTER TABLE "pricing_configs"
  ALTER COLUMN "application_type" TYPE "ApplicationType"
  USING ("application_type"::text::"ApplicationType");

DROP TYPE "ApplicationType_old";

-- Mantemos os registros para auditoria, mas eles nao participam mais dos
-- calculos do modelo atual.
UPDATE "pricing_configs"
SET "active" = false
WHERE "code" IN (
  'WEBSITE_BASE_BLOG',
  'WEBSITE_BASE_ECOMMERCE',
  'WEBSITE_BASE_PLATAFORMA',
  'WEBSITE_DESIGN_TEMPLATE',
  'WEBSITE_DEVELOPMENT_FRONTEND',
  'WEBSITE_DEVELOPMENT_FULLSTACK',
  'WEBSITE_ADMIN_PANEL',
  'WEBSITE_INTEGRATION',
  'WEBSITE_PAYMENT_SYSTEM',
  'WEBSITE_BLOG',
  'WEBSITE_BASIC_SEO',
  'WEBSITE_DOMAIN',
  'WEBSITE_HOSTING',
  'WEBSITE_COMPLEXITY_SIMPLE',
  'WEBSITE_COMPLEXITY_MEDIUM',
  'WEBSITE_COMPLEXITY_COMPLEX'
);

-- Estes codigos continuam existindo, mas o valor-base agora inclui a
-- implementacao tecnica essencial que antes era cobrada separadamente.
UPDATE "pricing_configs"
SET "value" = CASE "code"
  WHEN 'WEBSITE_BASE_LANDING_PAGE' THEN 2500
  WHEN 'WEBSITE_BASE_INSTITUCIONAL' THEN 2800
  ELSE "value"
END
WHERE "code" IN (
  'WEBSITE_BASE_LANDING_PAGE',
  'WEBSITE_BASE_INSTITUCIONAL'
);
