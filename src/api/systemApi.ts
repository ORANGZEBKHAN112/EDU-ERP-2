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

  getAuditLogs: async (limit = 100): Promise<any[]> => {
    const response = await api.get('/system/audit-logs', { params: { limit } });
    const payload = response.data?.data ?? response.data;
    return Array.isArray(payload) ? payload : [];
  },
};
