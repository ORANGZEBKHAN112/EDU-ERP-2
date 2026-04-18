import api from '../services/apiClient';
import { useAuthContextStore } from '../store/authContextStore';
import { injectTenantContext } from '../utils/tenantHelper';

export const classApi = {
  getAll: async (params?: any) => {
    const context = useAuthContextStore.getState();
    const campusId = params?.campusId ?? context.campusIds?.[0];
    if (!campusId) {
      throw new Error('campusId is required to fetch classes');
    }
    const enrichedParams = injectTenantContext(params || {}, context);
    const response = await api.get(`/classes/${campusId}`, { params: enrichedParams });
    return response.data;
  },
};
