import type {
  BudgetInputData,
  InternalSystemBudgetInput,
  WebPlatformBudgetInput,
  WebsiteBudgetInput,
} from "@mjm/shared";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentType } from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BudgetDto, ProjectSummary } from "../../lib/api-types";
import { InternalSystemBudgetForm } from "./internal-system-budget-form";
import { WebPlatformBudgetForm } from "./web-platform-budget-form";
import { WebsiteBudgetForm } from "./website-budget-form";

const apiMocks = vi.hoisted(() => ({
  get: vi.fn<(url: string) => Promise<unknown>>(),
  post: vi.fn<(url: string, data?: unknown, config?: unknown) => Promise<unknown>>(),
  patch: vi.fn<(url: string, data?: unknown) => Promise<unknown>>(),
}));

vi.mock("../../lib/api", () => ({ api: apiMocks }));

type BudgetFormCase = {
  name: string;
  applicationType: ProjectSummary["applicationType"];
  Form: ComponentType;
  inputData: BudgetInputData;
};

const cases: BudgetFormCase[] = [
  {
    name: "Website",
    applicationType: "WEBSITE",
    Form: WebsiteBudgetForm,
    inputData: {
      websiteCategory: "INSTITUCIONAL",
      sectionCount: 5,
      pageCount: 5,
      uniqueLayoutCount: 2,
      languageCount: 1,
      contentResponsibility: "CLIENT_PROVIDES_READY",
      contentMigrationCount: 0,
      designApproach: "TEMPLATE_CUSTOMIZATION",
      contentManagement: "NONE",
      simpleFormCount: 0,
      advancedFormCount: 0,
      integrations: [],
      additionalModules: [],
      seoLevel: "TECHNICAL_BASELINE",
      domainService: "CLIENT_MANAGED",
      hostingPlan: "CLIENT_MANAGED",
      maintenancePlan: "NONE",
      complexityAdjustment: "NONE",
      discountPercentage: 0,
    } satisfies WebsiteBudgetInput,
  },
  {
    name: "Plataforma Web",
    applicationType: "PLATAFORMA_WEB",
    Form: WebPlatformBudgetForm,
    inputData: {
      platformCategory: "CLIENT_PORTAL",
      accountStructure: "SINGLE_ORGANIZATION",
      screenCount: 5,
      userRoleCount: 2,
      languageCount: 1,
      designApproach: "CLIENT_PROVIDED",
      functionalModules: [{ name: "Portal", complexity: "SIMPLE" }],
      adminBackoffice: "NONE",
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
    } satisfies WebPlatformBudgetInput,
  },
  {
    name: "Sistema Interno",
    applicationType: "SISTEMA_INTERNO",
    Form: InternalSystemBudgetForm,
    inputData: {
      modules: [{ name: "Estoque", complexity: "STANDARD" }],
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
    } satisfies InternalSystemBudgetInput,
  },
];

function projectFor(testCase: BudgetFormCase): ProjectSummary {
  return {
    id: "project-1",
    name: `Projeto ${testCase.name}`,
    clientName: null,
    description: null,
    applicationType: testCase.applicationType,
    status: "PROSPECCAO",
    notes: null,
    createdAt: "2026-07-22T12:00:00.000Z",
    updatedAt: "2026-07-22T12:00:00.000Z",
    responsibleUser: { id: "user-1", name: "Responsável", email: "responsavel@example.com" },
    _count: { budgets: 0 },
  };
}

function budgetFor(testCase: BudgetFormCase, status: "RASCUNHO" | "FINALIZADO" = "RASCUNHO"):
  BudgetDto {
  const project = projectFor(testCase);
  return {
    id: "budget-1",
    projectId: project.id,
    versionNumber: 1,
    status,
    inputData: testCase.inputData,
    subtotal: "100.00",
    complexityMultiplier: "1.0000",
    urgencyMultiplier: "1.0000",
    discountPercentage: "0.00",
    finalTotal: "100.00",
    monthlyRecurringTotal: "0.00",
    notes: "Premissa carregada",
    createdAt: "2026-07-22T12:00:00.000Z",
    updatedAt: "2026-07-22T12:00:00.000Z",
    project: { id: project.id, name: project.name, applicationType: project.applicationType },
    createdBy: project.responsibleUser,
    items: [],
  };
}

