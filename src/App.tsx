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
import { AuditLogPage } from './pages/AuditLogPage';
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
          <Route path="dashboard" element={
            <ProtectedRoute allowedRoles={['SuperAdmin', 'CampusAdmin', 'FinanceAdmin', 'Principal']}>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="tenants" element={
            <ProtectedRoute allowedRoles={['SuperAdmin']}>
              <TenantManagementPage />
            </ProtectedRoute>
          } />
          <Route path="campuses" element={
            <ProtectedRoute allowedRoles={['SuperAdmin', 'CampusAdmin', 'Principal']}>
              <CampusListPage />
            </ProtectedRoute>
          } />
          <Route path="users" element={
            <ProtectedRoute allowedRoles={['SuperAdmin', 'CampusAdmin', 'Principal']}>
              <UserManagementPage />
            </ProtectedRoute>
          } />
          <Route path="students" element={
            <ProtectedRoute allowedRoles={['SuperAdmin', 'CampusAdmin', 'Principal']}>
              <StudentsPage />
            </ProtectedRoute>
          } />
          <Route path="fees" element={
            <ProtectedRoute allowedRoles={['SuperAdmin', 'FinanceAdmin']}>
              <FeesPage />
            </ProtectedRoute>
          } />
          <Route path="payments" element={
            <ProtectedRoute allowedRoles={['SuperAdmin', 'FinanceAdmin']}>
              <PaymentsPage />
            </ProtectedRoute>
          } />
          <Route path="ledger/:studentId" element={
            <ProtectedRoute allowedRoles={['SuperAdmin', 'FinanceAdmin']}>
              <LedgerPage />
            </ProtectedRoute>
          } />
          <Route path="system-health" element={
            <ProtectedRoute allowedRoles={['SuperAdmin']}>
              <SystemHealthPage />
            </ProtectedRoute>
          } />
          <Route path="audit-logs" element={
            <ProtectedRoute allowedRoles={['SuperAdmin', 'FinanceAdmin']}>
              <AuditLogPage />
            </ProtectedRoute>
          } />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
    </>
  );
};

export default App;
