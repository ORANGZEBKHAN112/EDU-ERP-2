import { ReportRepository, SummaryRepository } from '../repositories';

export class ReportService {
  private reportRepo = new ReportRepository();
  private summaryRepo = new SummaryRepository();

  async getSuperAdminOverview() {
    return this.reportRepo.getSuperAdminOverview();
  }

  async getCampusSummary(campusIds?: number[]) {
    return this.reportRepo.getCampusSummary(campusIds);
  }

  async getDefaulters(campusIds?: number[]) {
    const defaulters = await this.summaryRepo.getDefaulters();
    
    // Aging grouping
    return {
      all: defaulters,
      aging: {
        '30days': defaulters.filter(d => d.overdueDays > 0 && d.overdueDays <= 30),
        '60days': defaulters.filter(d => d.overdueDays > 30 && d.overdueDays <= 60),
        '90plus': defaulters.filter(d => d.overdueDays > 60)
      }
    };
  }

  async getPaymentInsights() {
    return this.summaryRepo.getPaymentInsights();
  }
}
