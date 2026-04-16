import { poolPromise, sql } from '../../config/db';
import { FeeVoucher, StudentFeeLedger, FeeAdjustment, FeeStructure, Payment } from '../../models';
import { IFeeRepository } from '../../interfaces/repositories/IFeeRepository';

export class FeeRepository implements IFeeRepository {
  async getStructure(campusId: number, classId: number): Promise<FeeStructure | undefined> {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('campusId', sql.Int, campusId)
      .input('classId', sql.Int, classId)
      .query('SELECT * FROM FeeStructure WHERE CampusId = @campusId AND ClassId = @classId');
    const r = result.recordset[0];
    if (!r) return undefined;
    return {
      id: r.FeeStructureId,
      campusId: r.CampusId,
      classId: r.ClassId,
      monthlyFee: r.MonthlyFee,
      transportFee: r.TransportFee,
      examFee: r.ExamFee,
      effectiveFromMonth: r.EffectiveFromMonth
    };
  }

  async getVoucher(studentId: number, month: string, campusIds?: number[]): Promise<FeeVoucher | undefined> {
    const pool = await poolPromise;
    
    // Strict isolation: if no campusIds provided (and not superadmin in context logic), block access
    if (!campusIds || campusIds.length === 0) return undefined;

    let query = 'SELECT * FROM FeeVouchers WHERE StudentId = @studentId AND Month = @month';
    const request = pool.request()
      .input('studentId', sql.Int, studentId)
      .input('month', sql.NVarChar, month);
    
    query += ' AND CampusId IN (' + campusIds.join(',') + ')';
    
    const result = await request.query(query);
    const r = result.recordset[0];
    if (!r) return undefined;
    return {
      id: r.VoucherId,
      studentId: r.StudentId,
      campusId: r.CampusId,
      month: r.Month,
      totalAmount: r.TotalAmount,
      dueDate: r.DueDate,
      status: r.Status as 'Paid' | 'Unpaid',
      generatedAt: r.GeneratedAt
    };
  }

  async getVoucherById(id: number, campusIds?: number[]): Promise<FeeVoucher | undefined> {
    const pool = await poolPromise;
    
    // Strict isolation: block access if no campusIds authorized
    if (!campusIds || campusIds.length === 0) return undefined;

    let query = 'SELECT * FROM FeeVouchers WHERE VoucherId = @id';
    const request = pool.request().input('id', sql.Int, id);
    
    query += ' AND CampusId IN (' + campusIds.join(',') + ')';
    
    const result = await request.query(query);
    const r = result.recordset[0];
    if (!r) return undefined;
    return {
      id: r.VoucherId,
      studentId: r.StudentId,
      campusId: r.CampusId,
      month: r.Month,
      totalAmount: r.TotalAmount,
      dueDate: r.DueDate,
      status: r.Status as 'Paid' | 'Unpaid',
      generatedAt: r.GeneratedAt
    };
  }

  async createVoucher(voucher: any, transaction?: sql.Transaction): Promise<FeeVoucher> {
    const request = transaction ? new sql.Request(transaction) : (await poolPromise).request();
    const result = await request
      .input('studentId', sql.Int, voucher.studentId)
      .input('campusId', sql.Int, voucher.campusId)
      .input('month', sql.NVarChar, voucher.month)
      .input('totalAmount', sql.Decimal(18, 2), voucher.totalAmount)
      .input('dueDate', sql.DateTime, voucher.dueDate)
      .input('status', sql.NVarChar, voucher.status)
      .input('correlationId', sql.NVarChar, voucher.correlationId)
      .query(`INSERT INTO FeeVouchers (StudentId, CampusId, Month, TotalAmount, DueDate, Status, CorrelationId) 
              OUTPUT INSERTED.* 
              VALUES (@studentId, @campusId, @month, @totalAmount, @dueDate, @status, @correlationId)`);
    const r = result.recordset[0];
    return {
      id: r.VoucherId,
      studentId: r.StudentId,
      campusId: r.CampusId,
      month: r.Month,
      totalAmount: r.TotalAmount,
      dueDate: r.DueDate,
      status: r.Status as 'Paid' | 'Unpaid',
      generatedAt: r.GeneratedAt
    };
  }

  async updateVoucherStatus(voucherId: number, status: string, transaction?: sql.Transaction): Promise<void> {
    const request = transaction ? new sql.Request(transaction) : (await poolPromise).request();
    await request
      .input('id', sql.Int, voucherId)
      .input('status', sql.NVarChar, status)
      .query('UPDATE FeeVouchers SET Status = @status WHERE VoucherId = @id');
  }

