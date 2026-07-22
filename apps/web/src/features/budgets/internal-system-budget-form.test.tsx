import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { InternalSystemBudgetInput } from "@mjm/shared";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BudgetDto, ProjectSummary } from "../../lib/api-types";
import { InternalSystemBudgetForm } from "./internal-system-budget-form";

const apiMocks = vi.hoisted(() => ({
  get: vi.fn<(url: string) => Promise<unknown>>(),
  post: vi.fn<
    (url: string, data?: unknown, config?: unknown) => Promise<unknown>
  >(),
  patch: vi.fn<(url: string, data?: unknown) => Promise<unknown>>(),
}));

vi.mock("../../lib/api", () => ({
  api: apiMocks,
}));

const project: ProjectSummary = {
  id: "project-1",
  name: "Operação interna",
  clientName: "Cliente exemplo",
  description: null,
  applicationType: "SISTEMA_INTERNO",
  status: "PROSPECCAO",
  notes: null,
  createdAt: "2026-07-21T12:00:00.000Z",
  updatedAt: "2026-07-21T12:00:00.000Z",
  responsibleUser: {
    id: "user-1",
    name: "Responsável",
    email: "responsavel@example.com",
  },
  _count: { budgets: 0 },
};

const validInput: InternalSystemBudgetInput = {
  modules: [{ name: "Controle de contratos", complexity: "STANDARD" }],
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
};

function budgetDto(
  inputData: InternalSystemBudgetInput = validInput,
): BudgetDto<InternalSystemBudgetInput> {
  return {
    id: "budget-1",
    projectId: project.id,
    versionNumber: 1,
    status: "RASCUNHO",
    inputData,
    subtotal: "7500.00",
    complexityMultiplier: "1.0000",
    urgencyMultiplier: "1.0000",
    discountPercentage: "0.00",
    finalTotal: "7500.00",
    monthlyRecurringTotal: "0.00",
    notes: "Premissa carregada",
    createdAt: "2026-07-21T12:00:00.000Z",
    updatedAt: "2026-07-21T12:00:00.000Z",
    project: {
      id: project.id,
      name: project.name,
      applicationType: "SISTEMA_INTERNO",
    },
    createdBy: {
      id: "user-1",
      name: "Responsável",
      email: "responsavel@example.com",
    },
    items: [
      {
        id: "item-1",
        code: "INTERNAL_SYSTEM_BASE",
        name: "Base de Sistema Interno",
        description: null,
        category: "BASE",
        quantity: 1,
        unitPrice: "5000.00",
        totalPrice: "5000.00",
        recurring: false,
        displayOrder: 1,
        metadata: {
          includedAccessProfiles: 2,
          includedDashboards: 1,
          includedFeatures: [
            "EMAIL_PASSWORD_AUTH",
            "STANDARD_ROLES",
            "BASIC_ADMINISTRATION",
            "IN_APP_NOTIFICATIONS",
          ],
        },
      },
    ],
  };
}

