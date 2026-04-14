import { IFeeRepository } from '../../interfaces/repositories/IFeeRepository';
import { ILedgerRepository } from '../../interfaces/repositories/ILedgerRepository';
import { IStudentRepository } from '../../interfaces/repositories/IStudentRepository';
import { IFinancialTraceService } from '../../interfaces/services/IFinancialTraceService';
import { IFeeService } from '../../interfaces/services/IFeeService';
import { TransactionManager } from '../../repositories/transactionManager';
import { BusinessRuleError, NotFoundError } from '../../utils/errors';
import { eventBus, FinancialEventType, VoucherStatus } from '../events/FinancialEventBus';
import { v4 as uuidv4 } from 'uuid';
import { Payment } from '../../models';
import { RequestContext, GenerateVouchersDto, RecordPaymentDto } from '../../dtos/fee.dto';

export class FeeService implements IFeeService {
  constructor(
    private feeRepo: IFeeRepository,
    private ledgerRepo: ILedgerRepository,
    private studentRepo: IStudentRepository,
    private traceService: IFinancialTraceService
  ) {}

  async generateVouchers(ctx: RequestContext, dto: GenerateVouchersDto) {
    const { campusId, month } = dto;
    
    if (ctx.campusIds.length > 0 && !ctx.campusIds.includes(campusId)) {
      throw new BusinessRuleError('Access denied to this campus');
    }

    const txManager = await TransactionManager.startTransaction();
    try {
      const students = await this.studentRepo.getAll([campusId]);
      const generated = [];

      for (const student of students) {
        const existing = await this.feeRepo.getVoucher(student.id, month);
        if (existing) continue;

        const structure = await this.feeRepo.getStructure(student.campusId, student.classId);
        if (!structure) continue;

        const openingBalance = await this.ledgerRepo.getOpeningBalance(student.id, month);
        const adjustments = await this.feeRepo.getAdjustments(student.id, month);
        
        const totalFine = adjustments.filter(a => a.type === 'Fine').reduce((sum, a) => sum + a.amount, 0);
        const totalDiscount = adjustments.filter(a => a.type === 'Discount').reduce((sum, a) => sum + a.amount, 0);
        
        const totalAmount = openingBalance + structure.monthlyFee + structure.transportFee + structure.examFee + totalFine - totalDiscount;

        const correlationId = uuidv4();
        const transactionId = uuidv4();

        // 1. Create Voucher
        const voucher = await this.feeRepo.createVoucher({
          studentId: student.id,
          campusId: student.campusId,
          month,
          totalAmount,
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          status: 'Unpaid',
          correlationId
        }, txManager.transaction);

        // 2. ATOMIC LEDGER WRITE (Initialization)
        await this.ledgerRepo.create({
          studentId: student.id,
          campusId: student.campusId,
          month,
          openingBalance,
          monthlyFee: structure.monthlyFee,
          fine: totalFine,
          discount: totalDiscount,
          paidAmount: 0,
          closingBalance: totalAmount,
          status: VoucherStatus.ISSUED,
          entryType: 'Initialization',
          correlationId,
          transactionId
        }, txManager.transaction);
        
        // 3. Financial Trace (Non-blocking)
        this.traceService.trace('VOUCHER', student.id, totalAmount, correlationId, ctx);

        // 4. Emit Side-Effect Event
        await eventBus.emitEvent({
          type: FinancialEventType.VOUCHER_GENERATED,
          correlationId,
          timestamp: new Date(),
          userId: ctx.userId,
          campusId: student.campusId,
          payload: {
            voucher,
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

  async initiatePayment(ctx: RequestContext, dto: RecordPaymentDto): Promise<Payment> {
    const { voucherId, amountPaid, paymentMethod, transactionRef } = dto;

    const existingPayment = await this.feeRepo.getPaymentByRef(transactionRef);
    if (existingPayment) return existingPayment;

    const txManager = await TransactionManager.startTransaction();
    try {
      const voucher = await this.feeRepo.getVoucherById(voucherId, ctx.campusIds);
      if (!voucher) throw new NotFoundError('Voucher not found');

      // 1. Lock and Fetch current ledger state
      const currentLedger = await this.ledgerRepo.getLatestByStudent(voucher.studentId, voucher.month, txManager.transaction);
      if (!currentLedger) throw new Error('Ledger not found for payment application');

      const correlationId = uuidv4();
      const transactionId = uuidv4();

      // 2. Create Payment
      const payment = await this.feeRepo.createPayment({
        voucherId,
        studentId: voucher.studentId,
        amountPaid,
        paymentMethod,
        transactionRef,
        paymentStatus: "Completed",
        correlationId
      }, txManager.transaction);

      // 3. ATOMIC LEDGER WRITE (Payment Application)
      const newClosingBalance = currentLedger.closingBalance - amountPaid;
      const newPaidAmount = currentLedger.paidAmount + amountPaid;
      const newStatus = newClosingBalance <= 0 ? VoucherStatus.PAID : VoucherStatus.PARTIALLY_PAID;

      await this.ledgerRepo.create({
        studentId: voucher.studentId,
        campusId: voucher.campusId,
        month: voucher.month,
        openingBalance: currentLedger.openingBalance,
        monthlyFee: currentLedger.monthlyFee,
        fine: currentLedger.fine,
        discount: currentLedger.discount,
        paidAmount: newPaidAmount,
        closingBalance: newClosingBalance,
        status: newStatus,
        entryType: 'Payment',
        correlationId,
        transactionId
      }, txManager.transaction);

      // 4. Update Voucher Status
      await this.feeRepo.updateVoucherStatus(voucherId, newStatus, txManager.transaction);

      // 5. Financial Trace (Non-blocking)
      this.traceService.trace('PAYMENT', voucher.studentId, amountPaid, correlationId, ctx);

      // 6. Emit Side-Effect Event
      await eventBus.emitEvent({
        type: FinancialEventType.PAYMENT_RECEIVED,
        correlationId,
        timestamp: new Date(),
        userId: ctx.userId,
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

  async getStudentLedger(ctx: RequestContext, studentId: number) {
    // Verify access
    const student = await this.studentRepo.getById(studentId, ctx.campusIds, ctx.schoolId);
    if (!student) throw new NotFoundError('Student not found');

    return this.ledgerRepo.getAllByStudent(studentId);
  }

  async getStudentBalance(ctx: RequestContext, studentId: number): Promise<number> {
    const student = await this.studentRepo.getById(studentId, ctx.campusIds, ctx.schoolId);
    if (!student) throw new NotFoundError('Student not found');

    const ledgers = await this.ledgerRepo.getAllByStudent(studentId);
    return ledgers[0]?.closingBalance || 0;
  }
}
