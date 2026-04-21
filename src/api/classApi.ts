import api from '../services/apiClient';

export const classApi = {
  getAll: async () => {
    const response = await api.get('/classes');
    return response.data;
  },
  getByCampus: async (campusId: number) => {
    const response = await api.get(`/classes/${campusId}`);
    return response.data;
  },
  create: async (data: { campusId: number; name: string }) => {
    const response = await api.post('/classes', data);
    return response.data;
  },
};
