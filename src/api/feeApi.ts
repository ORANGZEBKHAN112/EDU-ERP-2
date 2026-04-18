import api from '../services/apiClient';
import { useAuthContextStore } from '../store/authContextStore';
import { injectTenantContext } from '../utils/tenantHelper';

export const feeApi = {
  configure: async (data: { classId: number; monthlyFee: number; transportFee?: number }) => {
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
    return response.data;
  },
  getConfigurations: async () => {
    return [];
  },
  generateVouchers: async (data: { month: number; year: number }) => {
    const context = useAuthContextStore.getState();
    const campusId = context.campusIds?.[0];
    if (!campusId) {
      throw new Error('campusId is required to generate vouchers');
    }
    const month = `${data.year}-${String(data.month).padStart(2, '0')}`;
    const enrichedData = injectTenantContext({ campusId, month }, context);
    const response = await api.post('/fees/generate-vouchers', enrichedData);
    return response.data;
  },
  getVouchers: async (params?: any) => {
    return [];
  },
};
