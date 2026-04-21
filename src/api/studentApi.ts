import api from '../services/apiClient';
import { useAuthContextStore } from '../store/authContextStore';
import { injectTenantContext } from '../utils/tenantHelper';
import { normalizeArrayResponse } from '../utils/apiResponseNormalizer';

export const studentApi = {
  /**
   * Get all students with optional filters
   * Returns normalized array of students
   */
  getAll: async (params?: any): Promise<any[]> => {
    const context = useAuthContextStore.getState();
    const enrichedParams = injectTenantContext(params || {}, context);
    const response = await api.get('/students', { params: enrichedParams });
    return normalizeArrayResponse(response.data?.data ?? response.data);
  },

  /**
   * Get a single student by ID
   */
  getById: async (id: number): Promise<any> => {
    const context = useAuthContextStore.getState();
    const params = injectTenantContext({}, context);
    const response = await api.get(`/students/${id}`, { params });
    return response.data?.data ?? response.data;
  },

  /**
   * Create a new student
   */
  create: async (data: any): Promise<any> => {
    const context = useAuthContextStore.getState();
    const enrichedData = injectTenantContext(data, context);
    const response = await api.post('/students', enrichedData);
    return response.data?.data ?? response.data;
  },

  /**
   * Update an existing student
   */
  update: async (id: number, data: any): Promise<any> => {
    const context = useAuthContextStore.getState();
    const enrichedData = injectTenantContext(data, context);
    const response = await api.put(`/students/${id}`, enrichedData);
    return response.data?.data ?? response.data;
  },

  /**
   * Delete a student
   */
  delete: async (id: number): Promise<boolean> => {
    const context = useAuthContextStore.getState();
    const params = injectTenantContext({}, context);
    const response = await api.delete(`/students/${id}`, { params });
    return response.data?.success ?? true;
  },
};
