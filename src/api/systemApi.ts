import api from '../services/apiClient';

export const systemApi = {
  getHealth: async () => {
    const response = await api.get('/system/health');
    return response.data;
  },
};
