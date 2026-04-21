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
        (SELECT ISNULL(SUM(AmountPaid), 0) FROM Payments WHERE PaymentStatus = 'Completed') as totalRevenue,
        (SELECT ISNULL(SUM(ClosingBalance), 0) FROM StudentFeeLedger WHERE LedgerId IN (
          SELECT MAX(LedgerId) FROM StudentFeeLedger GROUP BY StudentId, Month
        )) as totalPendingDues,
        (SELECT COUNT(*) FROM Students WHERE IsActive = 1) as totalStudents,
        (SELECT COUNT(*) FROM Classes) as totalClasses
    `);
    
    const stats = result.recordset[0];
    const totalPotential = stats.totalRevenue + stats.totalPendingDues;
    
    return {
      ...stats,
      collectionRate: totalPotential > 0 ? (stats.totalRevenue * 100.0 / totalPotential) : 0
    };
  }

  async getMonthlyRevenueTrend(): Promise<any[]> {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        Month as month, 
        SUM(AmountPaid) as revenue
      FROM Payments p
      JOIN FeeVouchers v ON p.VoucherId = v.VoucherId
      WHERE p.PaymentStatus = 'Completed'
      GROUP BY Month
      ORDER BY Month ASC
    `);
    
    // If no payments yet, try to get from summary or return empty
    if (result.recordset.length === 0) {
      const summaryResult = await pool.request().query(`
        SELECT Month as month, SUM(TotalRevenue) as revenue
        FROM CampusMonthlySummary
        GROUP BY Month
        ORDER BY Month ASC
      `);
      return summaryResult.recordset;
    }
    
    return result.recordset.map(r => ({
      month: r.month,
      revenue: parseFloat(r.revenue)
    }));
  }

  async getCampusStats(campusId: number): Promise<any> {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('campusId', sql.Int, campusId)
      .query(`
        SELECT 
          (SELECT ISNULL(SUM(p.AmountPaid), 0) 
           FROM Payments p 
           JOIN FeeVouchers v ON p.VoucherId = v.VoucherId 
           WHERE v.CampusId = @campusId AND p.PaymentStatus = 'Completed') as campusRevenue,
          (SELECT ISNULL(SUM(l.ClosingBalance), 0) 
           FROM StudentFeeLedger l 
           WHERE l.CampusId = @campusId AND l.LedgerId IN (
             SELECT MAX(LedgerId) FROM StudentFeeLedger GROUP BY StudentId, Month
           )) as pendingDues,
          (SELECT COUNT(*) FROM Students WHERE CampusId = @campusId AND IsActive = 1) as totalStudentsCount,
          (SELECT COUNT(*) FROM Classes WHERE CampusId = @campusId) as totalClasses
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
