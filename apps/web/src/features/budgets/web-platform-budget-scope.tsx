import type { WebPlatformBudgetInput } from "@mjm/shared";
import { labelFromEnum } from "../../lib/format";
import {
  BudgetScopeAside,
  formatTargetDate,
  ScopeGroup,
  ScopeRow,
} from "./budget-scope-components";

const optionLabels: Record<string, string> = {
  CLIENT_PORTAL: "Portal de clientes",
  SAAS: "SaaS",
  MARKETPLACE: "Marketplace",
  MEMBERSHIP_PLATFORM: "Plataforma de membros",
  CUSTOM: "Personalizado",
  SINGLE_ORGANIZATION: "Uma organização",
  MULTI_ORGANIZATION: "Múltiplas organizações",
  CLIENT_PROVIDED: "Design fornecido pelo cliente",
  DESIGN_SYSTEM_ADAPTATION: "Adaptação de design system",
  CUSTOM_DESIGN: "Design personalizado",
  NONE: "Nenhum",
  STANDARD: "Padrão",
  SIMPLE: "Simples",
  COMPLEX: "Complexa",
  SOCIAL_LOGIN: "Login social",
  MFA: "Autenticação multifator",
  SSO: "SSO corporativo",
  ONE_TIME: "Pagamento único",
  SUBSCRIPTION: "Assinatura recorrente",
  MARKETPLACE_SPLIT: "Split de marketplace",
  IN_APP: "Dentro da plataforma",
  EMAIL: "E-mail",
  WHATSAPP_SMS: "WhatsApp ou SMS",
  BASIC_UPLOADS: "Uploads básicos",
  DOCUMENT_WORKFLOW: "Fluxo de documentos",
  BASIC: "Básica",
  COMPLETE: "Completa",
  STRUCTURED_IMPORT: "Importação estruturada",
  LEGACY_MIGRATION: "Migração de sistema legado",
  CLIENT_MANAGED: "Gerenciado pelo cliente",
  MJM_STANDARD: "Hospedagem MJM padrão",
  MJM_MANAGED: "Hospedagem gerenciada pela MJM",
  ESSENTIAL: "Essencial",
  MODERATE: "Moderado",
  HIGH: "Alto",
};

function optionLabel(value: string): string {
  return optionLabels[value] ?? labelFromEnum(value);
}

function optionList(values: readonly string[]): string {
  return values.length > 0 ? values.map(optionLabel).join(", ") : "Nenhum";
}

export function WebPlatformBudgetScope({
  scope,
  notes,
}: {
  scope: WebPlatformBudgetInput;
  notes: string | null;
}) {
  return (
    <BudgetScopeAside title="Plataforma web" notes={notes}>
      <ScopeGroup title="Contexto e estrutura">
        <ScopeRow label="Categoria">
          {scope.platformCategory === "CUSTOM"
            ? "Categoria personalizada"
            : optionLabel(scope.platformCategory)}
        </ScopeRow>
        {scope.customCategoryDescription && (
          <ScopeRow label="Descrição da categoria">
            {scope.customCategoryDescription}
          </ScopeRow>
        )}
        <ScopeRow label="Estrutura de contas">
          {optionLabel(scope.accountStructure)}
        </ScopeRow>
        <ScopeRow label="Telas">{scope.screenCount}</ScopeRow>
        <ScopeRow label="Perfis de acesso">{scope.userRoleCount}</ScopeRow>
        <ScopeRow label="Idiomas">{scope.languageCount}</ScopeRow>
        <ScopeRow label="Lançamento desejado">
          {formatTargetDate(scope.targetLaunchDate)}
        </ScopeRow>
      </ScopeGroup>

      <ScopeGroup title="Produto e experiência">
        <ScopeRow label="Design">{optionLabel(scope.designApproach)}</ScopeRow>
        <ScopeRow label="Backoffice">
          {optionLabel(scope.adminBackoffice)}
        </ScopeRow>
        <ScopeRow label="Dashboards">{scope.dashboardCount}</ScopeRow>
        <ScopeRow label="Relatórios">{scope.reportCount}</ScopeRow>
        <ScopeRow label="Módulos">{scope.functionalModules.length}</ScopeRow>
        {scope.functionalModules.map((module, index) => (
          <ScopeRow
            label={`Módulo ${index + 1}`}
            key={`${module.name}-${index}`}
          >
            {module.name} · {optionLabel(module.complexity)}
            {module.description ? ` · ${module.description}` : ""}
          </ScopeRow>
        ))}
      </ScopeGroup>

      <ScopeGroup title="Acesso e recursos">
        <ScopeRow label="Autenticação adicional">
          {optionList(scope.additionalAuthentication)}
        </ScopeRow>
        <ScopeRow label="Pagamentos">
          {optionList(scope.paymentFeatures)}
        </ScopeRow>
        <ScopeRow label="Notificações">
          {optionList(scope.notificationChannels)}
        </ScopeRow>
        <ScopeRow label="Arquivos">
          {optionLabel(scope.fileHandling)}
        </ScopeRow>
        <ScopeRow label="Auditoria">{optionLabel(scope.auditLevel)}</ScopeRow>
      </ScopeGroup>

      <ScopeGroup title="Integrações e dados">
        <ScopeRow label="Integrações">{scope.integrations.length}</ScopeRow>
        {scope.integrations.map((integration, index) => (
          <ScopeRow
            label={`Integração ${index + 1}`}
            key={`${integration.name}-${index}`}
          >
            {integration.name} · {optionLabel(integration.complexity)}
            {integration.description ? ` · ${integration.description}` : ""}
          </ScopeRow>
        ))}
        <ScopeRow label="Migração de dados">
          {optionLabel(scope.dataMigration)}
        </ScopeRow>
        <ScopeRow label="Fontes de dados">
          {scope.dataMigrationSourceCount}
        </ScopeRow>
      </ScopeGroup>

      <ScopeGroup title="Operação e condições comerciais">
        <ScopeRow label="Hospedagem">
          {optionLabel(scope.hostingPlan)}
        </ScopeRow>
        <ScopeRow label="Manutenção">
          {optionLabel(scope.maintenancePlan)}
        </ScopeRow>
        <ScopeRow label="Complexidade">
          {optionLabel(scope.complexityAdjustment)}
        </ScopeRow>
        <ScopeRow label="Motivo da complexidade">
          {scope.complexityReason || "Não se aplica"}
        </ScopeRow>
        <ScopeRow label="Desconto">
          {scope.discountPercentage.toFixed(2)}%
        </ScopeRow>
        <ScopeRow label="Motivo do desconto">
          {scope.discountReason || "Não se aplica"}
        </ScopeRow>
      </ScopeGroup>
    </BudgetScopeAside>
  );
}
