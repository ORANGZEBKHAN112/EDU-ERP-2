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
    try {
      console.log('📡 Fetching classes for campus:', campusId, 'school:', schoolId);
      const response = await api.get(`/classes/${campusId}`, { 
        params: { schoolId, campusId } 
      });
      console.log('✅ Classes API response:', response.data);
      const result = normalizeArrayResponse(response.data?.data ?? response.data);
      console.log('✅ Normalized result:', result);
      return result;
    } catch (error: any) {
      console.error('❌ Error fetching classes:', error.message);
      console.error('❌ Error details:', error.response?.data || error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch classes');
    }
  },

  /**
   * Get a single class by ID
   */
  getById: async (id: number): Promise<any> => {
    try {
      const response = await api.get(`/classes/id/${id}`);
      return response.data?.data ?? response.data;
    } catch (error: any) {
      console.error('❌ Error fetching class:', error.message);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch class');
    }
  },

  /**
   * Create a new class
   */
  create: async (schoolId: number, campusId: number, className: string): Promise<any> => {
    try {
      const context = useAuthContextStore.getState();
      const payload = {
        schoolId,
        campusId,
        className,
        ...injectTenantContext({}, context)
      };
      console.log('📡 Creating class with payload:', payload);
      const response = await api.post('/classes', payload);
      console.log('✅ Create response:', response.data);
      return response.data?.data ?? response.data;
    } catch (error: any) {
      console.error('❌ Error creating class:', error.message);
      console.error('❌ Error details:', error.response?.data || error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to create class');
    }
  },

  /**
   * Update an existing class
   */
  update: async (id: number, className: string): Promise<any> => {
    try {
      const context = useAuthContextStore.getState();
      const payload = {
        className,
        ...injectTenantContext({}, context)
      };
      const response = await api.put(`/classes/${id}`, payload);
      return response.data?.data ?? response.data;
    } catch (error: any) {
      console.error('❌ Error updating class:', error.message);
      throw new Error(error.response?.data?.message || error.message || 'Failed to update class');
    }
  },

  /**
   * Delete a class
   */
  delete: async (id: number, schoolId?: number): Promise<boolean> => {
    try {
      const response = await api.delete(`/classes/${id}`, { data: schoolId ? { schoolId } : {} });
      return response.data?.success ?? true;
    } catch (error: any) {
      console.error('❌ Error deleting class:', error.message);
      throw new Error(error.response?.data?.message || error.message || 'Failed to delete class');
    }
  },
};
