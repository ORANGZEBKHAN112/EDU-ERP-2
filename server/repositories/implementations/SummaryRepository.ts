import { poolPromise, sql } from '../../config/db';
import { ISummaryRepository } from '../../interfaces/repositories/ISummaryRepository';

export class SummaryRepository implements ISummaryRepository {
  async updateCampusMonthlySummary(campusId: number, month: string, transaction?: sql.Transaction): Promise<void> {
    const request = transaction ? new sql.Request(transaction) : (await poolPromise).request();
    
    await request
      .input('campusId', sql.Int, campusId)
      .input('month', sql.NVarChar, month)
      .query(`
        MERGE INTO CampusMonthlySummary AS target
        USING (
          SELECT 
            @campusId as CampusId,
            @month as Month,
            SUM(PaidAmount) as TotalRevenue,
            SUM(ClosingBalance) as TotalPending,
            COUNT(DISTINCT StudentId) as TotalStudents,
            COUNT(DISTINCT CASE WHEN Status = 'Paid' THEN StudentId END) as PaidStudents,
            COUNT(DISTINCT CASE WHEN Status != 'Paid' THEN StudentId END) as UnpaidStudents
          FROM (
            SELECT StudentId, PaidAmount, ClosingBalance, Status,
                   ROW_NUMBER() OVER (PARTITION BY StudentId ORDER BY CreatedAt DESC) as rn
            FROM StudentFeeLedger
            WHERE CampusId = @campusId AND Month = @month
          ) as LatestLedger
          WHERE rn = 1
        ) AS source
        ON (target.CampusId = source.CampusId AND target.Month = source.Month)
        WHEN MATCHED THEN
          UPDATE SET 
            TotalRevenue = source.TotalRevenue,
            TotalPending = source.TotalPending,
            TotalStudents = source.TotalStudents,
            PaidStudents = source.PaidStudents,
            UnpaidStudents = source.UnpaidStudents,
            LastUpdated = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (CampusId, Month, TotalRevenue, TotalPending, TotalStudents, PaidStudents, UnpaidStudents, LastUpdated)
          VALUES (source.CampusId, source.Month, source.TotalRevenue, source.TotalPending, source.TotalStudents, source.PaidStudents, source.UnpaidStudents, GETDATE());
      `);
  }

  async getSuperAdminStats(): Promise<any> {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        ISNULL(SUM(TotalRevenue), 0) as totalRevenue,
        ISNULL(SUM(TotalPending), 0) as totalPendingDues,
        ISNULL(SUM(TotalStudents), 0) as totalStudents,
        CASE WHEN SUM(TotalRevenue + TotalPending) > 0 
             THEN (SUM(TotalRevenue) * 100.0 / SUM(TotalRevenue + TotalPending)) 
             ELSE 0 END as collectionRate
      FROM CampusMonthlySummary
    `);
    return result.recordset[0];
  }

  async getMonthlyRevenueTrend(): Promise<any[]> {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT Month as month, SUM(TotalRevenue) as revenue
      FROM CampusMonthlySummary
      GROUP BY Month
      ORDER BY Month ASC
    `);
    return result.recordset;
  }

  async getCampusStats(campusId: number): Promise<any> {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('campusId', sql.Int, campusId)
      .query(`
        SELECT 
          ISNULL(SUM(TotalRevenue), 0) as campusRevenue,
          ISNULL(SUM(TotalPending), 0) as pendingDues,
          ISNULL(SUM(PaidStudents), 0) as paidStudentsCount,
          ISNULL(SUM(UnpaidStudents), 0) as unpaidStudentsCount
        FROM CampusMonthlySummary
        WHERE CampusId = @campusId
      `);
    return result.recordset[0];
  }

  async getDefaulters(): Promise<any[]> {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        s.StudentId as studentId,
        s.FullName as name,
        c.CampusName as campus,
        l.ClosingBalance as outstandingAmount,
        DATEDIFF(day, v.DueDate, GETDATE()) as overdueDays
      FROM StudentFeeLedger l
      JOIN Students s ON l.StudentId = s.StudentId
      JOIN Campuses c ON l.CampusId = c.CampusId
      JOIN FeeVouchers v ON l.StudentId = v.StudentId AND l.Month = v.Month
      WHERE l.Status != 'Paid' AND l.ClosingBalance > 0
      AND l.LedgerId IN (
        SELECT MAX(LedgerId) FROM StudentFeeLedger GROUP BY StudentId, Month
      )
      ORDER BY overdueDays DESC
    `);
    return result.recordset;
  }

  async getPaymentInsights(): Promise<any> {
    const pool = await poolPromise;
    const daily = await pool.request().query(`
      SELECT CAST(PaidAt AS DATE) as date, SUM(AmountPaid) as amount
      FROM Payments
      GROUP BY CAST(PaidAt AS DATE)
      ORDER BY date ASC
    `);
    
    const methods = await pool.request().query(`
      SELECT PaymentMethod as method, SUM(AmountPaid) as amount
      FROM Payments
      GROUP BY PaymentMethod
    `);

    return {
      dailyCollections: daily.recordset,
      methodBreakdown: methods.recordset
    };
  }
}
