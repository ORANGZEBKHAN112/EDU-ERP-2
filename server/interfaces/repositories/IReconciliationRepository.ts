export interface IReconciliationRepository {
  getReports(): Promise<any[]>;
  saveReport(report: any): Promise<void>;
  calculateExpectedBalance(studentId: number): Promise<number>;
  getLatestStoredBalance(studentId: number): Promise<number>;
}
