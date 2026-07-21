import { webPlatformBudgetInputSchema } from "@mjm/shared";
import { z } from "zod";
import { labelFromEnum } from "../../../lib/format";

export const webPlatformBudgetFormSchema = z.object({
  inputData: webPlatformBudgetInputSchema,
  notes: z.string().trim().max(4_000).optional(),
});

export type WebPlatformBudgetFormValues = z.infer<
  typeof webPlatformBudgetFormSchema
>;

export const webPlatformDefaultValues: WebPlatformBudgetFormValues = {
  inputData: {
    platformCategory: "CLIENT_PORTAL",
    accountStructure: "SINGLE_ORGANIZATION",
    screenCount: 5,
    userRoleCount: 2,
    languageCount: 1,
    designApproach: "DESIGN_SYSTEM_ADAPTATION",
    functionalModules: [
      { name: "", description: undefined, complexity: "STANDARD" },
    ],
    adminBackoffice: "STANDARD",
    dashboardCount: 0,
    reportCount: 0,
    additionalAuthentication: [],
    paymentFeatures: [],
    notificationChannels: [],
    fileHandling: "NONE",
    auditLevel: "NONE",
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

export function platformOptionLabel(value: string): string {
  return optionLabels[value] ?? labelFromEnum(value);
}
