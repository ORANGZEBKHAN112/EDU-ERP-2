import api from '../services/apiClient';

export const authApi = {
  /**
   * Login with email and password
   * Returns user object with roles and campusIds
   */
  login: async (credentials: any): Promise<any> => {
    const response = await api.post('/auth/login', credentials);
    // Handle both new standardized format and legacy
    const data = response.data?.data ?? response.data;
    if (!data || !data.user) {
      throw new Error('Invalid login response format');
    }
    // Ensure roles is always an array of strings
    return {
      token: data.token,
      user: {
        ...data.user,
        roles: Array.isArray(data.user.roles) 
          ? data.user.roles.map(r => String(r).toLowerCase())
          : [],
        campusIds: Array.isArray(data.user.campusIds) ? data.user.campusIds : [],
        schoolId: data.user.schoolId || 0
      }
    };
  },
};
