import { internalSystemBudgetInputSchema } from "@mjm/shared";
import { z } from "zod";
import { labelFromEnum } from "../../../lib/format";

export const internalSystemBudgetFormSchema = z
  .object({
    inputData: internalSystemBudgetInputSchema,
    notes: z.string().trim().max(4_000).optional(),
  })
  .strict();

export type InternalSystemBudgetFormValues = z.infer<
  typeof internalSystemBudgetFormSchema
>;

export const internalSystemDefaultValues: InternalSystemBudgetFormValues = {
  inputData: {
    modules: [{ name: "", description: undefined, complexity: "STANDARD" }],
    accessProfileCount: 2,
    permissionModel: "STANDARD_ROLES",
    additionalAuthentication: [],
    workflowLevel: "NONE",
    documentManagement: "NONE",
    dashboardCount: 1,
    reportCount: 0,
    additionalNotificationChannels: [],
    integrations: [],
    dataMigration: "NONE",
    dataMigrationSourceCount: 0,
    hostingPlan: "CLIENT_MANAGED",
    maintenancePlan: "NONE",
    complexityAdjustment: "NONE",
    discountPercentage: 0,
  },
};

const optionLabels: Record<string, string> = {
  STANDARD_ROLES: "Permissões padrão por perfil",
  CUSTOM_PERMISSIONS: "Permissões personalizadas",
  MFA: "Autenticação multifator (MFA)",
  CORPORATE_SSO: "SSO corporativo",
  NONE: "Nenhum",
  SIMPLE: "Simples",
  STANDARD: "Padrão",
  COMPLEX: "Complexa",
  CUSTOM: "Personalizado",
  BASIC_ATTACHMENTS: "Anexos básicos",
  DOCUMENT_WORKFLOW: "Fluxo documental",
  EMAIL: "E-mail",
  WHATSAPP_SMS: "WhatsApp ou SMS",
  STRUCTURED_IMPORT: "Importação estruturada",
  LEGACY_MIGRATION: "Migração de sistema legado",
  CLIENT_MANAGED: "Gerenciado pelo cliente",
  MJM_STANDARD: "Hospedagem MJM padrão",
  MJM_MANAGED: "Hospedagem gerenciada pela MJM",
  ESSENTIAL: "Essencial",
  MODERATE: "Moderada",
  HIGH: "Alta",
};

export function internalSystemOptionLabel(value: string): string {
  return optionLabels[value] ?? labelFromEnum(value);
}
