import { poolPromise, sql } from '../../config/db';
import { AuditService, AuditAction } from '../auditService';

export class ReconciliationService {
  async reconcileCampus(campusId: number, month: string, userId: number) {
    const pool = await poolPromise;
    
    // 1. Fetch all students for the campus
    const studentsResult = await pool.request()
      .input('campusId', sql.Int, campusId)
      .query('SELECT StudentId, FullName FROM Students WHERE CampusId = @campusId');
    
    const students = studentsResult.recordset;
    const mismatches = [];
    let orphanVouchers = 0;
    let orphanPayments = 0;

    for (const student of students) {
      // Rule: Ledger = Voucher - Payments + Adjustments
      // Actually: ClosingBalance = (OpeningBalance + MonthlyFee + Fine - Discount) - PaidAmount
      
      const ledgerResult = await pool.request()
        .input('studentId', sql.Int, student.StudentId)
        .input('month', sql.NVarChar, month)
        .query('SELECT * FROM StudentFeeLedger WHERE StudentId = @studentId AND Month = @month');
      
      const ledger = ledgerResult.recordset[0];
      if (!ledger) continue;

      const voucherResult = await pool.request()
        .input('studentId', sql.Int, student.StudentId)
        .input('month', sql.NVarChar, month)
        .query('SELECT * FROM FeeVouchers WHERE StudentId = @studentId AND Month = @month');
      
      const voucher = voucherResult.recordset[0];
      
      const paymentsResult = await pool.request()
        .input('studentId', sql.Int, student.StudentId)
        .input('month', sql.NVarChar, month)
        .query(`
          SELECT SUM(AmountPaid) as TotalPaid 
          FROM Payments p 
          INNER JOIN FeeVouchers v ON p.VoucherId = v.VoucherId 
          WHERE p.StudentId = @studentId AND v.Month = @month AND p.PaymentStatus = 'Completed'
        `);
      
      const totalPaid = paymentsResult.recordset[0].TotalPaid || 0;

      // Validation Logic
      const expectedClosingBalance = (ledger.OpeningBalance + ledger.MonthlyFee + ledger.Fine - ledger.Discount) - totalPaid;
      
      if (Math.abs(ledger.ClosingBalance - expectedClosingBalance) > 0.01) {
        mismatches.push({
          studentId: student.StudentId,
          name: student.FullName,
          expected: expectedClosingBalance,
          actual: ledger.ClosingBalance,
          diff: ledger.ClosingBalance - expectedClosingBalance
        });
      }

      if (voucher && Math.abs(voucher.TotalAmount - (ledger.OpeningBalance + ledger.MonthlyFee + ledger.Fine - ledger.Discount)) > 0.01) {
        mismatches.push({
          studentId: student.StudentId,
          name: student.FullName,
          type: 'VoucherMismatch',
          voucherAmount: voucher.TotalAmount,
          ledgerCalculated: ledger.OpeningBalance + ledger.MonthlyFee + ledger.Fine - ledger.Discount
        });
      }
    }

    // Orphan Checks
    const orphanVouchersResult = await pool.request()
      .input('campusId', sql.Int, campusId)
      .query('SELECT COUNT(*) as Count FROM FeeVouchers v LEFT JOIN Students s ON v.StudentId = s.StudentId WHERE s.StudentId IS NULL AND v.CampusId = @campusId');
    orphanVouchers = orphanVouchersResult.recordset[0].Count;

    const orphanPaymentsResult = await pool.request()
      .input('campusId', sql.Int, campusId)
      .query('SELECT COUNT(*) as Count FROM Payments p LEFT JOIN Students s ON p.StudentId = s.StudentId WHERE s.StudentId IS NULL');
    orphanPayments = orphanPaymentsResult.recordset[0].Count;

    const report = {
      campusId,
      month,
      totalStudents: students.length,
      mismatchedCount: mismatches.length,
      orphanVouchers,
      orphanPayments,
      status: mismatches.length === 0 && orphanVouchers === 0 && orphanPayments === 0 ? 'Balanced' : 'Mismatch',
      details: JSON.stringify(mismatches)
    };

    // Save Report
    await pool.request()
      .input('campusId', sql.Int, report.campusId)
      .input('month', sql.NVarChar, report.month)
      .input('totalStudents', sql.Int, report.totalStudents)
      .input('mismatchedCount', sql.Int, report.mismatchedCount)
      .input('orphanVouchers', sql.Int, report.orphanVouchers)
      .input('orphanPayments', sql.Int, report.orphanPayments)
      .input('status', sql.NVarChar, report.status)
      .input('details', sql.NVarChar, report.details)
      .query(`
        INSERT INTO ReconciliationReports (CampusId, Month, TotalStudents, MismatchedCount, OrphanVouchers, OrphanPayments, Status, Details)
        VALUES (@campusId, @month, @totalStudents, @mismatchedCount, @orphanVouchers, @orphanPayments, @status, @details)
      `);

    await AuditService.log(userId, AuditAction.ADJUSTMENT, null, report, campusId);

    return report;
  }

  async runGlobalReconciliation(userId: number) {
    const pool = await poolPromise;
    const campuses = await pool.request().query('SELECT CampusId FROM Campuses WHERE IsActive = 1');
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    const results = [];
    for (const campus of campuses.recordset) {
      const report = await this.reconcileCampus(campus.CampusId, currentMonth, userId);
      results.push(report);
    }
    return results;
  }
}
