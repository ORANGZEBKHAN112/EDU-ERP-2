import api from '../services/apiClient';

export const dashboardApi = {
  /**
   * Get dashboard stats for SuperAdmin
   */
  getSuperAdminStats: async (): Promise<any> => {
    const response = await api.get('/dashboard/superadmin');
    return response.data?.data ?? response.data ?? {};
  },

  /**
   * Get dashboard stats for a specific campus
   */
  getCampusStats: async (campusId: number): Promise<any> => {
    const response = await api.get(`/dashboard/campus/${campusId}`);
    return response.data?.data ?? response.data ?? {};
  }
};