function renderNewForm() {
  apiMocks.get.mockResolvedValueOnce({ data: { project } });
  apiMocks.post.mockResolvedValue({ data: { budget: budgetDto() } });

  return render(
    <MemoryRouter initialEntries={["/projects/project-1/budgets/new"]}>
      <Routes>
        <Route
          path="/projects/:projectId/budgets/new"
          element={<InternalSystemBudgetForm />}
        />
        <Route path="/budgets/:id" element={<div>Detalhe do orçamento</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function renderEditForm(inputData: InternalSystemBudgetInput = validInput) {
  apiMocks.get.mockResolvedValueOnce({
    data: { budget: budgetDto(inputData) },
  });
  apiMocks.patch.mockResolvedValue({
    data: { budget: budgetDto(inputData) },
  });

  return render(
    <MemoryRouter initialEntries={["/budgets/budget-1/edit"]}>
      <Routes>
        <Route
          path="/budgets/:id/edit"
          element={<InternalSystemBudgetForm />}
        />
        <Route path="/budgets/:id" element={<div>Detalhe do orçamento</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function fillRequiredModule(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Nome do módulo"), "Estoque");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function submittedInputData(): Record<string, unknown> {
  const payload = apiMocks.post.mock.calls[0]?.[1];
  if (!isRecord(payload) || !isRecord(payload.inputData)) {
    throw new Error("O payload submetido nao possui inputData");
  }
  return payload.inputData;
}

beforeEach(() => {
  vi.clearAllMocks();
  let uuidIndex = 0;
  vi.stubGlobal("crypto", {
    randomUUID: () => {
      uuidIndex += 1;
      return uuidIndex === 1 ? "creation-key" : `field-key-${uuidIndex}`;
    },
  });
});

describe("InternalSystemBudgetForm", () => {
  it("adds and removes modules and integrations and enforces the integration limit", async () => {
    const user = userEvent.setup();
    renderNewForm();

    await screen.findByText(/Operação interna/);
    await user.click(screen.getByRole("button", { name: "Adicionar módulo" }));
    expect(screen.getAllByLabelText("Nome do módulo")).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "Remover módulo 2" }));
    expect(screen.getAllByLabelText("Nome do módulo")).toHaveLength(1);

    const addIntegration = screen.getByRole("button", {
      name: "Adicionar integração",
    });
    for (let index = 0; index < 10; index += 1) {
      await user.click(addIntegration);
    }
    expect(screen.getAllByLabelText("Nome da integração")).toHaveLength(10);
    expect(addIntegration).toBeDisabled();

    await user.click(
      screen.getByRole("button", { name: "Remover integração 10" }),
    );
    expect(screen.getAllByLabelText("Nome da integração")).toHaveLength(9);
    expect(addIntegration).toBeEnabled();
  });

  it("shows normalized duplicate errors next to modules and integrations", async () => {
    const user = userEvent.setup();
    renderNewForm();

    const firstModule = screen.getByLabelText("Nome do módulo");
    await user.type(firstModule, " Gestão   de Estoque ");
    await user.click(screen.getByRole("button", { name: "Adicionar módulo" }));
    await user.type(
      screen.getAllByLabelText("Nome do módulo")[1]!,
      "gestao de estoque",
    );

    await user.click(
      screen.getByRole("button", { name: "Adicionar integração" }),
    );
    await user.type(
      screen.getByLabelText("Nome da integração"),
      "Integração ERP",
    );
    await user.click(
      screen.getByRole("button", { name: "Adicionar integração" }),
    );
    await user.type(
      screen.getAllByLabelText("Nome da integração")[1]!,
      "integracao erp",
    );

    await user.click(screen.getByRole("button", { name: "Salvar rascunho" }));

    expect(
      await screen.findByText("Os nomes dos módulos não podem se repetir"),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Os nomes das integrações não podem se repetir"),
    ).toBeInTheDocument();
    expect(apiMocks.post).not.toHaveBeenCalled();
  });

  it("requires migration data and clears stale source fields when migration is disabled", async () => {
    const user = userEvent.setup();
    renderNewForm();
    await fillRequiredModule(user);

    await user.selectOptions(
      screen.getByLabelText("Migração de dados"),
      "LEGACY_MIGRATION",
    );
    expect(screen.getByLabelText("Fontes de dados")).toBeInTheDocument();
    expect(screen.getByLabelText("Descrição das fontes")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Salvar rascunho" }));
    expect(
      await screen.findByText("Informe ao menos uma fonte para migração de dados"),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Descreva as fontes da migração de dados"),
    ).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Fontes de dados"));
    await user.type(screen.getByLabelText("Fontes de dados"), "2");
    await user.type(
      screen.getByLabelText("Descrição das fontes"),
      "Banco legado e planilha histórica",
    );
    await user.selectOptions(screen.getByLabelText("Migração de dados"), "NONE");

    expect(screen.queryByLabelText("Fontes de dados")).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Descrição das fontes"),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Salvar rascunho" }));
    await waitFor(() => expect(apiMocks.post).toHaveBeenCalledTimes(1));
    const inputData = submittedInputData();
    expect(inputData.dataMigrationSourceCount).toBe(0);
    expect(inputData.dataMigrationDescription).toBeUndefined();
    expect(JSON.parse(JSON.stringify(inputData))).not.toHaveProperty(
      "dataMigrationDescription",
    );
  });

  it("requires conditional reasons, clears obsolete values, and warns about a one-module workflow", async () => {
    const user = userEvent.setup();
    renderNewForm();
    await fillRequiredModule(user);

    await user.selectOptions(screen.getByLabelText("Workflow global"), "SIMPLE");
    expect(
      screen.getByRole("alert", {
        name: "",
      }),
    ).toHaveTextContent(
      "Utilize um workflow global quando o processo atravessar mais de um módulo",
    );
    await user.click(screen.getByRole("button", { name: "Adicionar módulo" }));
    expect(
      screen.queryByText(
        /Utilize um workflow global quando o processo atravessar mais de um módulo/,
      ),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remover módulo 2" }));

    await user.selectOptions(
      screen.getByLabelText("Ajuste de complexidade"),
      "MODERATE",
    );
    const complexityReason = await screen.findByLabelText(
      "Justificativa da complexidade",
    );
    const discountPercentage = screen.getByLabelText("Desconto percentual");
    await user.clear(discountPercentage);
    await user.type(discountPercentage, "10");
    const discountReason = await screen.findByLabelText(
      "Justificativa do desconto",
    );
    await user.click(screen.getByRole("button", { name: "Salvar rascunho" }));
    expect(
      await screen.findByText("Justifique o ajuste de complexidade"),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Justifique o desconto aplicado"),
    ).toBeInTheDocument();

    await user.type(complexityReason, "Dependências críticas entre módulos");
    await user.type(discountReason, "Condição comercial aprovada");
    await user.selectOptions(
      screen.getByLabelText("Ajuste de complexidade"),
      "NONE",
    );
    await user.clear(discountPercentage);
    await user.type(discountPercentage, "0");

    expect(
      screen.queryByLabelText("Justificativa da complexidade"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Justificativa do desconto"),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Salvar rascunho" }));
    await waitFor(() => expect(apiMocks.post).toHaveBeenCalledTimes(1));
    const inputData = submittedInputData();
    expect(inputData.complexityReason).toBeUndefined();
    expect(inputData.discountReason).toBeUndefined();
    const serializedInputData = JSON.parse(JSON.stringify(inputData)) as unknown;
    expect(serializedInputData).not.toHaveProperty("complexityReason");
    expect(serializedInputData).not.toHaveProperty("discountReason");
  });

  it("loads and updates an existing draft with its complete scope", async () => {
    const user = userEvent.setup();
    const draftInput: InternalSystemBudgetInput = {
      ...validInput,
      modules: [
        {
          name: "Controle de contratos",
          description: "Prazos e renovações",
          complexity: "STANDARD",
        },
      ],
      accessProfileCount: 4,
      additionalAuthentication: ["CORPORATE_SSO"],
      integrations: [
        {
          name: "ERP corporativo",
          description: "Sincronização financeira",
          complexity: "COMPLEX",
        },
      ],
      dataMigration: "STRUCTURED_IMPORT",
      dataMigrationSourceCount: 1,
      dataMigrationDescription: "Planilha de contratos",
    };
    renderEditForm(draftInput);

    expect(
      await screen.findByDisplayValue("Controle de contratos"),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("ERP corporativo")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Premissa carregada")).toBeInTheDocument();
    expect(screen.getByText("Último cálculo salvo")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Perfis de acesso"));
    await user.type(screen.getByLabelText("Perfis de acesso"), "5");
    await user.click(screen.getByRole("button", { name: "Salvar rascunho" }));

    await waitFor(() => expect(apiMocks.patch).toHaveBeenCalledTimes(1));
    expect(apiMocks.patch.mock.calls[0]?.[0]).toBe("/budgets/budget-1");
    const patchPayload = apiMocks.patch.mock.calls[0]?.[1];
    if (!isRecord(patchPayload) || !isRecord(patchPayload.inputData)) {
      throw new Error("O PATCH nao possui inputData");
    }
    expect(patchPayload.inputData.accessProfileCount).toBe(5);
  });

  it("persists the validated payload before finalizing through the existing route", async () => {
    const user = userEvent.setup();
    renderNewForm();
    await fillRequiredModule(user);
    apiMocks.post.mockImplementation((url) =>
      Promise.resolve({
        data: {
          budget: {
            ...budgetDto(),
            status: url.endsWith("/finalize") ? "FINALIZADO" : "RASCUNHO",
          },
        },
      }),
    );

    await user.click(
      screen.getByRole("button", { name: "Finalizar orçamento" }),
    );
    const dialog = await screen.findByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Finalizar orçamento" }),
    );

    await waitFor(() => expect(apiMocks.post).toHaveBeenCalledTimes(2));
    const creationCall = apiMocks.post.mock.calls.find(
      ([url]) => url === "/projects/project-1/budgets",
    );
    expect(creationCall).toBeDefined();
    if (creationCall === undefined) throw new Error("Criacao nao encontrada");

    expect(isRecord(creationCall[1])).toBe(true);
    const serializedCreationPayload = JSON.parse(
      JSON.stringify(creationCall[1]),
    ) as unknown;
    expect(serializedCreationPayload).toEqual({
      inputData: {
        ...validInput,
        modules: [{ name: "Estoque", complexity: "STANDARD" }],
      },
    });
    if (!isRecord(creationCall[2]) || !isRecord(creationCall[2].headers)) {
      throw new Error("Cabecalho de idempotencia nao encontrado");
    }
    expect(creationCall[2].headers["Idempotency-Key"]).toBe("creation-key");
    expect(
      apiMocks.post.mock.calls.some(
        ([url]) => url === "/budgets/budget-1/finalize",
      ),
    ).toBe(true);
  });
});
