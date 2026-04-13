import { FeeRepository, StudentRepository } from '../../repositories';
import { TransactionManager } from '../../repositories/transactionManager';
import { LedgerService } from './LedgerService';
import { eventBus, FinancialEventType } from '../events/FinancialEventBus';
import { v4 as uuidv4 } from 'uuid';

export class VoucherGeneratorService {
  private feeRepo = new FeeRepository();
  private studentRepo = new StudentRepository();
  private ledgerService = new LedgerService();

  async generateForCampus(campusId: number, month: string, userId: number) {
    const txManager = await TransactionManager.startTransaction();
    try {
      const students = await this.studentRepo.getAll([campusId]);
      const generated = [];

      for (const student of students) {
        // Idempotency: Check if voucher already exists
        const existing = await this.feeRepo.getVoucher(student.id, month);
        if (existing) continue;

        const structure = await this.feeRepo.getStructure(student.campusId, student.classId);
        if (!structure) continue;

        // Get opening balance from previous month's ledger
        const openingBalance = await this.ledgerService.getOpeningBalance(student.id, month);
        
        const adjustments = await this.feeRepo.getAdjustments(student.id, month);
        const totalFine = adjustments.filter(a => a.type === 'Fine').reduce((sum, a) => sum + a.amount, 0);
        const totalDiscount = adjustments.filter(a => a.type === 'Discount').reduce((sum, a) => sum + a.amount, 0);
        
        // Total Payable = Previous Balance + Monthly Fee + Transport Fee + Exam Fee + Fine - Discount
        const totalAmount = openingBalance + structure.monthlyFee + structure.transportFee + structure.examFee + totalFine - totalDiscount;

        const correlationId = uuidv4();
        const transactionId = uuidv4();

        const voucher = await this.feeRepo.createVoucher({
          studentId: student.id,
          campusId: student.campusId,
          month,
          totalAmount,
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
          status: 'Unpaid',
          correlationId
        }, txManager.transaction);
        
        // Emit Event instead of direct ledger update
        await eventBus.emitEvent({
          type: FinancialEventType.VOUCHER_GENERATED,
          correlationId,
          timestamp: new Date(),
          userId,
          campusId: student.campusId,
          payload: {
            voucher,
            openingBalance,
            structure,
            totalFine,
            totalDiscount,
            transactionId
          }
        }, txManager.transaction);
        
        generated.push(voucher);
      }
      
      await txManager.commit();
      return generated;
    } catch (error) {
      await txManager.rollback();
      throw error;
    }
  }
}
