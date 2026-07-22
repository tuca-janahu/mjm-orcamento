import type {
  ApplicationType,
  AuthUser,
  BudgetStatus,
  InternalSystemBudgetInput,
  ProjectStatus,
  WebPlatformBudgetInput,
  WebsiteBudgetInput
} from '@mjm/shared';

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export interface ProjectSummary {
  id: string;
  name: string;
  clientName: string | null;
  description: string | null;
  applicationType: ApplicationType;
  status: ProjectStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  responsibleUser: Pick<AuthUser, 'id' | 'name' | 'email'>;
  _count: { budgets: number };
}

export interface BudgetItemDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  recurring: boolean;
  displayOrder: number;
  metadata: JsonObject | null;
}

export type BudgetInputData =
  | WebsiteBudgetInput
  | WebPlatformBudgetInput
  | InternalSystemBudgetInput;

export interface BudgetDto<TInputData extends BudgetInputData = BudgetInputData> {
  id: string;
  projectId: string;
  versionNumber: number;
  status: BudgetStatus;
  inputData: TInputData;
  subtotal: string;
  complexityMultiplier: string;
  urgencyMultiplier: string;
  discountPercentage: string;
  finalTotal: string;
  monthlyRecurringTotal: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  project: Pick<ProjectSummary, 'id' | 'name' | 'applicationType'>;
  createdBy: Pick<AuthUser, 'id' | 'name' | 'email'>;
  items: BudgetItemDto[];
}

export interface AuthenticatedOutletContext {
  user: AuthUser;
}
