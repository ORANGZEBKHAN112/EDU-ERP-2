import api from '../services/apiClient';
import { useAuthContextStore } from '../store/authContextStore';
import { injectTenantContext } from '../utils/tenantHelper';

export const feeApi = {
  configure: async (data: { classId: number; monthlyFee: number; transportFee?: number }) => {
    const context = useAuthContextStore.getState();
    const enrichedData = injectTenantContext(data, context);
    const response = await api.post('/fees/configure', enrichedData);
    return response.data;
  },
  getConfigurations: async () => {
    const context = useAuthContextStore.getState();
    const params = injectTenantContext({}, context);
    const response = await api.get('/fees/configurations', { params });
    return response.data;
  },
  generateVouchers: async (data: { month: number; year: number }) => {
    const context = useAuthContextStore.getState();
    const enrichedData = injectTenantContext(data, context);
    const response = await api.post('/vouchers/generate', enrichedData);
    return response.data;
  },
  getVouchers: async (params?: any) => {
    const context = useAuthContextStore.getState();
    const enrichedParams = injectTenantContext(params || {}, context);
    const response = await api.get('/vouchers', { params: enrichedParams });
    return response.data;
  },
};
