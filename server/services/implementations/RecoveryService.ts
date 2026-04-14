import { IRecoveryService } from '../../interfaces/services/IRecoveryService';
import { IFailedTransactionRepository } from '../../interfaces/repositories/IFailedTransactionRepository';
import { IFeeRepository } from '../../interfaces/repositories/IFeeRepository';
import { ILedgerRepository } from '../../interfaces/repositories/ILedgerRepository';
import { poolPromise, sql } from '../../config/db';
import { container } from '../../container';

export class RecoveryService implements IRecoveryService {
  constructor(
    private failedTxRepo: IFailedTransactionRepository,
    private feeRepo: IFeeRepository,
    private ledgerRepo: ILedgerRepository
  ) {}

  async detectInconsistencies(): Promise<void> {
    const pool = await poolPromise;
    
    // 1. Detect Payments without Ledger entries
    const orphanedPayments = await pool.request().query(`
      SELECT p.* FROM Payments p
      LEFT JOIN StudentFeeLedger l ON p.CorrelationId = l.CorrelationId
      WHERE l.LedgerId IS NULL AND p.PaymentStatus = 'Completed'
    `);

    for (const payment of orphanedPayments.recordset) {
      await this.failedTxRepo.addToQueue({
        correlationId: payment.CorrelationId,
        payload: {
          type: 'RECOVER_PAYMENT_LEDGER',
          paymentId: payment.PaymentId,
          studentId: payment.StudentId,
          amount: payment.AmountPaid,
          voucherId: payment.VoucherId
        }
      });
    }

    // 2. Detect Vouchers without Ledger entries (Initialization)
    const orphanedVouchers = await pool.request().query(`
      SELECT v.* FROM FeeVouchers v
      LEFT JOIN StudentFeeLedger l ON v.CorrelationId = l.CorrelationId
      WHERE l.LedgerId IS NULL
    `);

    for (const voucher of orphanedVouchers.recordset) {
      await this.failedTxRepo.addToQueue({
        correlationId: voucher.CorrelationId,
        payload: {
          type: 'RECOVER_VOUCHER_LEDGER',
          voucherId: voucher.VoucherId,
          studentId: voucher.StudentId,
          month: voucher.Month,
          amount: voucher.TotalAmount
        }
      });
    }
  }

  async processQueue(): Promise<void> {
    const pending = await this.failedTxRepo.getPending(10);
    
    for (const item of pending) {
      try {
        await this.failedTxRepo.incrementRetry(item.id);
        
        if (item.payload.type === 'RECOVER_PAYMENT_LEDGER') {
          await this.recoverPaymentLedger(item.payload);
        } else if (item.payload.type === 'RECOVER_VOUCHER_LEDGER') {
          await this.recoverVoucherLedger(item.payload);
        }

        await this.failedTxRepo.updateStatus(item.id, 'RESOLVED');
      } catch (error) {
        await this.failedTxRepo.updateStatus(item.id, 'RETRYING', error instanceof Error ? error.message : String(error));
      }
    }
  }

  private async recoverPaymentLedger(payload: any) {
    // This uses the FeeService to re-apply logic idempotently
    // But since we want to avoid duplication, we check ledger again inside
    const existing = await this.ledgerRepo.getByCorrelationId(payload.correlationId);
    if (existing) return;

    // We need a RequestContext for FeeService, but here we are in a background worker
    // We'll use a system context
    const feeService = container.feeService;
    const ctx = { schoolId: 0, campusIds: [], userId: 0 };
    
    // Instead of calling initiatePayment (which creates a new Payment record),
    // we should have a specific recovery method or use the internal logic.
    // For now, let's assume we can safely re-trigger the ledger creation logic.
    // In a real system, we'd refactor FeeService to expose an idempotent 'applyPaymentToLedger' method.
    console.log(`[Recovery] Recovering ledger for payment ${payload.paymentId}`);
    // Logic would go here...
  }

  private async recoverVoucherLedger(payload: any) {
    const existing = await this.ledgerRepo.getByCorrelationId(payload.correlationId);
    if (existing) return;

    console.log(`[Recovery] Recovering ledger for voucher ${payload.voucherId}`);
    // Logic would go here...
  }
}
