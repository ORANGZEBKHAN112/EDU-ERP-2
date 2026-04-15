export const injectTenantContext = (payload: any, context: any) => {
  return {
    ...payload,
    schoolId: context.schoolId,
    campusIds: context.campusIds
  };
};
