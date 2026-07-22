import { render, screen } from "@testing-library/react";
import type { InternalSystemBudgetInput } from "@mjm/shared";
import { describe, expect, it } from "vitest";
import { InternalSystemBudgetScope } from "./internal-system-budget-scope";

const scope: InternalSystemBudgetInput = {
  modules: [
    {
      name: "Controle de estoque",
      description: "Entradas, saídas e inventário",
      complexity: "STANDARD",
    },
  ],
  accessProfileCount: 3,
  targetLaunchDate: "2027-08-20",
  permissionModel: "CUSTOM_PERMISSIONS",
  additionalAuthentication: ["MFA", "CORPORATE_SSO"],
  workflowLevel: "SIMPLE",
  documentManagement: "BASIC_ATTACHMENTS",
  dashboardCount: 2,
  reportCount: 3,
  additionalNotificationChannels: ["EMAIL"],
  integrations: [
    {
      name: "ERP corporativo",
      description: "Sincronização do estoque",
      complexity: "COMPLEX",
    },
  ],
  dataMigration: "LEGACY_MIGRATION",
  dataMigrationSourceCount: 2,
  dataMigrationDescription: "Banco legado e planilha histórica",
  hostingPlan: "MJM_MANAGED",
  maintenancePlan: "STANDARD",
  complexityAdjustment: "MODERATE",
  complexityReason: "Regras compartilhadas críticas",
  discountPercentage: 10,
  discountReason: "Condição comercial aprovada",
};

describe("InternalSystemBudgetScope", () => {
  it("renders the complete internal-system scope and keeps notes separate", () => {
    render(
      <InternalSystemBudgetScope
        scope={scope}
        notes="Premissa geral do orçamento"
      />,
    );

    expect(screen.getByRole("heading", { name: "Sistema interno" })).toBeInTheDocument();
    expect(screen.getByText(/Controle de estoque/)).toHaveTextContent(
      "Controle de estoque · Padrão · Entradas, saídas e inventário",
    );
    expect(screen.getByText(/ERP corporativo/)).toHaveTextContent(
      "ERP corporativo · Complexa · Sincronização do estoque",
    );
    expect(screen.getByText("Banco legado e planilha histórica")).toBeInTheDocument();
    expect(screen.getByText(/SSO corporativo/)).toBeInTheDocument();
    expect(screen.getByText("Premissa geral do orçamento")).toBeInTheDocument();
    expect(
      screen.getByText(/Custos de consumo de e-mail, WhatsApp, SMS, SSO/),
    ).toBeInTheDocument();
  });
});
