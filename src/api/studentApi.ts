import api from '../services/apiClient';
import { useAuthContextStore } from '../store/authContextStore';
import { injectTenantContext } from '../utils/tenantHelper';

export const studentApi = {
  getAll: async (params?: any) => {
    const context = useAuthContextStore.getState();
    const enrichedParams = injectTenantContext(params || {}, context);
    const response = await api.get('/students', { params: enrichedParams });
    return response.data;
  },
  getById: async (id: number) => {
    const context = useAuthContextStore.getState();
    const params = injectTenantContext({}, context);
    const response = await api.get(`/students/${id}`, { params });
    return response.data;
  },
  create: async (data: any) => {
    const context = useAuthContextStore.getState();
    const enrichedData = injectTenantContext(data, context);
    const response = await api.post('/students', enrichedData);
    return response.data;
  },
  update: async (id: number, data: any) => {
    const context = useAuthContextStore.getState();
    const enrichedData = injectTenantContext(data, context);
    const response = await api.put(`/students/${id}`, enrichedData);
    return response.data;
  },
  delete: async (id: number) => {
    const context = useAuthContextStore.getState();
    const params = injectTenantContext({}, context);
    const response = await api.delete(`/students/${id}`, { params });
    return response.data;
  },
};
