import api from '../services/apiClient';
import { useAuthContextStore } from '../store/authContextStore';
import { injectTenantContext } from '../utils/tenantHelper';

export const paymentApi = {
  record: async (data: { 
    voucherId: number; 
    amount: number; 
    paymentMethod: string; 
    notes?: string;
    referenceId?: string;
  }) => {
    const context = useAuthContextStore.getState();
    const payload = {
      voucherId: data.voucherId,
      amountPaid: data.amount,
      paymentMethod: data.paymentMethod,
      transactionRef: data.referenceId || `PAY-${Date.now()}`
    };
    const enrichedData = injectTenantContext(payload, context);
    const response = await api.post('/payments/initiate', enrichedData);
    return response.data;
  },
  getAll: async (params?: any) => {
    const context = useAuthContextStore.getState();
    const enrichedParams = injectTenantContext(params || {}, context);
    const response = await api.get('/reports/payments', { params: enrichedParams });
    return response.data;
  }
};