function renderNew(testCase: BudgetFormCase, recoveredBudget?: BudgetDto) {
  const Form = testCase.Form;
  apiMocks.get.mockResolvedValueOnce({ data: { project: projectFor(testCase) } });
  if (recoveredBudget) {
    apiMocks.get.mockResolvedValueOnce({ data: { budget: recoveredBudget } });
  }
  return render(
    <MemoryRouter initialEntries={["/projects/project-1/budgets/new"]}>
      <Routes>
        <Route path="/projects/:projectId/budgets/new" element={<Form />} />
        <Route path="/budgets/:id" element={<div>Detalhe do orçamento</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function renderEdit(testCase: BudgetFormCase) {
  const Form = testCase.Form;
  apiMocks.get.mockResolvedValueOnce({ data: { budget: budgetFor(testCase) } });
  return render(
    <MemoryRouter initialEntries={["/budgets/budget-1/edit"]}>
      <Routes>
        <Route path="/budgets/:id/edit" element={<Form />} />
        <Route path="/budgets/:id" element={<div>Detalhe do orçamento</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function findLoadedProject(testCase: BudgetFormCase) {
  const projectName = projectFor(testCase).name;

  return screen.findByText(
    (_content, element) => element?.tagName === "P" && element.textContent?.includes(projectName) === true,
  );
}

async function fillRequiredScopedItem(
  testCase: BudgetFormCase,
  user: { type: (element: HTMLElement, text: string) => Promise<void> },
) {
  if (testCase.applicationType === "PLATAFORMA_WEB") {
    await user.type(screen.getByLabelText("Nome do módulo"), "Portal");
  }

  if (testCase.applicationType === "SISTEMA_INTERNO") {
    await user.type(screen.getByLabelText("Nome do módulo"), "Estoque");
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("crypto", { randomUUID: () => "00000000-0000-4000-8000-000000000099" });
});

describe("budget form lifecycle", () => {
  it.each(cases)("creates, finalizes and redirects $name", async (testCase) => {
    const user = userEvent.setup();
    apiMocks.post.mockImplementation((url) => Promise.resolve({
      data: { budget: budgetFor(testCase, url.endsWith("/finalize") ? "FINALIZADO" : "RASCUNHO") },
    }));
    renderNew(testCase);

    await findLoadedProject(testCase);
    await fillRequiredScopedItem(testCase, user);
    await user.click(screen.getByRole("button", { name: "Finalizar orçamento" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Finalizar orçamento" }));

    await waitFor(() => expect(apiMocks.post).toHaveBeenCalledTimes(2));
    expect(apiMocks.post.mock.calls[0]?.[0]).toBe("/projects/project-1/budgets");
    expect(apiMocks.post.mock.calls[0]?.[2]).toEqual({
      headers: { "Idempotency-Key": "00000000-0000-4000-8000-000000000099" },
    });
    expect(apiMocks.post.mock.calls[1]?.[0]).toBe("/budgets/budget-1/finalize");
    expect(await screen.findByText("Detalhe do orçamento")).toBeInTheDocument();
  });

  it.each(cases)("loads and patches an existing $name draft", async (testCase) => {
    const user = userEvent.setup();
    apiMocks.patch.mockResolvedValue({ data: { budget: budgetFor(testCase) } });
    renderEdit(testCase);

    await findLoadedProject(testCase);
    await user.click(screen.getByRole("button", { name: "Salvar rascunho" }));

    await waitFor(() => expect(apiMocks.patch).toHaveBeenCalledTimes(1));
    expect(apiMocks.patch.mock.calls[0]?.[0]).toBe("/budgets/budget-1");
  });

  it.each(cases)("recovers a lost create response for $name", async (testCase) => {
    const user = userEvent.setup();
    apiMocks.post.mockRejectedValue({ isAxiosError: true, toJSON: () => ({}) });
    renderNew(testCase, budgetFor(testCase));

    await findLoadedProject(testCase);
    await fillRequiredScopedItem(testCase, user);
    await user.click(screen.getByRole("button", { name: "Salvar rascunho" }));

    await waitFor(() => expect(apiMocks.get).toHaveBeenCalledTimes(2));
    expect(apiMocks.get.mock.calls[1]?.[0]).toBe("/budgets/00000000-0000-4000-8000-000000000099");
    expect(await screen.findByText("Detalhe do orçamento")).toBeInTheDocument();
  });
});
