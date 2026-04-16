import api from '../services/apiClient';

export const campusApi = {
  getAll: async () => {
    const response = await api.get('/campuses');
    return response.data;
  },
};
