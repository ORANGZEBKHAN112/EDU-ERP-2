import api from './axios';

export const classApi = {
  getAll: async (params?: any) => {
    const response = await api.get('/classes', { params });
    return response.data;
  },
};
