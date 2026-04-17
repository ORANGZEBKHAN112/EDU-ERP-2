import { IFeeRepository } from '../../interfaces/repositories/IFeeRepository';
import { ILedgerRepository } from '../../interfaces/repositories/ILedgerRepository';
import { IStudentRepository } from '../../interfaces/repositories/IStudentRepository';
import { IFinancialTraceService } from '../../interfaces/services/IFinancialTraceService';
import { IFeeService } from '../../interfaces/services/IFeeService';
import { TransactionManager } from '../../repositories/transactionManager';
import { BusinessRuleError, NotFoundError } from '../../utils/errors';
import { eventBus, FinancialEventType, VoucherStatus } from '../events/FinancialEventBus';
import { AuditService, AuditAction } from '../auditService';
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

    // For large datasets (>100 students), use optimized batch processing
    const students = await this.studentRepo.getAll([campusId]);
    // Temporarily disable batch processing to test sequential
    // if (students.length > 10) {
    //   return this.generateVouchersBatchOptimized(ctx, dto, students);
    // }
    return this.generateVouchersSequential(ctx, dto, students);

    // Original implementation for smaller datasets
    return this.generateVouchersSequential(ctx, dto, students);
  }

  private async generateVouchersSequential(ctx: RequestContext, dto: GenerateVouchersDto, students: any[]) {
    const { month } = dto;
    const generated = [];
    const BATCH_SIZE = 1; // Process 1 student at a time

    for (let i = 0; i < students.length; i += BATCH_SIZE) {
      const batch = students.slice(i, i + BATCH_SIZE);
      console.log(`[VOUCHER_GEN] Processing sequential batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(students.length / BATCH_SIZE)} (${batch.length} students)`);

      const batchVouchers = await this.processSequentialBatch(ctx, batch, month);
      generated.push(...batchVouchers);
    }

    return generated;
  }

  private async processSequentialBatch(ctx: RequestContext, students: any[], month: string) {
    const txManager = await TransactionManager.startTransaction();

    try {
      const generated = [];

      for (const student of students) {
        const existing = await this.feeRepo.getVoucher(student.id, month, [student.campusId]);
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

  private async generateVouchersBatchOptimized(ctx: RequestContext, dto: GenerateVouchersDto, students: any[]) {
    const { campusId, month } = dto;
    const BATCH_SIZE = 10; // Process 10 students at a time for testing
    const generated = [];
    
    console.log(`[VOUCHER_GEN] Starting optimized batch processing for ${students.length} students`);

    // Pre-fetch all required data in bulk
    const studentIds = students.map(s => s.id);
    const existingVouchers = await this.feeRepo.getVouchersBulk(studentIds, month);
    const existingVoucherIds = new Set(existingVouchers.map(v => v.studentId));

    // Filter students who don't have vouchers yet
    const studentsToProcess = students.filter(s => !existingVoucherIds.has(s.id));
    
    if (studentsToProcess.length === 0) {
      console.log('[VOUCHER_GEN] All students already have vouchers');
      return [];
    }

    console.log(`[VOUCHER_GEN] Processing ${studentsToProcess.length} students in batches of ${BATCH_SIZE}`);

    // Process in batches
    for (let i = 0; i < studentsToProcess.length; i += BATCH_SIZE) {
      const batch = studentsToProcess.slice(i, i + BATCH_SIZE);
      console.log(`[VOUCHER_GEN] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(studentsToProcess.length / BATCH_SIZE)} (${batch.length} students)`);
      
      const batchVouchers = await this.processVoucherBatch(ctx, batch, month, campusId);
      generated.push(...batchVouchers);
    }

    console.log(`[VOUCHER_GEN] Completed processing ${generated.length} vouchers`);
    return generated;
  }

  private async processVoucherBatch(ctx: RequestContext, students: any[], month: string, campusId: number) {
    const txManager = await TransactionManager.startTransaction();
    
    try {
      const studentIds = students.map(s => s.id);
      const classIds = [...new Set(students.map(s => s.classId))];
      
      // Bulk fetch all required data
      const [structuresMap, openingBalancesMap, adjustmentsMap] = await Promise.all([
        this.getStructuresBulk(classIds, campusId),
        this.getOpeningBalancesBulk(studentIds, month),
        this.getAdjustmentsBulk(studentIds, month)
      ]);

      const vouchers = [];
      const ledgerEntries = [];
      const events = [];

      // Process each student in the batch
      for (const student of students) {
        const structure = structuresMap.get(student.classId);
        if (!structure) continue;

        const openingBalance = openingBalancesMap.get(student.id) || 0;
        const adjustments = adjustmentsMap.get(student.id) || [];
        
        const totalFine = adjustments.filter(a => a.type === 'Fine').reduce((sum, a) => sum + a.amount, 0);
        const totalDiscount = adjustments.filter(a => a.type === 'Discount').reduce((sum, a) => sum + a.amount, 0);
        
        const totalAmount = openingBalance + structure.monthlyFee + structure.transportFee + structure.examFee + totalFine - totalDiscount;

        const correlationId = uuidv4();
        const transactionId = uuidv4();

        // Prepare voucher data
        const voucherData = {
          studentId: student.id,
          campusId: student.campusId,
          month,
          totalAmount,
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          status: 'Unpaid',
          correlationId
        };

        // Prepare ledger data
        const ledgerData = {
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
        };

        vouchers.push(voucherData);
        ledgerEntries.push(ledgerData);

        // Prepare event data (will be emitted after transaction)
        events.push({
          type: FinancialEventType.VOUCHER_GENERATED,
          correlationId,
          timestamp: new Date(),
          userId: ctx.userId,
          campusId: student.campusId,
          payload: {
            voucher: voucherData,
            transactionId
          }
        });
      }

      // Bulk insert vouchers
      const createdVouchers = await this.feeRepo.createVouchersBulk(vouchers, txManager.transaction);
      
      // Bulk insert ledger entries
      await this.ledgerRepo.createBulk(ledgerEntries, txManager.transaction);

      // Commit transaction
      await txManager.commit();

      // Emit events asynchronously (non-blocking)
      // this.emitEventsAsync(events);

      // Add financial traces asynchronously
      // this.addTracesAsync(createdVouchers, ctx);

      return createdVouchers;
      
    } catch (error) {
      await txManager.rollback();
      throw error;
    }
  }

  private async getStructuresBulk(classIds: number[], campusId: number): Promise<Map<number, any>> {
    const structuresMap = new Map();
    const structures = await this.feeRepo.getStructuresBulk(classIds, campusId);
    structures.forEach(structure => {
      structuresMap.set(structure.classId, structure);
    });
    return structuresMap;
  }

  private async getOpeningBalancesBulk(studentIds: number[], month: string): Promise<Map<number, number>> {
    const balancesMap = new Map();
    const balances = await this.ledgerRepo.getOpeningBalancesBulk(studentIds, month);
    balances.forEach(balance => {
      balancesMap.set(balance.studentId, balance.amount);
    });
    return balancesMap;
  }

  private async getAdjustmentsBulk(studentIds: number[], month: string): Promise<Map<number, any[]>> {
    const adjustmentsMap = new Map();
    const adjustments = await this.feeRepo.getAdjustmentsBulk(studentIds, month);
    
    // Group adjustments by studentId
    adjustments.forEach(adjustment => {
      if (!adjustmentsMap.has(adjustment.studentId)) {
        adjustmentsMap.set(adjustment.studentId, []);
      }
      adjustmentsMap.get(adjustment.studentId).push(adjustment);
    });
    
    return adjustmentsMap;
  }

  private emitEventsAsync(events: any[]) {
    // Emit events asynchronously to avoid blocking
    setImmediate(() => {
      events.forEach(event => {
        eventBus.emitEvent(event).catch(err => {
          console.error('[VOUCHER_GEN] Failed to emit event:', err);
        });
      });
    });
  }

  private addTracesAsync(vouchers: any[], ctx: RequestContext) {
    // Add traces asynchronously
    setImmediate(() => {
      vouchers.forEach(voucher => {
        this.traceService.trace('VOUCHER', voucher.studentId, voucher.totalAmount, voucher.correlationId, ctx);
      });
    });
  }

  async initiatePayment(ctx: RequestContext, dto: RecordPaymentDto): Promise<Payment> {
    const { voucherId, amountPaid, paymentMethod, transactionRef } = dto;

    const existingPayment = await this.feeRepo.getPaymentByRef(transactionRef);
    if (existingPayment) {
      console.log(`[PAYMENT] Idempotency triggered: Transaction ${transactionRef} already exists. Returning success.`);
      return existingPayment;
    }

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

      // 5. Financial Audit & Trace
      await AuditService.log(ctx.userId, AuditAction.PAYMENT, null, { voucherId, amountPaid, transactionRef }, voucher.campusId, txManager.transaction, {
        correlationId,
        transactionId,
        eventType: FinancialEventType.PAYMENT_RECEIVED
      });

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

  async createFeeStructure(ctx: RequestContext, dto: CreateFeeStructureDto): Promise<FeeStructure> {
    // Verify campus access
    if (ctx.campusIds.length > 0 && !ctx.campusIds.includes(dto.campusId)) {
      throw new BusinessRuleError('Access denied to this campus');
    }

    // Check if structure already exists
    const existing = await this.feeRepo.getStructure(dto.campusId, dto.classId);
    if (existing) {
      throw new BusinessRuleError('Fee structure already exists for this campus and class');
    }

    return await this.feeRepo.createStructure({
      campusId: dto.campusId,
      classId: dto.classId,
      monthlyFee: dto.monthlyFee,
      transportFee: dto.transportFee,
      examFee: dto.examFee,
      effectiveFromMonth: dto.effectiveFromMonth
    });
  }
}
