import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../app/authStore';
import { useAuthContextStore } from '../../store/authContextStore';
import { canAccess } from '../../utils/rbac';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userContext = useAuthContextStore((state) => state.user);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Normalize user roles and handle empty cases
  const userRoles = (userContext?.roles || []).map(r => String(r).toLowerCase());
  
  if (allowedRoles && allowedRoles.length > 0) {
    const normalizedAllowed = allowedRoles.map(r => String(r).toLowerCase());
    const hasAccess = userRoles.some(role => normalizedAllowed.includes(role));

    if (!hasAccess && userRoles.length > 0) {
      console.warn('Unauthorized role access attempt:', { userRoles, normalizedAllowed });
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};
