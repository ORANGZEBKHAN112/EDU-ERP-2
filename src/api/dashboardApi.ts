import api from '../services/apiClient';

export const dashboardApi = {
  getSuperAdminStats: async () => {
    const response = await api.get('/dashboard/superadmin');
    return response.data;
  },
  getCampusStats: async (campusId: number) => {
    const response = await api.get(`/dashboard/campus/${campusId}`);
    return response.data;
  }
};
