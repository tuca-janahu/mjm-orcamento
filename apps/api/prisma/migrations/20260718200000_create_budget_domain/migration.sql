CREATE TYPE "ApplicationType" AS ENUM ('WEBSITE', 'LANDING_PAGE', 'ECOMMERCE', 'PLATAFORMA_WEB', 'APLICATIVO_MOBILE', 'SISTEMA_INTERNO', 'AUTOMACAO', 'OUTRO');
CREATE TYPE "ProjectStatus" AS ENUM ('PROSPECCAO', 'PREPARACAO', 'EM_EXECUCAO', 'CONCLUIDO', 'CANCELADO');
CREATE TYPE "BudgetStatus" AS ENUM ('RASCUNHO', 'FINALIZADO', 'ENVIADO', 'APROVADO', 'RECUSADO', 'CANCELADO');
CREATE TYPE "PricingConfigType" AS ENUM ('FIXED_VALUE', 'UNIT_VALUE', 'MULTIPLIER', 'PERCENTAGE');

CREATE TABLE "projects" (
  "id" UUID NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "client_name" VARCHAR(160),
  "description" TEXT,
  "application_type" "ApplicationType" NOT NULL,
  "status" "ProjectStatus" NOT NULL DEFAULT 'PROSPECCAO',
  "responsible_user_id" UUID NOT NULL,
  "notes" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "budgets" (
  "id" UUID NOT NULL,
  "project_id" UUID NOT NULL,
  "version_number" INTEGER NOT NULL,
  "status" "BudgetStatus" NOT NULL DEFAULT 'RASCUNHO',
  "input_data" JSONB NOT NULL,
  "subtotal" DECIMAL(14,2) NOT NULL,
  "complexity_multiplier" DECIMAL(8,4) NOT NULL,
  "urgency_multiplier" DECIMAL(8,4) NOT NULL,
  "discount_percentage" DECIMAL(5,2) NOT NULL,
  "final_total" DECIMAL(14,2) NOT NULL,
  "monthly_recurring_total" DECIMAL(14,2) NOT NULL,
  "notes" TEXT,
  "created_by_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "budget_items" (
  "id" UUID NOT NULL,
  "budget_id" UUID NOT NULL,
  "code" VARCHAR(100) NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "description" TEXT,
  "category" VARCHAR(80) NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unit_price" DECIMAL(14,2) NOT NULL,
  "total_price" DECIMAL(14,2) NOT NULL,
  "recurring" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB,
  "display_order" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "budget_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pricing_configs" (
  "id" UUID NOT NULL,
  "code" VARCHAR(100) NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "application_type" "ApplicationType" NOT NULL,
  "category" VARCHAR(80) NOT NULL,
  "config_type" "PricingConfigType" NOT NULL,
  "value" DECIMAL(14,4) NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "pricing_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "budgets_project_id_version_number_key" ON "budgets"("project_id", "version_number");
CREATE UNIQUE INDEX "pricing_configs_code_key" ON "pricing_configs"("code");
CREATE INDEX "projects_responsible_user_id_idx" ON "projects"("responsible_user_id");
CREATE INDEX "projects_status_idx" ON "projects"("status");
CREATE INDEX "budgets_project_id_status_idx" ON "budgets"("project_id", "status");
CREATE INDEX "budgets_created_by_id_idx" ON "budgets"("created_by_id");
CREATE INDEX "budget_items_budget_id_display_order_idx" ON "budget_items"("budget_id", "display_order");
CREATE INDEX "pricing_configs_application_type_active_idx" ON "pricing_configs"("application_type", "active");

ALTER TABLE "projects" ADD CONSTRAINT "projects_responsible_user_id_fkey" FOREIGN KEY ("responsible_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "budget_items" ADD CONSTRAINT "budget_items_budget_id_fkey" FOREIGN KEY ("budget_id") REFERENCES "budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