  async updateVoucherAmount(studentId: number, month: string, amount: number, transaction?: sql.Transaction): Promise<void> {
    const request = transaction ? new sql.Request(transaction) : (await poolPromise).request();
    await request
      .input('studentId', sql.Int, studentId)
      .input('month', sql.NVarChar, month)
      .input('amount', sql.Decimal(18, 2), amount)
      .query('UPDATE FeeVouchers SET TotalAmount = @amount WHERE StudentId = @studentId AND Month = @month');
  }

  async getAdjustments(studentId: number, month: string): Promise<FeeAdjustment[]> {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('studentId', sql.Int, studentId)
      .input('month', sql.NVarChar, month)
      .query('SELECT * FROM FeeAdjustments WHERE StudentId = @studentId AND Month = @month');
    return result.recordset.map(r => ({
      id: r.AdjustmentId,
      studentId: r.StudentId,
      campusId: r.CampusId,
      month: r.Month,
      type: r.Type as 'Fine' | 'Discount' | 'Manual',
      amount: r.Amount,
      reason: r.Reason,
      createdBy: r.CreatedBy
    }));
  }

  async createPayment(payment: any, transaction?: sql.Transaction): Promise<Payment> {
    const request = transaction ? new sql.Request(transaction) : (await poolPromise).request();
    const result = await request
      .input('voucherId', sql.Int, payment.voucherId)
      .input('studentId', sql.Int, payment.studentId)
      .input('amountPaid', sql.Decimal(18, 2), payment.amountPaid)
      .input('paymentMethod', sql.NVarChar, payment.paymentMethod)
      .input('transactionRef', sql.NVarChar, payment.transactionRef)
      .input('paymentStatus', sql.NVarChar, payment.paymentStatus)
      .input('correlationId', sql.NVarChar, payment.correlationId)
      .query(`INSERT INTO Payments (VoucherId, StudentId, AmountPaid, PaymentMethod, TransactionRef, PaymentStatus, CorrelationId) 
              OUTPUT INSERTED.* 
              VALUES (@voucherId, @studentId, @amountPaid, @paymentMethod, @transactionRef, @paymentStatus, @correlationId)`);
    const r = result.recordset[0];
    return {
      id: r.PaymentId,
      voucherId: r.VoucherId,
      studentId: r.StudentId,
      amountPaid: r.AmountPaid,
      paymentMethod: r.PaymentMethod,
      transactionRef: r.TransactionRef,
      paymentStatus: r.PaymentStatus,
      paidAt: r.PaidAt
    };
  }

  async createAdjustment(adj: any, transaction?: sql.Transaction): Promise<any> {
    const request = transaction ? new sql.Request(transaction) : (await poolPromise).request();
    const result = await request
      .input('studentId', sql.Int, adj.studentId)
      .input('campusId', sql.Int, adj.campusId)
      .input('month', sql.NVarChar, adj.month)
      .input('type', sql.NVarChar, adj.type)
      .input('amount', sql.Decimal(18, 2), adj.amount)
      .input('reason', sql.NVarChar, adj.reason)
      .input('createdBy', sql.Int, adj.createdBy)
      .input('correlationId', sql.NVarChar, adj.correlationId)
      .query(`INSERT INTO FeeAdjustments (StudentId, CampusId, Month, Type, Amount, Reason, CreatedBy, CorrelationId) 
              OUTPUT INSERTED.* 
              VALUES (@studentId, @campusId, @month, @type, @amount, @reason, @createdBy, @correlationId)`);
    return result.recordset[0];
  }

  async getPaymentByRef(ref: string): Promise<Payment | undefined> {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('ref', sql.NVarChar, ref)
      .query('SELECT * FROM Payments WHERE TransactionRef = @ref');
    const r = result.recordset[0];
    if (!r) return undefined;
    return {
      id: r.PaymentId,
      voucherId: r.VoucherId,
      studentId: r.StudentId,
      amountPaid: r.AmountPaid,
      paymentMethod: r.PaymentMethod,
      transactionRef: r.TransactionRef,
      paymentStatus: r.PaymentStatus,
      paidAt: r.PaidAt
    };
  }

  async getAllPayments(campusIds?: number[]): Promise<Payment[]> {
    const pool = await poolPromise;
    
    // Strict isolation: block access if no campusIds authorized
    if (!campusIds || campusIds.length === 0) return [];

    let query = 'SELECT p.* FROM Payments p INNER JOIN FeeVouchers v ON p.VoucherId = v.VoucherId';
    query += ' WHERE v.CampusId IN (' + campusIds.join(',') + ')';
    
    const result = await pool.request().query(query);
    return result.recordset.map(r => ({
      id: r.PaymentId,
      voucherId: r.VoucherId,
      studentId: r.StudentId,
      amountPaid: r.AmountPaid,
      paymentMethod: r.PaymentMethod,
      transactionRef: r.TransactionRef,
      paymentStatus: r.PaymentStatus,
      paidAt: r.PaidAt
    }));
  }
}
