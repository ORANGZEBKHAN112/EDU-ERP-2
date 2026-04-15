export const unwrap = (res: any) => {
  return res?.data?.data ?? res?.data ?? res;
};
