import api from '../services/apiClient';
import { useAuthContextStore } from '../store/authContextStore';
import { injectTenantContext } from '../utils/tenantHelper';

export const ledgerApi = {
  getStudentLedger: async (studentId: number) => {
    const context = useAuthContextStore.getState();
    const params = injectTenantContext({}, context);
    const response = await api.get(`/ledger/student/${studentId}`, { params });
    return response.data;
  }
};
