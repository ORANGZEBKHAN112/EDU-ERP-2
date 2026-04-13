import { AuditRepository } from '../repositories';
import { sql } from '../config/db';

export enum AuditAction {
  CREATE_VOUCHER = 'CREATE_VOUCHER',
  UPDATE_VOUCHER = 'UPDATE_VOUCHER',
  PAYMENT = 'PAYMENT',
  ADJUSTMENT = 'ADJUSTMENT',
  STUDENT_CREATE = 'STUDENT_CREATE',
  JOB_START = 'JOB_START',
  JOB_END = 'JOB_END'
}

export class AuditService {
  private static auditRepo = new AuditRepository();

  static async log(
    userId: number, 
    action: AuditAction, 
    before: any, 
    after: any, 
    campusId: number, 
    transaction?: sql.Transaction,
    extra?: { eventType?: string, transactionId?: string, correlationId?: string }
  ) {
    const logEntry = {
      userId,
      action,
      beforeState: before,
      afterState: after,
      campusId,
      eventType: extra?.eventType,
      transactionId: extra?.transactionId,
      correlationId: extra?.correlationId
    };
    
    await this.auditRepo.create(logEntry, transaction);
    console.log(`[AUDIT] ${action} by User ${userId} at Campus ${campusId} - CorrelationId: ${extra?.correlationId}`);
  }
}
