import { BrowserRouter, Route, Routes } from 'react-router';
import { AuthenticatedHomePage } from '../features/auth/authenticated-home-page';
import { LoginPage } from '../features/auth/login-page';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<AuthenticatedHomePage />} />
      </Routes>
    </BrowserRouter>
  );
}
