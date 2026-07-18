import { BrowserRouter, Route, Routes } from 'react-router';
import { AuthenticatedHomePage } from '../features/auth/authenticated-home-page';
import { LoginPage } from '../features/auth/login-page';
import { ProtectedLayout } from './protected-layout';
import { ProjectListPage } from '../features/projects/project-list-page';
import { ProjectFormPage } from '../features/projects/project-form-page';
import { ProjectDetailPage } from '../features/projects/project-detail-page';
import { BudgetFormPage } from '../features/budgets/budget-form-page';
import { BudgetDetailPage } from '../features/budgets/budget-detail-page';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<AuthenticatedHomePage />} />
          <Route path="/projects" element={<ProjectListPage />} />
          <Route path="/projects/new" element={<ProjectFormPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/projects/:projectId/budgets/new" element={<BudgetFormPage />} />
          <Route path="/budgets/:id" element={<BudgetDetailPage />} />
          <Route path="/budgets/:id/edit" element={<BudgetFormPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
