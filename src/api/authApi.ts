import api from '../services/apiClient';

export const authApi = {
  login: async (credentials: any) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
};
