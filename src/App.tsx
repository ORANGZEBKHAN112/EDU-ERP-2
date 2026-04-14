import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './modules/auth/LoginPage';
import { Skeleton } from './components/ui/skeleton';

// Lazy load modules for performance
const DashboardPage = lazy(() => import('./modules/dashboard/DashboardPage'));
const StudentListPage = lazy(() => import('./modules/students/StudentListPage'));
const FeeManagementPage = lazy(() => import('./modules/fees/FeeManagementPage'));
const RecordPaymentPage = lazy(() => import('./modules/payments/RecordPaymentPage'));
const StudentLedgerPage = lazy(() => import('./modules/ledger/StudentLedgerPage'));
const SystemHealthPage = lazy(() => import('./modules/system/SystemHealthPage'));
const CampusListPage = lazy(() => import('./modules/system/CampusListPage'));
const TenantManagementPage = lazy(() => import('./modules/admin/TenantManagementPage'));
const UserManagementPage = lazy(() => import('./modules/admin/UserManagementPage'));
const ClassManagementPage = lazy(() => import('./modules/admin/ClassManagementPage'));
const RoleManagementPage = lazy(() => import('./modules/admin/RoleManagementPage'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div className="h-screen w-screen flex items-center justify-center"><Skeleton className="h-12 w-12 rounded-full" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="p-8"><Skeleton className="h-full w-full" /></div>}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DashboardPage />} />
            <Route path="students" element={<StudentListPage />} />
            <Route path="fees" element={<FeeManagementPage />} />
            <Route path="payments" element={<RecordPaymentPage />} />
            <Route path="campuses" element={<CampusListPage />} />
            <Route path="ledger/:studentId" element={<StudentLedgerPage />} />
            <Route path="system-health" element={<SystemHealthPage />} />

            {/* Admin Routes */}
            <Route path="admin/tenants" element={<TenantManagementPage />} />
            <Route path="admin/users" element={<UserManagementPage />} />
            <Route path="admin/roles" element={<RoleManagementPage />} />
            <Route path="admin/classes" element={<ClassManagementPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
