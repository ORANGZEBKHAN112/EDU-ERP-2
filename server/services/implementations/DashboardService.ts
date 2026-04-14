import { ISummaryRepository } from '../../interfaces/repositories/ISummaryRepository';
import { IDashboardService } from '../../interfaces/services/IDashboardService';

export class DashboardService implements IDashboardService {
  constructor(private summaryRepo: ISummaryRepository) {}

  async getSuperAdminStats() {
    const stats = await this.summaryRepo.getSuperAdminStats();
    const trend = await this.summaryRepo.getMonthlyRevenueTrend();
    
    return {
      ...stats,
      monthlyRevenueTrend: trend
    };
  }

  async getCampusDashboard(campusId: number) {
    return this.summaryRepo.getCampusStats(campusId);
  }
}
