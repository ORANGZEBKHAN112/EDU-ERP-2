import api from './axios';
import { useAuthContextStore } from '../store/authContextStore';
import { injectTenantContext } from '../utils/tenantHelper';

export const paymentApi = {
  record: async (data: { 
    voucherId: number; 
    amount: number; 
    paymentMethod: string; 
    notes?: string 
  }) => {
    const context = useAuthContextStore.getState();
    const enrichedData = injectTenantContext(data, context);
    const response = await api.post('/payments', enrichedData);
    return response.data;
  },
  getAll: async (params?: any) => {
    const context = useAuthContextStore.getState();
    const enrichedParams = injectTenantContext(params || {}, context);
    const response = await api.get('/payments', { params: enrichedParams });
    return response.data;
  }
};
