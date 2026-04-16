const TOKEN_KEY = 'eduflow_token';

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

export const hasValidToken = (): boolean => {
  const token = getToken();
  // Basic validation: must be a non-empty string
  // In a real app, you might decode JWT and check expiration
  return !!token && token.length > 10;
};
