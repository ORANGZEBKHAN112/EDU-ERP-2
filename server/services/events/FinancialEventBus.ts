import { EventEmitter } from 'events';
import { EventRepository } from '../../repositories';
import { sql } from '../../config/db';

export enum FinancialEventType {
  VOUCHER_GENERATED = 'VOUCHER_GENERATED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  FINE_APPLIED = 'FINE_APPLIED',
  LEDGER_UPDATED = 'LEDGER_UPDATED',
  RECONCILIATION_FAILED = 'RECONCILIATION_FAILED'
}

export interface FinancialEvent {
  type: FinancialEventType;
  payload: any;
  correlationId: string;
  timestamp: Date;
  userId: number;
  campusId: number;
}

class FinancialEventBus extends EventEmitter {
  private eventRepo = new EventRepository();

  async emitEvent(event: FinancialEvent, transaction?: sql.Transaction) {
    console.log(`[EventBus] Persisting ${event.type} - CorrelationId: ${event.correlationId}`);
    
    // Durable Event Persistence
    await this.eventRepo.createEvent(event, transaction);
    
    // Note: In-memory emission is removed as per durable event system requirements.
    // A background worker will process these events from the database.
  }
}

export const eventBus = new FinancialEventBus();

// State Machine Enums
export enum VoucherStatus {
  PENDING = 'Pending',
  ISSUED = 'Issued',
  PARTIALLY_PAID = 'PartiallyPaid',
  PAID = 'Paid',
  OVERDUE = 'Overdue',
  CANCELLED = 'Cancelled'
}

export enum PaymentStatus {
  INITIATED = 'Initiated',
  VERIFIED = 'Verified',
  APPLIED = 'Applied',
  FAILED = 'Failed'
}
