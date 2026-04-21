import api from '../services/apiClient';
import { useAuthContextStore } from '../store/authContextStore';
import { injectTenantContext } from '../utils/tenantHelper';

export const feeApi = {
  /**
   * Configure fee structure for a class
   */
  configure: async (data: { classId: number; monthlyFee: number; transportFee?: number }): Promise<any> => {
    const context = useAuthContextStore.getState();
    const campusId = context.campusIds?.[0];
    if (!campusId) {
      throw new Error('campusId is required to configure fee structure');
    }
    const payload = {
      campusId,
      classId: data.classId,
      monthlyFee: data.monthlyFee,
      transportFee: data.transportFee || 0,
      examFee: 0,
      effectiveFromMonth: new Date().toISOString().slice(0, 7)
    };
    const enrichedData = injectTenantContext(payload, context);
    const response = await api.post('/fees/structure', enrichedData);
    return response.data?.data ?? response.data;
  },

  /**
   * Get fee configurations
   */
  getConfigurations: async (): Promise<any[]> => {
    try {
      const response = await api.get('/fees/configurations');
      return Array.isArray(response.data?.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []);
    } catch {
      return [];
    }
  },

  /**
   * Generate vouchers for a month/year
   */
  generateVouchers: async (data: { month: number; year: number }): Promise<any> => {
    const context = useAuthContextStore.getState();
    const campusId = context.campusIds?.[0];
    if (!campusId) {
      throw new Error('campusId is required to generate vouchers');
    }
    const month = `${data.year}-${String(data.month).padStart(2, '0')}`;
    const enrichedData = injectTenantContext({ campusId, month }, context);
    const response = await api.post('/fees/generate-vouchers', enrichedData);
    return response.data?.data ?? response.data;
  },

  /**
   * Get vouchers with optional filters
   */
  getVouchers: async (params?: any): Promise<any[]> => {
    try {
      const context = useAuthContextStore.getState();
      const enrichedParams = injectTenantContext(params || {}, context);
      const response = await api.get('/fees/vouchers', { params: enrichedParams });
      return Array.isArray(response.data?.data) ? response.data.data : (Array.isArray(response.data) ? response.data : []);
    } catch {
      return [];
    }
  },
};
