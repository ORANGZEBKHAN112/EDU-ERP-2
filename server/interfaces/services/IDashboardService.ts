export interface IDashboardService {
  getSuperAdminStats(): Promise<any>;
  getCampusDashboard(campusId: number): Promise<any>;
}
