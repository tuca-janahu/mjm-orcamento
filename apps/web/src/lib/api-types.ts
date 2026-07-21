import type {
  ApplicationType,
  AuthUser,
  BudgetStatus,
  ProjectStatus,
  WebPlatformBudgetInput,
  WebsiteBudgetInput
} from '@mjm/shared';

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
}

export type BudgetInputData = WebsiteBudgetInput | WebPlatformBudgetInput;

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
