import * as sql from 'mssql';

export interface ISummaryRepository {
  updateCampusMonthlySummary(campusId: number, month: string, transaction?: sql.Transaction): Promise<void>;
  getSuperAdminStats(): Promise<any>;
  getMonthlyRevenueTrend(): Promise<any[]>;
  getCampusStats(campusId: number): Promise<any>;
  getDefaulters(): Promise<any[]>;
  getPaymentInsights(): Promise<any>;
}
