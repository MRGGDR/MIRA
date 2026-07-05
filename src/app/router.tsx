import { Navigate, Route, Routes } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { AuditPage } from '@/features/audit/AuditPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { ActionCreatePage } from '@/features/actions/pages/ActionCreatePage';
import { ActionDetailPage } from '@/features/actions/pages/ActionDetailPage';
import { ActionEditPage } from '@/features/actions/pages/ActionEditPage';
import { ActionsListPage } from '@/features/actions/pages/ActionsListPage';
import { ConfigurationPage } from '@/features/configuration/ConfigurationPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <MainLayout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="/acciones" element={<ActionsListPage />} />
        <Route path="/acciones/nueva" element={<ActionCreatePage />} />
        <Route path="/acciones/:id" element={<ActionDetailPage />} />
        <Route path="/acciones/:id/editar" element={<ActionEditPage />} />
        <Route path="/historial" element={<AuditPage />} />
        <Route path="/configuracion" element={<ConfigurationPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
