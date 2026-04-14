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
      let month: string | undefined;

      switch (event.type) {
        case FinancialEventType.VOUCHER_GENERATED:
          month = event.payload.voucher.month;
          break;
        case FinancialEventType.PAYMENT_RECEIVED:
          month = event.payload.month;
          break;
        case FinancialEventType.FINE_APPLIED:
          month = event.payload.month;
          break;
        default:
          console.warn(`[EventProcessorService] Unhandled event type: ${event.type}`);
      }

      // Update Campus Monthly Summary (Side Effect)
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
      await this.eventRepo.updateEventStatus(eventId, 'Failed', errorMessage);
    }
  }
}
