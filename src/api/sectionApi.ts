import api from '../services/apiClient';
import { useAuthContextStore } from '../store/authContextStore';
import { injectTenantContext } from '../utils/tenantHelper';
import { normalizeArrayResponse } from '../utils/apiResponseNormalizer';

export const sectionApi = {
  /**
   * Get all sections for a class
   * Returns normalized array of sections
   */
  getByClass: async (classId: number, schoolId?: number): Promise<any[]> => {
    if (!classId) {
      throw new Error('classId is required');
    }
    const params = schoolId ? { schoolId } : {};
    const response = await api.get(`/sections/class/${classId}`, { params });
    return normalizeArrayResponse(response.data?.data ?? response.data);
  },

  /**
   * Get all sections for a school (admin view)
   */
  getBySchool: async (schoolId: number): Promise<any[]> => {
    if (!schoolId) {
      throw new Error('schoolId is required');
    }
    const response = await api.get(`/sections/school/${schoolId}`);
    return normalizeArrayResponse(response.data?.data ?? response.data);
  },

  /**
   * Get a single section by ID
   */
  getById: async (id: number): Promise<any> => {
    if (!id) {
      throw new Error('id is required');
    }
    const response = await api.get(`/sections/${id}`);
    return response.data?.data ?? response.data;
  },

  /**
   * Create a new section
   * Signature: create(schoolId, campusId, classId, sectionName)
   */
  create: async (schoolId: number, campusId: number, classId: number, sectionName: string): Promise<any> => {
    if (!schoolId || !campusId || !classId || !sectionName) {
      throw new Error('schoolId, campusId, classId, and sectionName are required');
    }
    const context = useAuthContextStore.getState();
    const response = await api.post('/sections', {
      schoolId,
      campusId,
      classId,
      name: sectionName,
      ...injectTenantContext({}, context)
    });
    return response.data?.data ?? response.data;
  },

  /**
   * Update a section
   * Signature: update(id, schoolId, sectionName)
   */
  update: async (id: number, schoolId: number, sectionName: string): Promise<any> => {
    if (!id || !schoolId) {
      throw new Error('id and schoolId are required');
    }
    const context = useAuthContextStore.getState();
    const response = await api.put(`/sections/${id}`, {
      name: sectionName,
      ...injectTenantContext({ schoolId }, context)
    });
    return response.data?.data ?? response.data;
  },

  /**
   * Delete a section
   */
  delete: async (id: number, schoolId: number): Promise<boolean> => {
    if (!id || !schoolId) {
      throw new Error('id and schoolId are required');
    }
    const response = await api.delete(`/sections/${id}`, { data: { schoolId } });
    return response.data?.success ?? true;
  },
};
