import { IFeeRepository } from '../../interfaces/repositories/IFeeRepository';
import { ILedgerRepository } from '../../interfaces/repositories/ILedgerRepository';
import { IFinancialTraceService } from '../../interfaces/services/IFinancialTraceService';
import { TransactionManager } from '../../repositories/transactionManager';
import { poolPromise, sql } from '../../config/db';
import { eventBus, FinancialEventType } from '../events/FinancialEventBus';
import { v4 as uuidv4 } from 'uuid';
import { RequestContext } from '../../dtos/fee.dto';

export class FineEngineService {
  constructor(
    private feeRepo: IFeeRepository,
    private ledgerRepo: ILedgerRepository,
    private traceService: IFinancialTraceService
  ) {}

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
        // 1. Lock and Fetch current ledger state
        const currentLedger = await this.ledgerRepo.getLatestByStudent(voucher.StudentId, month, txManager.transaction);
        if (!currentLedger) {
           await txManager.rollback();
           continue;
        }

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
        
        // 2. Create Adjustment
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

        // 3. ATOMIC LEDGER WRITE
        const newFine = currentLedger.fine + fineAmount;
        const newClosingBalance = currentLedger.closingBalance + fineAmount;

        await this.ledgerRepo.create({
          studentId: voucher.StudentId,
          campusId: voucher.CampusId,
          month,
          openingBalance: currentLedger.openingBalance,
          monthlyFee: currentLedger.monthlyFee,
          fine: newFine,
          discount: currentLedger.discount,
          paidAmount: currentLedger.paidAmount,
          closingBalance: newClosingBalance,
          status: currentLedger.status,
          entryType: 'Fine',
          correlationId,
          transactionId
        }, txManager.transaction);

        // 4. Update Voucher Total
        await this.feeRepo.updateVoucherAmount(voucher.StudentId, month, newClosingBalance, txManager.transaction);

        // 5. Financial Trace (Non-blocking)
        const ctx: RequestContext = {
          schoolId: 0, // System context
          campusIds: [voucher.CampusId],
          userId: userId
        };
        this.traceService.trace('FINE', voucher.StudentId, fineAmount, correlationId, ctx);

        // 6. Emit Side-Effect Event
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
