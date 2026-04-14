import { poolPromise, sql } from '../../config/db';
import { IReconciliationRepository } from '../../interfaces/repositories/IReconciliationRepository';

export class ReconciliationRepository implements IReconciliationRepository {
  async getReports(): Promise<any[]> {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT TOP 50 * FROM ReconciliationReports ORDER BY CreatedAt DESC');
    return result.recordset;
  }

  async saveReport(report: any): Promise<void> {
    const pool = await poolPromise;
    await pool.request()
      .input('studentId', sql.Int, report.studentId)
      .input('expectedBalance', sql.Decimal(18, 2), report.expectedBalance)
      .input('actualBalance', sql.Decimal(18, 2), report.actualBalance)
      .input('status', sql.NVarChar, report.status)
      .input('details', sql.NVarChar, report.details)
      .query(`
        INSERT INTO ReconciliationReports (StudentId, ExpectedBalance, ActualBalance, Status, Details)
        VALUES (@studentId, @expectedBalance, @actualBalance, @status, @details)
      `);
  }

  async calculateExpectedBalance(studentId: number): Promise<number> {
    const pool = await poolPromise;
    // Expected Balance = SUM(Charges) - SUM(Payments)
    // Charges = MonthlyFee + Fine - Discount (from Ledger)
    const result = await pool.request()
      .input('studentId', sql.Int, studentId)
      .query(`
        SELECT 
          SUM(MonthlyFee + Fine - Discount) as TotalCharges,
          SUM(PaidAmount) as TotalPaid
        FROM StudentFeeLedger
        WHERE StudentId = @studentId
      `);
    
    const { TotalCharges, TotalPaid } = result.recordset[0];
    return (TotalCharges || 0) - (TotalPaid || 0);
  }

  async getLatestStoredBalance(studentId: number): Promise<number> {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('studentId', sql.Int, studentId)
      .query('SELECT TOP 1 ClosingBalance FROM StudentFeeLedger WHERE StudentId = @studentId ORDER BY CreatedAt DESC');
    
    return result.recordset[0]?.ClosingBalance || 0;
  }
}
