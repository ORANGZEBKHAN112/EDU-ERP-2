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
    const { voucher } = event.payload;
    
    try {
      // 1. Audit Log (Side Effect)
      await AuditService.log(
        event.userId,
        AuditAction.CREATE_VOUCHER,
        null,
        voucher,
        event.campusId,
        undefined,
        {
          eventType: event.type,
          correlationId: event.correlationId,
          transactionId: event.payload.transactionId
        }
      );
    } catch (error) {
      console.error(`[FinancialEventHandler] Error logging VOUCHER_GENERATED:`, error);
    }
  }

  private static async handlePaymentReceived(event: FinancialEvent) {
    const { payment, studentId, campusId } = event.payload;

    try {
      // 1. Audit Log (Side Effect)
      await AuditService.log(
        event.userId,
        AuditAction.PAYMENT,
        null,
        payment,
        campusId,
        undefined,
        {
          eventType: event.type,
          correlationId: event.correlationId,
          transactionId: event.payload.transactionId
        }
      );
    } catch (error) {
      console.error(`[FinancialEventHandler] Error logging PAYMENT_RECEIVED:`, error);
    }
  }

  private static async handleFineApplied(event: FinancialEvent) {
    const { adjustment, studentId, campusId } = event.payload;

    try {
      // 1. Audit Log (Side Effect)
      await AuditService.log(
        event.userId,
        AuditAction.ADJUSTMENT,
        null,
        adjustment,
        campusId,
        undefined,
        {
          eventType: event.type,
          correlationId: event.correlationId,
          transactionId: event.payload.transactionId
        }
      );
    } catch (error) {
      console.error(`[FinancialEventHandler] Error logging FINE_APPLIED:`, error);
    }
  }
}
