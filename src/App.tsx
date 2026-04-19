import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { getAllowedRolesForPath } from './utils/rbac';
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
import ClassesPage from './pages/ClassesPage';
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
            <ProtectedRoute allowedRoles={getAllowedRolesForPath('/dashboard')}>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="tenants" element={
            <ProtectedRoute allowedRoles={getAllowedRolesForPath('/tenants')}>
              <TenantManagementPage />
            </ProtectedRoute>
          } />
          <Route path="campuses" element={
            <ProtectedRoute allowedRoles={getAllowedRolesForPath('/campuses')}>
              <CampusListPage />
            </ProtectedRoute>
          } />
          <Route path="classes" element={
            <ProtectedRoute allowedRoles={getAllowedRolesForPath('/classes')}>
              <ClassesPage />
            </ProtectedRoute>
          } />
          <Route path="users" element={
            <ProtectedRoute allowedRoles={getAllowedRolesForPath('/users')}>
              <UserManagementPage />
            </ProtectedRoute>
          } />
          <Route path="students" element={
            <ProtectedRoute allowedRoles={getAllowedRolesForPath('/students')}>
              <StudentsPage />
            </ProtectedRoute>
          } />
          <Route path="fees" element={
            <ProtectedRoute allowedRoles={getAllowedRolesForPath('/fees')}>
              <FeesPage />
            </ProtectedRoute>
          } />
          <Route path="payments" element={
            <ProtectedRoute allowedRoles={getAllowedRolesForPath('/payments')}>
              <PaymentsPage />
            </ProtectedRoute>
          } />
          <Route path="ledger/:studentId" element={
            <ProtectedRoute allowedRoles={getAllowedRolesForPath('/payments')}>
              <LedgerPage />
            </ProtectedRoute>
          } />
          <Route path="system-health" element={
            <ProtectedRoute allowedRoles={getAllowedRolesForPath('/system-health')}>
              <SystemHealthPage />
            </ProtectedRoute>
          } />
          <Route path="audit-logs" element={
            <ProtectedRoute allowedRoles={getAllowedRolesForPath('/audit-logs')}>
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
