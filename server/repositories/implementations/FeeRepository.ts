import { poolPromise, sql } from '../../config/db';
import { FeeVoucher, StudentFeeLedger, FeeAdjustment, FeeStructure, Payment } from '../../models';
import { IFeeRepository } from '../../interfaces/repositories/IFeeRepository';

export class FeeRepository implements IFeeRepository {
  async getStructures(campusIds?: number[], schoolId?: number): Promise<any[]> {
    const pool = await poolPromise;
    let query = `
      SELECT fs.*, c.ClassName 
      FROM FeeStructure fs 
      INNER JOIN Classes c ON fs.ClassId = c.ClassId
      WHERE 1=1
    `;
    const request = pool.request();

    if (schoolId) {
      query += ' AND fs.SchoolId = @schoolId';
      request.input('schoolId', sql.Int, schoolId);
    }
    if (campusIds && campusIds.length > 0) {
      query += ' AND fs.CampusId IN (' + campusIds.join(',') + ')';
    }

    const result = await request.query(query);
    return result.recordset.map(r => ({
      id: r.FeeStructureId,
      campusId: r.CampusId,
      classId: r.ClassId,
      className: r.ClassName,
      monthlyFee: r.MonthlyFee,
      transportFee: r.TransportFee,
      examFee: r.ExamFee,
      effectiveFromMonth: r.EffectiveFromMonth
    }));
  }

  async upsertStructure(structure: any): Promise<void> {
    const pool = await poolPromise;
    await pool.request()
      .input('campusId', sql.Int, structure.campusId)
      .input('classId', sql.Int, structure.classId)
      .input('schoolId', sql.Int, structure.schoolId)
      .input('monthlyFee', sql.Decimal(18, 2), structure.monthlyFee)
      .input('transportFee', sql.Decimal(18, 2), structure.transportFee)
      .input('examFee', sql.Decimal(18, 2), structure.examFee || 0)
      .input('effectiveFromMonth', sql.NVarChar, structure.effectiveFromMonth || '2024-01')
      .query(`
        IF EXISTS (SELECT 1 FROM FeeStructure WHERE ClassId = @classId AND CampusId = @campusId)
        BEGIN
          UPDATE FeeStructure 
          SET MonthlyFee = @monthlyFee, 
              TransportFee = @transportFee, 
              ExamFee = @examFee,
              SchoolId = @schoolId
          WHERE ClassId = @classId AND CampusId = @campusId
        END
        ELSE
        BEGIN
          INSERT INTO FeeStructure (CampusId, ClassId, SchoolId, MonthlyFee, TransportFee, ExamFee, EffectiveFromMonth)
          VALUES (@campusId, @classId, @schoolId, @monthlyFee, @transportFee, @examFee, @effectiveFromMonth)
        END
      `);
  }

  async getVouchers(campusIds?: number[], schoolId?: number, month?: string): Promise<any[]> {
    const pool = await poolPromise;
    let query = `
      SELECT v.*, s.FullName as StudentName, c.ClassName 
      FROM FeeVouchers v
      INNER JOIN Students s ON v.StudentId = s.StudentId
      INNER JOIN Classes c ON s.ClassId = c.ClassId
      WHERE 1=1
    `;
    const request = pool.request();

    if (schoolId) {
      query += ' AND v.SchoolId = @schoolId';
      request.input('schoolId', sql.Int, schoolId);
    }
    if (campusIds && campusIds.length > 0) {
      query += ' AND v.CampusId IN (' + campusIds.join(',') + ')';
    }
    if (month) {
      query += ' AND v.Month = @month';
      request.input('month', sql.NVarChar, month);
    }

    const result = await request.query(query);
    return result.recordset.map(r => ({
      id: r.VoucherId,
      studentId: r.StudentId,
      studentName: r.StudentName,
      className: r.ClassName,
      campusId: r.CampusId,
      month: r.Month,
      totalAmount: r.TotalAmount,
      dueDate: r.DueDate,
      status: r.Status,
      generatedAt: r.GeneratedAt
    }));
  }

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
      .input('schoolId', sql.Int, voucher.schoolId)
      .input('month', sql.NVarChar, voucher.month)
      .input('totalAmount', sql.Decimal(18, 2), voucher.totalAmount)
      .input('dueDate', sql.DateTime, voucher.dueDate)
      .input('status', sql.NVarChar, voucher.status)
      .input('correlationId', sql.NVarChar, voucher.correlationId)
      .query(`INSERT INTO FeeVouchers (StudentId, CampusId, SchoolId, Month, TotalAmount, DueDate, Status, CorrelationId) 
              OUTPUT INSERTED.* 
              VALUES (@studentId, @campusId, @schoolId, @month, @totalAmount, @dueDate, @status, @correlationId)`);
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
      .input('campusId', sql.Int, payment.campusId)
      .input('schoolId', sql.Int, payment.schoolId)
      .input('amountPaid', sql.Decimal(18, 2), payment.amountPaid)
      .input('paymentMethod', sql.NVarChar, payment.paymentMethod)
      .input('transactionRef', sql.NVarChar, payment.transactionRef)
      .input('paymentStatus', sql.NVarChar, payment.paymentStatus)
      .input('correlationId', sql.NVarChar, payment.correlationId)
      .query(`INSERT INTO Payments (VoucherId, StudentId, CampusId, SchoolId, AmountPaid, PaymentMethod, TransactionRef, PaymentStatus, CorrelationId) 
              OUTPUT INSERTED.* 
              VALUES (@voucherId, @studentId, @campusId, @schoolId, @amountPaid, @paymentMethod, @transactionRef, @paymentStatus, @correlationId)`);
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
      .input('schoolId', sql.Int, adj.schoolId)
      .input('month', sql.NVarChar, adj.month)
      .input('type', sql.NVarChar, adj.type)
      .input('amount', sql.Decimal(18, 2), adj.amount)
      .input('reason', sql.NVarChar, adj.reason)
      .input('createdBy', sql.Int, adj.createdBy)
      .input('correlationId', sql.NVarChar, adj.correlationId)
      .query(`INSERT INTO FeeAdjustments (StudentId, CampusId, SchoolId, Month, Type, Amount, Reason, CreatedBy, CorrelationId) 
              OUTPUT INSERTED.* 
              VALUES (@studentId, @campusId, @schoolId, @month, @type, @amount, @reason, @createdBy, @correlationId)`);
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
