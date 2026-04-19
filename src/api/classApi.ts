import api from '../services/apiClient';
import { useAuthContextStore } from '../store/authContextStore';
import { injectTenantContext } from '../utils/tenantHelper';
import { normalizeArrayResponse, StandardResponse } from '../utils/apiResponseNormalizer';

export const classApi = {
  /**
   * Get all classes for a campus
   * Returns normalized array of classes
   */
  getAll: async (schoolId: number, campusId: number): Promise<any[]> => {
    const response = await api.get(`/classes/${campusId}`, { 
      params: { schoolId, campusId } 
    });
    return normalizeArrayResponse(response.data?.data ?? response.data);
  },

  /**
   * Get a single class by ID
   */
  getById: async (id: number): Promise<any> => {
    const response = await api.get(`/classes/${id}`);
    return response.data?.data ?? response.data;
  },

  /**
   * Create a new class
   */
  create: async (schoolId: number, campusId: number, className: string): Promise<any> => {
    const context = useAuthContextStore.getState();
    const response = await api.post('/classes', {
      schoolId,
      campusId,
      className,
      ...injectTenantContext({}, context)
    });
    return response.data?.data ?? response.data;
  },

  /**
   * Update an existing class
   */
  update: async (id: number, className: string): Promise<any> => {
    const context = useAuthContextStore.getState();
    const response = await api.put(`/classes/${id}`, {
      className,
      ...injectTenantContext({}, context)
    });
    return response.data?.data ?? response.data;
  },

  /**
   * Delete a class
   */
  delete: async (id: number): Promise<boolean> => {
    const response = await api.delete(`/classes/${id}`);
    return response.data?.success ?? true;
  },
};
