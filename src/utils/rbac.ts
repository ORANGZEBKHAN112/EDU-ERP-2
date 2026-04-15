export const hasRole = (userRoles: string[], allowedRoles: string[]) => {
  return allowedRoles.some(role => userRoles.includes(role));
};

export const canAccess = (user: any, allowedRoles: string[]) => {
  if (!user || !user.roles) return false;
  return hasRole(user.roles, allowedRoles);
};
