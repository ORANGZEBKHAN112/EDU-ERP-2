import api from '../services/apiClient';
import { useAuthContextStore } from '../store/authContextStore';
import { injectTenantContext } from '../utils/tenantHelper';
import { normalizeArrayResponse } from '../utils/apiResponseNormalizer';

export const ledgerApi = {
  /**
   * Get student fee ledger
   */
  getStudentLedger: async (studentId: number): Promise<any[]> => {
    const context = useAuthContextStore.getState();
    const params = injectTenantContext({}, context);
    const response = await api.get(`/fees/ledger/${studentId}`, { params });
    return normalizeArrayResponse(response.data?.data ?? response.data);
  }
};
