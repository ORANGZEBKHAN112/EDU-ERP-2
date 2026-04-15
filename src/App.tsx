import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { StudentsPage } from './pages/StudentsPage';
import { FeesPage } from './pages/FeesPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { LedgerPage } from './pages/LedgerPage';
import { SystemHealthPage } from './pages/SystemHealthPage';
import TenantManagementPage from './modules/admin/TenantManagementPage';
import CampusListPage from './modules/system/CampusListPage';
import UserManagementPage from './modules/admin/UserManagementPage';
import { Toaster } from 'sonner';

const App: React.FC = () => {
  return (
    <>
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Dashboard Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="tenants" element={<TenantManagementPage />} />
          <Route path="campuses" element={<CampusListPage />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="fees" element={<FeesPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="ledger/:studentId" element={<LedgerPage />} />
          <Route path="system-health" element={<SystemHealthPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
    </>
  );
};

export default App;
