import { FeeRepository, StudentRepository } from '../repositories';
import { TransactionManager } from '../repositories/transactionManager';
import { BusinessRuleError, NotFoundError } from '../utils/errors';
import { eventBus, FinancialEventType } from './events/FinancialEventBus';
import { v4 as uuidv4 } from 'uuid';
import { VoucherGeneratorService } from './feeEngine/VoucherGeneratorService';

export class FeeService {
  private feeRepo = new FeeRepository();
  private studentRepo = new StudentRepository();
  private voucherGenerator = new VoucherGeneratorService();

  async generateVouchers(campusId: number, month: string, userId: number, campusIds?: number[]) {
    // Campus Isolation Check
    if (campusIds && campusIds.length > 0 && !campusIds.includes(campusId)) {
      throw new BusinessRuleError('Access denied to this campus');
    }
    return this.voucherGenerator.generateForCampus(campusId, month, userId);
  }

  async initiatePayment(voucherId: number, amountPaid: number, paymentMethod: string, userId: number, transactionRef: string, campusIds?: number[]) {
    // 1. Idempotency Check
    const existingPayment = await this.feeRepo.getPaymentByRef(transactionRef);
    if (existingPayment) {
      return existingPayment;
    }

    const txManager = await TransactionManager.startTransaction();
    try {
      const voucher = await this.feeRepo.getVoucherById(voucherId, campusIds);
      if (!voucher) throw new NotFoundError('Voucher not found');

      const correlationId = uuidv4();
      const transactionId = uuidv4();

      const payment = await this.feeRepo.createPayment({
        voucherId,
        studentId: voucher.studentId,
        amountPaid,
        paymentMethod,
        transactionRef,
        paymentStatus: "Completed",
        correlationId
      }, txManager.transaction);

      // Emit Event for Ledger Update
      await eventBus.emitEvent({
        type: FinancialEventType.PAYMENT_RECEIVED,
        correlationId,
        timestamp: new Date(),
        userId,
        campusId: voucher.campusId,
        payload: {
          payment,
          studentId: voucher.studentId,
          campusId: voucher.campusId,
          month: voucher.month,
          transactionId
        }
      }, txManager.transaction);

      await txManager.commit();
      return payment;
    } catch (error) {
      await txManager.rollback();
      throw error;
    }
  }

  async getStudentLedger(studentId: number) {
    // This would normally be a more complex query in repo
    return []; // Placeholder
  }
}
