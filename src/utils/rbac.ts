export const hasRole = (userRoles: string[], allowedRoles: string[]) => {
  const normUser = (userRoles || []).map(r => r.toLowerCase());
  const normAllowed = (allowedRoles || []).map(r => r.toLowerCase());
  return normAllowed.some(role => normUser.includes(role));
};

export const canAccess = (user: any, allowedRoles: string[]) => {
  if (!user) return false;
  const roles = user.roles || user.user?.roles || [];
  return hasRole(roles, allowedRoles);
};
