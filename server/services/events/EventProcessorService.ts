import { EventRepository, FeeRepository, SummaryRepository } from '../../repositories';
import { TransactionManager } from '../../repositories/transactionManager';
import { FinancialEventType, FinancialEvent, VoucherStatus } from './FinancialEventBus';
import { FinancialValidationEngine } from '../validation/FinancialValidationEngine';
import { AuditService, AuditAction } from '../auditService';
import { v4 as uuidv4 } from 'uuid';

export class EventProcessorService {
  private eventRepo = new EventRepository();
  private feeRepo = new FeeRepository();
  private summaryRepo = new SummaryRepository();
  private isProcessing = false;
  private instanceId = uuidv4();

  async start() {
    console.log(`[EventProcessorService] Background worker started. InstanceId: ${this.instanceId}`);
    setInterval(() => this.processBatch(), 5000); // Poll every 5 seconds
  }

  private async processBatch() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      // Atomic lock and fetch for multi-server safety
      const events = await this.eventRepo.getPendingEvents(50, this.instanceId);
      if (events.length === 0) {
        this.isProcessing = false;
        return;
      }

      console.log(`[EventProcessorService] Processing batch of ${events.length} events. Instance: ${this.instanceId}`);

      for (const rawEvent of events) {
        const event: FinancialEvent = {
          type: rawEvent.EventType as FinancialEventType,
          payload: JSON.parse(rawEvent.Payload),
          correlationId: rawEvent.CorrelationId,
          timestamp: rawEvent.CreatedAt,
          userId: rawEvent.UserId,
          campusId: rawEvent.CampusId
        };

        await this.processSingleEvent(rawEvent.EventId, event);
      }
    } catch (error) {
      console.error('[EventProcessorService] Batch processing error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processSingleEvent(eventId: number, event: FinancialEvent) {
    console.log(`[EventProcessorService] Processing Event ${eventId} (${event.type}) - CorrelationId: ${event.correlationId}`);
    
    const txManager = await TransactionManager.startTransaction();
    try {
      let studentId: number | undefined;
      let month: string | undefined;

      switch (event.type) {
        case FinancialEventType.VOUCHER_GENERATED:
          await this.handleVoucherGenerated(event, txManager.transaction);
          studentId = event.payload.voucher.studentId;
          month = event.payload.voucher.month;
          break;
        case FinancialEventType.PAYMENT_RECEIVED:
          await this.handlePaymentReceived(event, txManager.transaction);
          studentId = event.payload.studentId;
          month = event.payload.month;
          break;
        case FinancialEventType.FINE_APPLIED:
          await this.handleFineApplied(event, txManager.transaction);
          studentId = event.payload.studentId;
          month = event.payload.month;
          break;
        default:
          console.warn(`[EventProcessorService] Unhandled event type: ${event.type}`);
      }

      // Update Campus Monthly Summary if applicable
      if (event.campusId && month) {
        await this.summaryRepo.updateCampusMonthlySummary(event.campusId, month, txManager.transaction);
      }

      await this.eventRepo.updateEventStatus(eventId, 'Processed', undefined, txManager.transaction);
      await txManager.commit();
      console.log(`[EventProcessorService] Event ${eventId} processed successfully.`);
    } catch (error) {
      await txManager.rollback();
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[EventProcessorService] Event ${eventId} failed:`, errorMessage);
      
      // Update status to Failed and increment retry count (handled in repo)
      await this.eventRepo.updateEventStatus(eventId, 'Failed', errorMessage);
    }
  }

  private async handleVoucherGenerated(event: FinancialEvent, transaction: any) {
    const { voucher, openingBalance, structure, totalFine, totalDiscount, transactionId } = event.payload;

    // Idempotency: Ensure ledger doesn't already exist for this correlationId
    await FinancialValidationEngine.preventDuplicate(event.correlationId, 'StudentFeeLedger', transaction);

    await this.feeRepo.createLedger({
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
      transactionId: transactionId
    }, transaction);

    await AuditService.log(
      event.userId,
      AuditAction.CREATE_VOUCHER,
      null,
      voucher,
      event.campusId,
      transaction,
      {
        eventType: event.type,
        correlationId: event.correlationId,
        transactionId: transactionId
      }
    );
  }

  private async handlePaymentReceived(event: FinancialEvent, transaction: any) {
    const { payment, studentId, campusId, month, transactionId } = event.payload;

    const currentLedger = await this.feeRepo.getLatestLedger(studentId, month, transaction);
    if (!currentLedger) throw new Error('Ledger not found for payment application');

    const newClosingBalance = currentLedger.closingBalance - payment.amountPaid;
    const newPaidAmount = currentLedger.paidAmount + payment.amountPaid;
    const newStatus = newClosingBalance <= 0 ? VoucherStatus.PAID : VoucherStatus.PARTIALLY_PAID;

    const nextLedgerState = {
      ...currentLedger,
      paidAmount: newPaidAmount,
      closingBalance: newClosingBalance,
      status: newStatus
    };

    FinancialValidationEngine.validateLedgerConsistency(nextLedgerState);

    await this.feeRepo.createLedger({
      studentId,
      campusId,
      month,
      openingBalance: currentLedger.openingBalance,
      monthlyFee: currentLedger.monthlyFee,
      fine: currentLedger.fine,
      discount: currentLedger.discount,
      paidAmount: newPaidAmount,
      closingBalance: newClosingBalance,
      status: newStatus,
      entryType: 'Payment',
      correlationId: event.correlationId,
      transactionId: transactionId
    }, transaction);

    await this.feeRepo.updateVoucherStatus(payment.voucherId, newStatus, transaction);

    await AuditService.log(
      event.userId,
      AuditAction.PAYMENT,
      currentLedger,
      nextLedgerState,
      campusId,
      transaction,
      {
        eventType: event.type,
        correlationId: event.correlationId,
        transactionId: transactionId
      }
    );
  }

  private async handleFineApplied(event: FinancialEvent, transaction: any) {
    const { adjustment, studentId, campusId, month, transactionId } = event.payload;

    const currentLedger = await this.feeRepo.getLatestLedger(studentId, month, transaction);
    if (!currentLedger) throw new Error('Ledger not found for fine application');

    const newFine = currentLedger.fine + adjustment.amount;
    const newClosingBalance = currentLedger.closingBalance + adjustment.amount;

    const nextLedgerState = {
      ...currentLedger,
      fine: newFine,
      closingBalance: newClosingBalance
    };

    FinancialValidationEngine.validateLedgerConsistency(nextLedgerState);

    await this.feeRepo.createLedger({
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
      transactionId: transactionId
    }, transaction);

    await this.feeRepo.updateVoucherAmount(studentId, month, newClosingBalance, transaction);

    await AuditService.log(
      event.userId,
      AuditAction.ADJUSTMENT,
      currentLedger,
      nextLedgerState,
      campusId,
      transaction,
      {
        eventType: event.type,
        correlationId: event.correlationId,
        transactionId: transactionId
      }
    );
  }
}
