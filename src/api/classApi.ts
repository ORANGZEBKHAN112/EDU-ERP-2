import api from '../services/apiClient';

export const classApi = {
  getAll: async (params?: any) => {
    const response = await api.get('/classes', { params });
    return response.data;
  },
};
