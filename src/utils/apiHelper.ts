export const unwrap = (res: any) => {
  console.log('[DEBUG] API Response:', res);
  // Pierce through axios and data wrappers
  const data = res?.data?.data ?? res?.data ?? res;
  return data;
};

export const unwrapArray = (res: any): any[] => {
  const data = unwrap(res);
  return Array.isArray(data) ? data : [];
};
