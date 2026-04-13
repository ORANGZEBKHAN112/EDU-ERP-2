import { eventBus, FinancialEventType, FinancialEvent, VoucherStatus, PaymentStatus } from './FinancialEventBus';
import { FeeRepository, StudentRepository } from '../../repositories';
import { AuditService, AuditAction } from '../auditService';
import { FinancialValidationEngine } from '../validation/FinancialValidationEngine';
import { TransactionManager } from '../../repositories/transactionManager';
import { sql } from '../../config/db';

export class FinancialEventHandler {
  static init() {
    eventBus.on(FinancialEventType.VOUCHER_GENERATED, this.handleVoucherGenerated.bind(this));
    eventBus.on(FinancialEventType.PAYMENT_RECEIVED, this.handlePaymentReceived.bind(this));
    eventBus.on(FinancialEventType.FINE_APPLIED, this.handleFineApplied.bind(this));
    console.log('[FinancialEventHandler] Initialized and listening for events.');
  }

  private static async handleVoucherGenerated(event: FinancialEvent) {
    const { voucher, openingBalance, structure, totalFine, totalDiscount } = event.payload;
    const txManager = await TransactionManager.startTransaction();

    try {
      // 1. Pre-Commit Validation
      await FinancialValidationEngine.preventDuplicate(event.correlationId, 'StudentFeeLedger', txManager.transaction);

      // 2. Immutable Ledger Entry (Initialization)
      const feeRepo = new FeeRepository();
      await feeRepo.createLedger({
        studentId: voucher.studentId,
        campusId: voucher.campusId,
        month: voucher.month,
        openingBalance,
        monthlyFee: structure.monthlyFee,
        fine: totalFine,
        discount: totalDiscount,
        paidAmount: 0,
        closingBalance: voucher.totalAmount,
        status: VoucherStatus.ISSUED,
        entryType: 'Initialization',
        correlationId: event.correlationId,
        transactionId: event.payload.transactionId
      }, txManager.transaction);

      // 3. Audit Log
      await AuditService.log(
        event.userId,
        AuditAction.CREATE_VOUCHER,
        null,
        voucher,
        event.campusId,
        txManager.transaction,
        {
          eventType: event.type,
          correlationId: event.correlationId,
          transactionId: event.payload.transactionId
        }
      );

      await txManager.commit();
    } catch (error) {
      await txManager.rollback();
      console.error(`[FinancialEventHandler] Error handling VOUCHER_GENERATED:`, error);
    }
  }

  private static async handlePaymentReceived(event: FinancialEvent) {
    const { payment, studentId, campusId, month } = event.payload;
    const txManager = await TransactionManager.startTransaction();

    try {
      const feeRepo = new FeeRepository();
      
      // 1. Fetch current ledger state (latest entry)
      const currentLedger = await feeRepo.getLatestLedger(studentId, month, txManager.transaction);
      if (!currentLedger) throw new Error('Ledger not found for payment application');

      // 2. Pre-Commit Validation
      const newClosingBalance = currentLedger.closingBalance - payment.amountPaid;
      const newPaidAmount = currentLedger.paidAmount + payment.amountPaid;
      
      const nextLedgerState = {
        ...currentLedger,
        paidAmount: newPaidAmount,
        closingBalance: newClosingBalance,
        status: newClosingBalance <= 0 ? VoucherStatus.PAID : VoucherStatus.PARTIALLY_PAID
      };

      FinancialValidationEngine.validateLedgerConsistency(nextLedgerState);

      // 3. Immutable Ledger Entry (Payment Application)
      await feeRepo.createLedger({
        studentId,
        campusId,
        month,
        openingBalance: currentLedger.openingBalance,
        monthlyFee: currentLedger.monthlyFee,
        fine: currentLedger.fine,
        discount: currentLedger.discount,
        paidAmount: newPaidAmount,
        closingBalance: newClosingBalance,
        status: nextLedgerState.status,
        entryType: 'Payment',
        correlationId: event.correlationId,
        transactionId: event.payload.transactionId
      }, txManager.transaction);

      // 4. Update Voucher Status
      await feeRepo.updateVoucherStatus(payment.voucherId, nextLedgerState.status, txManager.transaction);

      // 5. Audit Log
      await AuditService.log(
        event.userId,
        AuditAction.PAYMENT,
        currentLedger,
        nextLedgerState,
        campusId,
        txManager.transaction,
        {
          eventType: event.type,
          correlationId: event.correlationId,
          transactionId: event.payload.transactionId
        }
      );

      await txManager.commit();
    } catch (error) {
      await txManager.rollback();
      console.error(`[FinancialEventHandler] Error handling PAYMENT_RECEIVED:`, error);
    }
  }

  private static async handleFineApplied(event: FinancialEvent) {
    const { adjustment, studentId, campusId, month } = event.payload;
    const txManager = await TransactionManager.startTransaction();

    try {
      const feeRepo = new FeeRepository();
      const currentLedger = await feeRepo.getLatestLedger(studentId, month, txManager.transaction);
      if (!currentLedger) throw new Error('Ledger not found for fine application');

      const newFine = currentLedger.fine + adjustment.amount;
      const newClosingBalance = currentLedger.closingBalance + adjustment.amount;

      const nextLedgerState = {
        ...currentLedger,
        fine: newFine,
        closingBalance: newClosingBalance
      };

      FinancialValidationEngine.validateLedgerConsistency(nextLedgerState);

      // Immutable Ledger Entry
      await feeRepo.createLedger({
        studentId,
        campusId,
        month,
        openingBalance: currentLedger.openingBalance,
        monthlyFee: currentLedger.monthlyFee,
        fine: newFine,
        discount: currentLedger.discount,
        paidAmount: currentLedger.paidAmount,
        closingBalance: newClosingBalance,
        status: currentLedger.status,
        entryType: 'Fine',
        correlationId: event.correlationId,
        transactionId: event.payload.transactionId
      }, txManager.transaction);

      // Update Voucher Total
      await feeRepo.updateVoucherAmount(studentId, month, newClosingBalance, txManager.transaction);

      await AuditService.log(
        event.userId,
        AuditAction.ADJUSTMENT,
        currentLedger,
        nextLedgerState,
        campusId,
        txManager.transaction,
        {
          eventType: event.type,
          correlationId: event.correlationId,
          transactionId: event.payload.transactionId
        }
      );

      await txManager.commit();
    } catch (error) {
      await txManager.rollback();
      console.error(`[FinancialEventHandler] Error handling FINE_APPLIED:`, error);
    }
  }
}
