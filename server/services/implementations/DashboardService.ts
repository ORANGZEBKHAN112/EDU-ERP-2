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
    const stats = await this.summaryRepo.getCampusStats(campusId);
    const trend = await this.summaryRepo.getCampusRevenueTrend(campusId);
    return {
      ...stats,
      monthlyRevenueTrend: trend
    };
  }
}
