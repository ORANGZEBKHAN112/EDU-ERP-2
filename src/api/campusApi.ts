import api from '../services/apiClient';
import { normalizeArrayResponse } from '../utils/apiResponseNormalizer';

export const campusApi = {
  /**
   * Get all campuses
   */
  getAll: async (): Promise<any[]> => {
    const response = await api.get('/campuses');
    return normalizeArrayResponse(response.data?.data ?? response.data);
  },

  /**
   * Get campuses by school
   */
  getBySchool: async (schoolId: number): Promise<any[]> => {
    const response = await api.get(`/campuses/school/${schoolId}`);
    return normalizeArrayResponse(response.data?.data ?? response.data);
  },

  /**
   * Create a new campus
   */
  create: async (data: any): Promise<any> => {
    const response = await api.post('/campuses', data);
    return response.data?.data ?? response.data;
  },

  /**
   * Update a campus
   */
  update: async (id: number, data: any): Promise<any> => {
    const response = await api.put(`/campuses/${id}`, data);
    return response.data?.data ?? response.data;
  },
};
