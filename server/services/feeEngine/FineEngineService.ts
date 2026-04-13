import { FeeRepository } from '../../repositories';
import { TransactionManager } from '../../repositories/transactionManager';
import { poolPromise, sql } from '../../config/db';
import { eventBus, FinancialEventType } from '../events/FinancialEventBus';
import { v4 as uuidv4 } from 'uuid';

export class FineEngineService {
  private feeRepo = new FeeRepository();

  async processOverdueFines(month: string, userId: number) {
    const pool = await poolPromise;
    const now = new Date();
    
    // Find all unpaid/partial vouchers for the month that are past due date
    const overdueVouchers = await pool.request()
      .input('month', sql.NVarChar, month)
      .input('now', sql.DateTime, now)
      .query(`
        SELECT * FROM FeeVouchers 
        WHERE Month = @month AND Status != 'Paid' AND DueDate < @now
      `);

    const results = [];
    for (const voucher of overdueVouchers.recordset) {
      const txManager = await TransactionManager.startTransaction();
      try {
        // Check if fine already applied for this month
        const adjustments = await this.feeRepo.getAdjustments(voucher.StudentId, month);
        const fineExists = adjustments.some(a => a.type === 'Fine' && a.reason === 'Auto-generated Overdue Fine');
        
        if (fineExists) {
          await txManager.rollback();
          continue;
        }

        const fineAmount = 10.00; // Default fine rule
        const correlationId = uuidv4();
        const transactionId = uuidv4();
        
        // 1. Create Adjustment
        const adjustment = await this.feeRepo.createAdjustment({
          studentId: voucher.StudentId,
          campusId: voucher.CampusId,
          month,
          type: 'Fine',
          amount: fineAmount,
          reason: 'Auto-generated Overdue Fine',
          createdBy: userId,
          correlationId
        }, txManager.transaction);

        // 2. Emit Event for Ledger Update
        await eventBus.emitEvent({
          type: FinancialEventType.FINE_APPLIED,
          correlationId,
          timestamp: new Date(),
          userId,
          campusId: voucher.CampusId,
          payload: {
            adjustment,
            studentId: voucher.StudentId,
            month,
            transactionId
          }
        }, txManager.transaction);
        
        await txManager.commit();
        results.push({ studentId: voucher.StudentId, status: 'Fine Applied' });
      } catch (error) {
        await txManager.rollback();
        results.push({ studentId: voucher.StudentId, status: 'Failed', error: error instanceof Error ? error.message : String(error) });
      }
    }
    return results;
  }
}
