import api from '../services/apiClient';

export const systemApi = {
  /**
   * Get system health status
   */
  getHealth: async (): Promise<any> => {
    try {
      const response = await api.get('/system/health');
      return response.data?.data ?? response.data ?? { status: 'ok' };
    } catch {
      return { status: 'error' };
    }
  },
};
