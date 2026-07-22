import type { InternalSystemBudgetInput } from "@mjm/shared";
import {
  BudgetScopeAside,
  formatTargetDate,
  ScopeGroup,
  ScopeRow,
} from "./budget-scope-components";
import { internalSystemOptionLabel } from "./internal-system-form/config";

function optionList(values: readonly string[]): string {
  return values.length > 0
    ? values.map(internalSystemOptionLabel).join(", ")
    : "Nenhum";
}

export function InternalSystemBudgetScope({
  scope,
  notes,
}: {
  scope: InternalSystemBudgetInput;
  notes: string | null;
}) {
  return (
    <BudgetScopeAside title="Sistema interno" notes={notes}>
      <ScopeGroup title="Estrutura do sistema">
        <ScopeRow label="Base incluída">
          E-mail e senha, estrutura inicial, 2 perfis com permissões padrão,
          administração básica, 1 dashboard e notificações internas
        </ScopeRow>
        <ScopeRow label="Perfis de acesso">{scope.accessProfileCount}</ScopeRow>
        <ScopeRow label="Lançamento desejado">
          {formatTargetDate(scope.targetLaunchDate)}
        </ScopeRow>
        <ScopeRow label="Módulos">{scope.modules.length}</ScopeRow>
        {scope.modules.map((module, index) => (
          <ScopeRow
            label={`Módulo ${index + 1}`}
            key={`${module.name}-${index}`}
          >
            {module.name} · {internalSystemOptionLabel(module.complexity)}
            {module.description ? ` · ${module.description}` : ""}
          </ScopeRow>
        ))}
      </ScopeGroup>

      <ScopeGroup title="Acesso e processos">
        <ScopeRow label="Permissões">
          {internalSystemOptionLabel(scope.permissionModel)}
        </ScopeRow>
        <ScopeRow label="Autenticação adicional">
          {optionList(scope.additionalAuthentication)}
        </ScopeRow>
        <ScopeRow label="Workflow global">
          {internalSystemOptionLabel(scope.workflowLevel)}
        </ScopeRow>
        <ScopeRow label="Documentos">
          {internalSystemOptionLabel(scope.documentManagement)}
        </ScopeRow>
      </ScopeGroup>

      <ScopeGroup title="Dados e integrações">
        <ScopeRow label="Dashboards">{scope.dashboardCount}</ScopeRow>
        <ScopeRow label="Relatórios">{scope.reportCount}</ScopeRow>
        <ScopeRow label="Notificações adicionais">
          {optionList(scope.additionalNotificationChannels)}
        </ScopeRow>
        <ScopeRow label="Integrações">{scope.integrations.length}</ScopeRow>
        {scope.integrations.map((integration, index) => (
          <ScopeRow
            label={`Integração ${index + 1}`}
            key={`${integration.name}-${index}`}
          >
            {integration.name} · {internalSystemOptionLabel(integration.complexity)}
            {integration.description ? ` · ${integration.description}` : ""}
          </ScopeRow>
        ))}
        <ScopeRow label="Migração de dados">
          {internalSystemOptionLabel(scope.dataMigration)}
        </ScopeRow>
        {scope.dataMigration !== "NONE" && (
          <>
            <ScopeRow label="Fontes de dados">
              {scope.dataMigrationSourceCount}
            </ScopeRow>
            <ScopeRow label="Descrição das fontes">
              {scope.dataMigrationDescription}
            </ScopeRow>
          </>
        )}
      </ScopeGroup>

      <ScopeGroup title="Operação e condições comerciais">
        <ScopeRow label="Hospedagem">
          {internalSystemOptionLabel(scope.hostingPlan)}
        </ScopeRow>
        <ScopeRow label="Manutenção">
          {internalSystemOptionLabel(scope.maintenancePlan)}
        </ScopeRow>
        <ScopeRow label="Complexidade global">
          {internalSystemOptionLabel(scope.complexityAdjustment)}
        </ScopeRow>
        {scope.complexityReason && (
          <ScopeRow label="Justificativa da complexidade">
            {scope.complexityReason}
          </ScopeRow>
        )}
        <ScopeRow label="Desconto">
          {scope.discountPercentage.toFixed(2)}%
        </ScopeRow>
        {scope.discountReason && (
          <ScopeRow label="Justificativa do desconto">
            {scope.discountReason}
          </ScopeRow>
        )}
      </ScopeGroup>

      <p className="m-0 border-t border-zinc-300 pt-4 text-[0.6875rem] leading-relaxed text-zinc-500">
        Custos de consumo de e-mail, WhatsApp, SMS, SSO ou outros fornecedores
        externos não estão incluídos, salvo indicação expressa.
      </p>
    </BudgetScopeAside>
  );
}
