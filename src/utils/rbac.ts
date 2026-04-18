export type AppRole = 'SuperAdmin' | 'CampusAdmin' | 'FinanceAdmin' | 'Principal';

export interface FeaturePolicy {
  key: string;
  path: string;
  allowedRoles: AppRole[];
}

export const APP_FEATURES: FeaturePolicy[] = [
  { key: 'dashboard', path: '/dashboard', allowedRoles: ['SuperAdmin', 'CampusAdmin', 'FinanceAdmin', 'Principal'] },
  { key: 'students', path: '/students', allowedRoles: ['SuperAdmin', 'CampusAdmin', 'Principal'] },
  { key: 'fees', path: '/fees', allowedRoles: ['SuperAdmin', 'FinanceAdmin'] },
  { key: 'payments', path: '/payments', allowedRoles: ['SuperAdmin', 'FinanceAdmin'] },
  { key: 'campuses', path: '/campuses', allowedRoles: ['SuperAdmin', 'CampusAdmin', 'Principal'] },
  { key: 'users', path: '/users', allowedRoles: ['SuperAdmin', 'CampusAdmin', 'Principal'] },
  { key: 'tenants', path: '/tenants', allowedRoles: ['SuperAdmin'] },
  { key: 'system-health', path: '/system-health', allowedRoles: ['SuperAdmin'] },
  { key: 'audit-logs', path: '/audit-logs', allowedRoles: ['SuperAdmin', 'FinanceAdmin'] }
];

const LANDING_PRIORITY: AppRole[] = ['SuperAdmin', 'CampusAdmin', 'FinanceAdmin', 'Principal'];

const normalizeRoles = (roles: string[] = []): string[] =>
  roles.map(r => String(r).trim().toLowerCase());

export const hasRole = (userRoles: string[] = [], allowedRoles: string[] = []) => {
  const normalizedUser = normalizeRoles(userRoles);
  const normalizedAllowed = normalizeRoles(allowedRoles);
  return normalizedAllowed.some(role => normalizedUser.includes(role));
};

export const canAccess = (user: any, allowedRoles: string[] = []) => {
  if (!user) return false;
  const roles = user.roles || user.user?.roles || [];
  return hasRole(roles, allowedRoles);
};

export const getAllowedRolesForPath = (path: string): AppRole[] | undefined => {
  return APP_FEATURES.find(feature => feature.path === path)?.allowedRoles;
};

export const isPathAllowedForRoles = (path: string, userRoles: string[] = []): boolean => {
  const allowedRoles = getAllowedRolesForPath(path);
  if (!allowedRoles) {
    return true;
  }
  return hasRole(userRoles, allowedRoles);
};

export const getRoleLandingPath = (userRoles: string[] = []): string => {
  const matchedRole = LANDING_PRIORITY.find(role => hasRole(userRoles, [role]));
  if (!matchedRole) {
    return '/dashboard';
  }

  switch (matchedRole) {
    case 'SuperAdmin':
      return '/dashboard';
    case 'CampusAdmin':
      return '/campuses';
    case 'FinanceAdmin':
      return '/payments';
    case 'Principal':
      return '/students';
    default:
      return '/dashboard';
  }
};
