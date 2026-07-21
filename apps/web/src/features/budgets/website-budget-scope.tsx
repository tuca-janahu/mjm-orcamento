import type { WebsiteBudgetInput } from "@mjm/shared";
import { labelFromEnum } from "../../lib/format";
import {
  BudgetScopeAside,
  formatTargetDate,
  ScopeGroup,
  ScopeRow,
} from "./budget-scope-components";

const optionLabels: Record<string, string> = {
  LANDING_PAGE: "Landing page",
  INSTITUCIONAL: "Site institucional",
  PORTAL_CONTEUDO: "Portal de conteúdo",
  CLIENT_PROVIDES_READY: "Cliente fornece conteúdo pronto",
  MJM_MIGRATES_EXISTING: "MJM migra conteúdo existente",
  MJM_PRODUCES_CONTENT: "MJM produz o conteúdo",
  CLIENT_PROVIDED: "Design fornecido pelo cliente",
  TEMPLATE_CUSTOMIZATION: "Adaptação de template",
  CUSTOM_DESIGN: "Design personalizado",
  NONE: "Nenhum",
  STANDARD_CMS: "CMS padrão",
  CUSTOM_ADMIN: "Painel administrativo personalizado",
  SIMPLE: "Simples",
  STANDARD: "Padrão",
  COMPLEX: "Complexa",
  BLOG: "Blog",
  SITE_SEARCH: "Busca interna",
  TECHNICAL_BASELINE: "Base técnica",
  ON_PAGE_SETUP: "Configuração on-page",
  CONTENT_STRATEGY: "Estratégia de conteúdo",
  CLIENT_MANAGED: "Gerenciado pelo cliente",
  NEW_REGISTRATION: "Novo registro",
  TRANSFER: "Transferência",
  CONFIGURATION_ONLY: "Somente configuração",
  MJM_STANDARD: "Hospedagem MJM padrão",
  MJM_MANAGED: "Hospedagem gerenciada pela MJM",
  ESSENTIAL: "Essencial",
  CUSTOM: "Personalizado",
  MODERATE: "Moderado",
  HIGH: "Alto",
};

function optionLabel(value: string): string {
  return optionLabels[value] ?? labelFromEnum(value);
}

export function WebsiteBudgetScope({
  scope,
  notes,
}: {
  scope: WebsiteBudgetInput;
  notes: string | null;
}) {
  return (
    <BudgetScopeAside title="Website" notes={notes}>
      <ScopeGroup title="Estrutura">
        <ScopeRow label="Categoria">
          {optionLabel(scope.websiteCategory)}
        </ScopeRow>
        {scope.websiteCategory === "LANDING_PAGE" ? (
          <ScopeRow label="Seções">{scope.sectionCount}</ScopeRow>
        ) : (
          <>
            <ScopeRow label="Páginas">{scope.pageCount}</ScopeRow>
            <ScopeRow label="Layouts únicos">
              {scope.uniqueLayoutCount}
            </ScopeRow>
          </>
        )}
        <ScopeRow label="Idiomas">{scope.languageCount}</ScopeRow>
        <ScopeRow label="Lançamento desejado">
          {formatTargetDate(scope.targetLaunchDate)}
        </ScopeRow>
      </ScopeGroup>

      <ScopeGroup title="Conteúdo e design">
        <ScopeRow label="Conteúdo">
          {optionLabel(scope.contentResponsibility)}
        </ScopeRow>
        <ScopeRow label="Conteúdos a migrar">
          {scope.contentMigrationCount}
        </ScopeRow>
        <ScopeRow label="Design">{optionLabel(scope.designApproach)}</ScopeRow>
        <ScopeRow label="Gestão de conteúdo">
          {optionLabel(scope.contentManagement)}
        </ScopeRow>
      </ScopeGroup>

      <ScopeGroup title="Funcionalidades">
        <ScopeRow label="Formulários simples">
          {scope.simpleFormCount}
        </ScopeRow>
        <ScopeRow label="Formulários avançados">
          {scope.advancedFormCount}
        </ScopeRow>
        <ScopeRow label="Módulos">
          {scope.additionalModules.length > 0
            ? scope.additionalModules.map(optionLabel).join(", ")
            : "Nenhum"}
        </ScopeRow>
        <ScopeRow label="Integrações">{scope.integrations.length}</ScopeRow>
        {scope.integrations.map((integration, index) => (
          <ScopeRow
            label={`Integração ${index + 1}`}
            key={`${integration.name}-${index}`}
          >
            {integration.name} · {optionLabel(integration.complexity)}
          </ScopeRow>
        ))}
      </ScopeGroup>

      <ScopeGroup title="Entrega e operação">
        <ScopeRow label="SEO">{optionLabel(scope.seoLevel)}</ScopeRow>
        <ScopeRow label="Domínio">{optionLabel(scope.domainService)}</ScopeRow>
        <ScopeRow label="Hospedagem">
          {optionLabel(scope.hostingPlan)}
        </ScopeRow>
        <ScopeRow label="Manutenção">
          {optionLabel(scope.maintenancePlan)}
        </ScopeRow>
      </ScopeGroup>

      <ScopeGroup title="Ajustes comerciais">
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
