import api from '../services/apiClient';
import { useAuthContextStore } from '../store/authContextStore';
import { injectTenantContext } from '../utils/tenantHelper';
import { normalizeArrayResponse } from '../utils/apiResponseNormalizer';

export const paymentApi = {
  /**
   * Record a payment for a voucher
   */
  record: async (data: { 
    voucherId: number; 
    amount: number; 
    paymentMethod: string; 
    notes?: string;
    referenceId?: string;
  }): Promise<any> => {
    const context = useAuthContextStore.getState();
    const payload = {
      voucherId: data.voucherId,
      amountPaid: data.amount,
      paymentMethod: data.paymentMethod,
      transactionRef: data.referenceId || `PAY-${Date.now()}`
    };
    const enrichedData = injectTenantContext(payload, context);
    const response = await api.post('/payments/initiate', enrichedData);
    return response.data?.data ?? response.data;
  },

  /**
   * Get all payments with optional filters
   */
  getAll: async (params?: any): Promise<any[]> => {
    const context = useAuthContextStore.getState();
    const enrichedParams = injectTenantContext(params || {}, context);
    const response = await api.get('/reports/payments', { params: enrichedParams });
    return normalizeArrayResponse(response.data?.data ?? response.data);
  }
};
