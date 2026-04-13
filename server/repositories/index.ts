import { poolPromise, sql } from '../config/db';
import { School, Campus, User, Student, FeeVoucher, StudentFeeLedger, Payment, FeeAdjustment, Role } from '../models';

export interface IBaseRepository<T> {
  getAll(): Promise<T[]>;
  getById(id: number): Promise<T | undefined>;
}

export class SchoolRepository implements IBaseRepository<School> {
  async getAll() {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Schools');
    return result.recordset.map(r => ({
      id: r.SchoolId,
      name: r.SchoolName,
      country: r.Country,
      isActive: r.IsActive,
      createdAt: r.CreatedAt
    }));
  }

  async getById(id: number) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Schools WHERE SchoolId = @id');
    const r = result.recordset[0];
    if (!r) return undefined;
    return {
      id: r.SchoolId,
      name: r.SchoolName,
      country: r.Country,
      isActive: r.IsActive,
      createdAt: r.CreatedAt
    };
  }

  async create(item: Partial<School>) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('name', sql.NVarChar, item.name)
      .input('country', sql.NVarChar, item.country)
      .query('INSERT INTO Schools (SchoolName, Country) OUTPUT INSERTED.* VALUES (@name, @country)');
    const r = result.recordset[0];
    return {
      id: r.SchoolId,
      name: r.SchoolName,
      country: r.Country,
      isActive: r.IsActive,
      createdAt: r.CreatedAt
    };
  }
}

export class CampusRepository implements IBaseRepository<Campus> {
  async getAll() {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Campuses');
    return result.recordset.map(r => ({
      id: r.CampusId,
      schoolId: r.SchoolId,
      name: r.CampusName,
      state: r.State,
      city: r.City,
      address: r.Address,
      financeAdminUserId: r.FinanceAdminUserId,
      isActive: r.IsActive
    }));
  }

  async getById(id: number) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Campuses WHERE CampusId = @id');
    const r = result.recordset[0];
    if (!r) return undefined;
    return {
      id: r.CampusId,
      schoolId: r.SchoolId,
      name: r.CampusName,
      state: r.State,
      city: r.City,
      address: r.Address,
      financeAdminUserId: r.FinanceAdminUserId,
      isActive: r.IsActive
    };
  }

  async getBySchoolId(schoolId: number) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('schoolId', sql.Int, schoolId)
      .query('SELECT * FROM Campuses WHERE SchoolId = @schoolId');
    return result.recordset.map(r => ({
      id: r.CampusId,
      schoolId: r.SchoolId,
      name: r.CampusName,
      state: r.State,
      city: r.City,
      address: r.Address,
      financeAdminUserId: r.FinanceAdminUserId,
      isActive: r.IsActive
    }));
  }

  async create(item: Partial<Campus>) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('schoolId', sql.Int, item.schoolId)
      .input('name', sql.NVarChar, item.name)
      .input('state', sql.NVarChar, item.state)
      .input('city', sql.NVarChar, item.city)
      .input('address', sql.NVarChar, item.address)
      .input('financeAdminUserId', sql.Int, item.financeAdminUserId)
      .query(`INSERT INTO Campuses (SchoolId, CampusName, State, City, Address, FinanceAdminUserId) 
              OUTPUT INSERTED.* 
              VALUES (@schoolId, @name, @state, @city, @address, @financeAdminUserId)`);
    const r = result.recordset[0];
    return {
      id: r.CampusId,
      schoolId: r.SchoolId,
      name: r.CampusName,
      state: r.State,
      city: r.City,
      address: r.Address,
      financeAdminUserId: r.FinanceAdminUserId,
      isActive: r.IsActive
    };
  }
}

export class UserRepository {
  async getByEmail(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const pool = await poolPromise;
    const result = await pool.request()
      .input('email', sql.NVarChar, normalizedEmail)
      .query('SELECT * FROM Users WHERE LOWER(Email) = @email');
    const r = result.recordset[0];
    if (!r) return undefined;
    return {
      id: r.UserId,
      schoolId: r.SchoolId,
      fullName: r.FullName,
      email: r.Email,
      passwordHash: r.PasswordHash,
      phone: r.Phone,
      isActive: r.IsActive,
      createdAt: r.CreatedAt
    };
  }

  async getById(id: number) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Users WHERE UserId = @id');
    const r = result.recordset[0];
    if (!r) return undefined;
    return {
      id: r.UserId,
      schoolId: r.SchoolId,
      fullName: r.FullName,
      email: r.Email,
      passwordHash: r.PasswordHash,
      phone: r.Phone,
      isActive: r.IsActive,
      createdAt: r.CreatedAt
    };
  }

  async create(item: any, transaction?: sql.Transaction) {
    const request = transaction ? new sql.Request(transaction) : (await poolPromise).request();
    const result = await request
      .input('schoolId', sql.Int, item.schoolId)
      .input('fullName', sql.NVarChar, item.fullName)
      .input('email', sql.NVarChar, item.email)
      .input('passwordHash', sql.NVarChar, item.passwordHash)
      .input('phone', sql.NVarChar, item.phone)
      .query(`INSERT INTO Users (SchoolId, FullName, Email, PasswordHash, Phone) 
              OUTPUT INSERTED.* 
              VALUES (@schoolId, @fullName, @email, @passwordHash, @phone)`);
    const r = result.recordset[0];
    return {
      id: r.UserId,
      schoolId: r.SchoolId,
      fullName: r.FullName,
      email: r.Email,
      passwordHash: r.PasswordHash,
      phone: r.Phone,
      isActive: r.IsActive,
      createdAt: r.CreatedAt
    };
  }

  async addUserRole(userId: number, roleId: number, transaction?: sql.Transaction) {
    const request = transaction ? new sql.Request(transaction) : (await poolPromise).request();
    await request
      .input('userId', sql.Int, userId)
      .input('roleId', sql.Int, roleId)
      .query('INSERT INTO UserRoles (UserId, RoleId) VALUES (@userId, @roleId)');
  }

  async addUserCampus(userId: number, campusId: number, transaction?: sql.Transaction) {
    const request = transaction ? new sql.Request(transaction) : (await poolPromise).request();
    await request
      .input('userId', sql.Int, userId)
      .input('campusId', sql.Int, campusId)
      .query('INSERT INTO UserCampuses (UserId, CampusId) VALUES (@userId, @campusId)');
  }

  async count() {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT COUNT(*) as count FROM Users');
    return result.recordset[0].count;
  }

  async getUserRoles(userId: number) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`SELECT r.* FROM Roles r 
              INNER JOIN UserRoles ur ON r.RoleId = ur.RoleId 
              WHERE ur.UserId = @userId`);
    return result.recordset.map(r => ({
      id: r.RoleId,
      name: r.RoleName
    }));
  }

  async getUserCampuses(userId: number) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`SELECT c.* FROM Campuses c 
              INNER JOIN UserCampuses uc ON c.CampusId = uc.CampusId 
              WHERE uc.UserId = @userId`);
    return result.recordset.map(r => ({
      id: r.CampusId,
      schoolId: r.SchoolId,
      name: r.CampusName,
      state: r.State,
      city: r.City,
      address: r.Address,
      financeAdminUserId: r.FinanceAdminUserId,
      isActive: r.IsActive
    }));
  }
}

export class StudentRepository {
  async getAll(campusIds?: number[], schoolId?: number) {
    const pool = await poolPromise;
    let query = 'SELECT * FROM Students WHERE 1=1';
    const request = pool.request();
    
    if (schoolId) {
      query += ' AND SchoolId = @schoolId';
      request.input('schoolId', sql.Int, schoolId);
    }

    if (campusIds && campusIds.length > 0) {
      query += ' AND CampusId IN (' + campusIds.join(',') + ')';
    }
    
    const result = await request.query(query);
    return result.recordset.map(r => ({
      id: r.StudentId,
      schoolId: r.SchoolId,
      campusId: r.CampusId,
      classId: r.ClassId,
      admissionNo: r.AdmissionNo,
      fullName: r.FullName,
      fatherName: r.FatherName,
      phone: r.Phone,
      isActive: r.IsActive
    }));
  }

  async getById(id: number, campusIds?: number[], schoolId?: number) {
    const pool = await poolPromise;
    let query = 'SELECT * FROM Students WHERE StudentId = @id';
    const request = pool.request().input('id', sql.Int, id);
    
    if (schoolId) {
      query += ' AND SchoolId = @schoolId';
      request.input('schoolId', sql.Int, schoolId);
    }

    if (campusIds && campusIds.length > 0) {
      query += ' AND CampusId IN (' + campusIds.join(',') + ')';
    }
    
    const result = await request.query(query);
    const r = result.recordset[0];
    if (!r) return undefined;
    return {
      id: r.StudentId,
      schoolId: r.SchoolId,
      campusId: r.CampusId,
      classId: r.ClassId,
      admissionNo: r.AdmissionNo,
      fullName: r.FullName,
      fatherName: r.FatherName,
      phone: r.Phone,
      isActive: r.IsActive
    };
  }

  async create(item: Partial<Student>) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('schoolId', sql.Int, item.schoolId)
      .input('campusId', sql.Int, item.campusId)
      .input('classId', sql.Int, item.classId)
      .input('admissionNo', sql.NVarChar, item.admissionNo)
      .input('fullName', sql.NVarChar, item.fullName)
      .input('fatherName', sql.NVarChar, item.fatherName)
      .input('phone', sql.NVarChar, item.phone)
      .query(`INSERT INTO Students (SchoolId, CampusId, ClassId, AdmissionNo, FullName, FatherName, Phone) 
              OUTPUT INSERTED.* 
              VALUES (@schoolId, @campusId, @classId, @admissionNo, @fullName, @fatherName, @phone)`);
    const r = result.recordset[0];
    return {
      id: r.StudentId,
      schoolId: r.SchoolId,
      campusId: r.CampusId,
      classId: r.ClassId,
      admissionNo: r.AdmissionNo,
      fullName: r.FullName,
      fatherName: r.FatherName,
      phone: r.Phone,
      isActive: r.IsActive
    };
  }
}

export class FeeRepository {
  async getStructure(campusId: number, classId: number) {
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

  async getVoucher(studentId: number, month: string, campusIds?: number[]) {
    const pool = await poolPromise;
    let query = 'SELECT * FROM FeeVouchers WHERE StudentId = @studentId AND Month = @month';
    const request = pool.request()
      .input('studentId', sql.Int, studentId)
      .input('month', sql.NVarChar, month);
    
    if (campusIds && campusIds.length > 0) {
      query += ' AND CampusId IN (' + campusIds.join(',') + ')';
    }
    
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
      status: r.Status,
      generatedAt: r.GeneratedAt
    };
  }

  async getVoucherById(id: number, campusIds?: number[]) {
    const pool = await poolPromise;
    let query = 'SELECT * FROM FeeVouchers WHERE VoucherId = @id';
    const request = pool.request().input('id', sql.Int, id);
    
    if (campusIds && campusIds.length > 0) {
      query += ' AND CampusId IN (' + campusIds.join(',') + ')';
    }
    
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
      status: r.Status,
      generatedAt: r.GeneratedAt
    };
  }

  async createVoucher(voucher: any, transaction?: sql.Transaction) {
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
      status: r.Status,
      generatedAt: r.GeneratedAt
    };
  }

  async getLedger(studentId: number, month: string, campusIds?: number[]) {
    const pool = await poolPromise;
    let query = 'SELECT * FROM StudentFeeLedger WHERE StudentId = @studentId AND Month = @month';
    const request = pool.request()
      .input('studentId', sql.Int, studentId)
      .input('month', sql.NVarChar, month);
    
    if (campusIds && campusIds.length > 0) {
      query += ' AND CampusId IN (' + campusIds.join(',') + ')';
    }
    
    const result = await request.query(query);
    const r = result.recordset[0];
    if (!r) return undefined;
    return {
      id: r.LedgerId,
      studentId: r.StudentId,
      campusId: r.CampusId,
      month: r.Month,
      openingBalance: r.OpeningBalance,
      monthlyFee: r.MonthlyFee,
      fine: r.Fine,
      discount: r.Discount,
      paidAmount: r.PaidAmount,
      closingBalance: r.ClosingBalance,
      status: r.Status
    };
  }

  async createLedger(ledger: any, transaction?: sql.Transaction) {
    const request = transaction ? new sql.Request(transaction) : (await poolPromise).request();
    const result = await request
      .input('studentId', sql.Int, ledger.studentId)
      .input('campusId', sql.Int, ledger.campusId)
      .input('month', sql.NVarChar, ledger.month)
      .input('openingBalance', sql.Decimal(18, 2), ledger.openingBalance)
      .input('monthlyFee', sql.Decimal(18, 2), ledger.monthlyFee)
      .input('fine', sql.Decimal(18, 2), ledger.fine)
      .input('discount', sql.Decimal(18, 2), ledger.discount)
      .input('paidAmount', sql.Decimal(18, 2), ledger.paidAmount)
      .input('closingBalance', sql.Decimal(18, 2), ledger.closingBalance)
      .input('status', sql.NVarChar, ledger.status)
      .input('entryType', sql.NVarChar, ledger.entryType)
      .input('correlationId', sql.NVarChar, ledger.correlationId)
      .input('transactionId', sql.NVarChar, ledger.transactionId)
      .query(`INSERT INTO StudentFeeLedger 
              (StudentId, CampusId, Month, OpeningBalance, MonthlyFee, Fine, Discount, PaidAmount, ClosingBalance, Status, EntryType, CorrelationId, TransactionId)
              OUTPUT INSERTED.*
              VALUES (@studentId, @campusId, @month, @openingBalance, @monthlyFee, @fine, @discount, @paidAmount, @closingBalance, @status, @entryType, @correlationId, @transactionId)`);
    const r = result.recordset[0];
    return {
      id: r.LedgerId,
      studentId: r.StudentId,
      campusId: r.CampusId,
      month: r.Month,
      openingBalance: r.OpeningBalance,
      monthlyFee: r.MonthlyFee,
      fine: r.Fine,
      discount: r.Discount,
      paidAmount: r.PaidAmount,
      closingBalance: r.ClosingBalance,
      status: r.Status
    };
  }

  async getLatestLedger(studentId: number, month: string, transaction?: sql.Transaction) {
    const request = transaction ? new sql.Request(transaction) : (await poolPromise).request();
    const result = await request
      .input('studentId', sql.Int, studentId)
      .input('month', sql.NVarChar, month)
      .query('SELECT TOP 1 * FROM StudentFeeLedger WHERE StudentId = @studentId AND Month = @month ORDER BY CreatedAt DESC');
    
    if (result.recordset.length === 0) return null;
    const l = result.recordset[0];
    return {
      id: l.LedgerId,
      studentId: l.StudentId,
      campusId: l.CampusId,
      month: l.Month,
      openingBalance: l.OpeningBalance,
      monthlyFee: l.MonthlyFee,
      fine: l.Fine,
      discount: l.Discount,
      paidAmount: l.PaidAmount,
      closingBalance: l.ClosingBalance,
      status: l.Status
    };
  }

  async updateVoucherStatus(voucherId: number, status: string, transaction?: sql.Transaction) {
    const request = transaction ? new sql.Request(transaction) : (await poolPromise).request();
    await request
      .input('id', sql.Int, voucherId)
      .input('status', sql.NVarChar, status)
      .query('UPDATE FeeVouchers SET Status = @status WHERE VoucherId = @id');
  }

  async updateVoucherAmount(studentId: number, month: string, amount: number, transaction?: sql.Transaction) {
    const request = transaction ? new sql.Request(transaction) : (await poolPromise).request();
    await request
      .input('studentId', sql.Int, studentId)
      .input('month', sql.NVarChar, month)
      .input('amount', sql.Decimal(18, 2), amount)
      .query('UPDATE FeeVouchers SET TotalAmount = @amount WHERE StudentId = @studentId AND Month = @month');
  }

  async getLedgerById(id: number) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM StudentFeeLedger WHERE LedgerId = @id');
    const r = result.recordset[0];
    if (!r) return undefined;
    return {
      id: r.LedgerId,
      studentId: r.StudentId,
      campusId: r.CampusId,
      month: r.Month,
      openingBalance: r.OpeningBalance,
      monthlyFee: r.MonthlyFee,
      fine: r.Fine,
      discount: r.Discount,
      paidAmount: r.PaidAmount,
      closingBalance: r.ClosingBalance,
      status: r.Status
    };
  }

  async getAdjustments(studentId: number, month: string) {
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
      type: r.Type,
      amount: r.Amount,
      reason: r.Reason,
      createdBy: r.CreatedBy,
      createdAt: r.CreatedAt
    }));
  }

  async createPayment(payment: any, transaction?: sql.Transaction) {
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

  async createAdjustment(adj: any, transaction?: sql.Transaction) {
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

  async getPaymentByRef(ref: string) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('ref', sql.NVarChar, ref)
      .query('SELECT * FROM Payments WHERE TransactionRef = @ref');
    return result.recordset[0];
  }

  async getAllPayments(campusIds?: number[]) {
    const pool = await poolPromise;
    let query = 'SELECT p.* FROM Payments p INNER JOIN FeeVouchers v ON p.VoucherId = v.VoucherId';
    if (campusIds && campusIds.length > 0) {
      query += ' WHERE v.CampusId IN (' + campusIds.join(',') + ')';
    }
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

export class ReportRepository {
  async getSuperAdminOverview() {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        (SELECT COUNT(*) FROM Schools) as TotalSchools,
        (SELECT COUNT(*) FROM Campuses) as TotalCampuses,
        (SELECT COUNT(*) FROM Students) as TotalStudents,
        (SELECT SUM(AmountPaid) FROM Payments WHERE PaymentStatus = 'Completed') as TotalRevenue,
        (SELECT SUM(ClosingBalance) FROM StudentFeeLedger) as TotalPendingDues
    `);
    return result.recordset[0];
  }

  async getCampusSummary(campusIds?: number[]) {
    const pool = await poolPromise;
    let query = `
      SELECT 
        c.CampusId,
        c.CampusName,
        COUNT(DISTINCT s.StudentId) as TotalStudents,
        SUM(p.AmountPaid) as Revenue,
        SUM(l.ClosingBalance) as PendingDues
      FROM Campuses c
      LEFT JOIN Students s ON c.CampusId = s.CampusId
      LEFT JOIN Payments p ON s.StudentId = p.StudentId AND p.PaymentStatus = 'Completed'
      LEFT JOIN StudentFeeLedger l ON s.StudentId = l.StudentId
    `;
    
    if (campusIds && campusIds.length > 0) {
      query += ' WHERE c.CampusId IN (' + campusIds.join(',') + ')';
    }
    
    query += ' GROUP BY c.CampusId, c.CampusName';
    
    const result = await pool.request().query(query);
    return result.recordset;
  }

  async getDefaulters(campusIds?: number[]) {
    const pool = await poolPromise;
    let query = `
      SELECT 
        s.StudentId,
        s.FullName,
        s.AdmissionNo,
        c.CampusName,
        l.Month,
        l.ClosingBalance as PendingAmount
      FROM Students s
      INNER JOIN StudentFeeLedger l ON s.StudentId = l.StudentId
      INNER JOIN Campuses c ON s.CampusId = c.CampusId
      WHERE l.ClosingBalance > 0 AND l.Status != 'Paid'
    `;
    
    if (campusIds && campusIds.length > 0) {
      query += ' AND s.CampusId IN (' + campusIds.join(',') + ')';
    }
    
    const result = await pool.request().query(query);
    return result.recordset;
  }
}

export class AuditRepository {
  async create(log: any, transaction?: sql.Transaction) {
    const request = transaction ? new sql.Request(transaction) : (await poolPromise).request();
    await request
      .input('userId', sql.Int, log.userId)
      .input('action', sql.NVarChar, log.action)
      .input('beforeState', sql.NVarChar, JSON.stringify(log.beforeState))
      .input('afterState', sql.NVarChar, JSON.stringify(log.afterState))
      .input('campusId', sql.Int, log.campusId)
      .input('eventType', sql.NVarChar, log.eventType)
      .input('transactionId', sql.NVarChar, log.transactionId)
      .input('correlationId', sql.NVarChar, log.correlationId)
      .query(`INSERT INTO AuditLogs (UserId, Action, BeforeState, AfterState, CampusId, EventType, TransactionId, CorrelationId) 
              VALUES (@userId, @action, @beforeState, @afterState, @campusId, @eventType, @transactionId, @correlationId)`);
  }
}

export class JobRepository {
  async acquireLock(jobName: string, instanceId: string, durationSeconds: number): Promise<boolean> {
    const pool = await poolPromise;
    const expiresAt = new Date(Date.now() + durationSeconds * 1000);
    
    try {
      // Try to insert a new lock or update an expired one
      const result = await pool.request()
        .input('jobName', sql.NVarChar, jobName)
        .input('instanceId', sql.NVarChar, instanceId)
        .input('expiresAt', sql.DateTime, expiresAt)
        .input('now', sql.DateTime, new Date())
        .query(`
          IF NOT EXISTS (SELECT 1 FROM JobLocks WHERE JobName = @jobName)
          BEGIN
            INSERT INTO JobLocks (JobName, LockedBy, ExpiresAt) VALUES (@jobName, @instanceId, @expiresAt);
            SELECT 1 as Success;
          END
          ELSE
          BEGIN
            UPDATE JobLocks 
            SET LockedBy = @instanceId, LockedAt = @now, ExpiresAt = @expiresAt
            WHERE JobName = @jobName AND ExpiresAt < @now;
            SELECT @@ROWCOUNT as Success;
          END
        `);
      return result.recordset[0].Success === 1;
    } catch (err) {
      return false;
    }
  }

  async releaseLock(jobName: string, instanceId: string) {
    const pool = await poolPromise;
    await pool.request()
      .input('jobName', sql.NVarChar, jobName)
      .input('instanceId', sql.NVarChar, instanceId)
      .query('DELETE FROM JobLocks WHERE JobName = @jobName AND LockedBy = @instanceId');
  }

  async startExecution(jobName: string, instanceId: string, executionDate: string, campusId?: number) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('jobName', sql.NVarChar, jobName)
      .input('instanceId', sql.NVarChar, instanceId)
      .input('executionDate', sql.NVarChar, executionDate)
      .input('campusId', sql.Int, campusId)
      .query(`
        INSERT INTO JobExecutions (JobName, InstanceId, ExecutionDate, Status, StartTime, CampusId)
        OUTPUT INSERTED.ExecutionId
        VALUES (@jobName, @instanceId, @executionDate, 'Running', GETDATE(), @campusId)
      `);
    return result.recordset[0].ExecutionId;
  }

  async endExecution(executionId: number, status: 'Success' | 'Failed', errorMessage?: string) {
    const pool = await poolPromise;
    await pool.request()
      .input('id', sql.Int, executionId)
      .input('status', sql.NVarChar, status)
      .input('error', sql.NVarChar, errorMessage)
      .query(`
        UPDATE JobExecutions 
        SET Status = @status, EndTime = GETDATE(), ErrorMessage = @error
        WHERE ExecutionId = @id
      `);
  }

  async isAlreadyExecuted(jobName: string, executionDate: string, campusId?: number): Promise<boolean> {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('jobName', sql.NVarChar, jobName)
      .input('executionDate', sql.NVarChar, executionDate)
      .input('campusId', sql.Int, campusId)
      .query(`
        SELECT 1 as Executed FROM JobExecutions 
        WHERE JobName = @jobName AND ExecutionDate = @executionDate AND Status = 'Success'
        ${campusId ? 'AND CampusId = @campusId' : ''}
      `);
    return result.recordset.length > 0;
  }
}

export class EventRepository {
  async createEvent(event: any, transaction?: sql.Transaction) {
    const request = transaction ? new sql.Request(transaction) : (await poolPromise).request();
    await request
      .input('type', sql.NVarChar, event.type)
      .input('payload', sql.NVarChar, JSON.stringify(event.payload))
      .input('correlationId', sql.NVarChar, event.correlationId)
      .input('userId', sql.Int, event.userId)
      .input('campusId', sql.Int, event.campusId)
      .query(`
        INSERT INTO FinancialEvents (EventType, Payload, CorrelationId, UserId, CampusId, Status)
        VALUES (@type, @payload, @correlationId, @userId, @campusId, 'Pending')
      `);
  }

  async getPendingEvents(limit: number, instanceId: string) {
    const pool = await poolPromise;
    // Atomic lock and fetch with ordering
    const result = await pool.request()
      .input('limit', sql.Int, limit)
      .input('instanceId', sql.NVarChar, instanceId)
      .query(`
        WITH CTE AS (
          SELECT TOP (@limit) * FROM FinancialEvents 
          WHERE (Status = 'Pending' OR (Status = 'Failed' AND RetryCount < 3 AND IsDeadLetter = 0))
          AND (LockedBy IS NULL OR LockedAt < DATEADD(minute, -10, GETDATE()))
          ORDER BY SequenceNumber ASC
        )
        UPDATE CTE
        SET Status = 'Processing', 
            LockedBy = @instanceId, 
            LockedAt = GETDATE()
        OUTPUT INSERTED.*
      `);
    return result.recordset;
  }

  async updateEventStatus(eventId: number, status: string, error?: string, transaction?: sql.Transaction) {
    const request = transaction ? new sql.Request(transaction) : (await poolPromise).request();
    await request
      .input('id', sql.Int, eventId)
      .input('status', sql.NVarChar, status)
      .input('error', sql.NVarChar, error || null)
      .query(`
        UPDATE FinancialEvents 
        SET Status = @status, 
            ProcessedAt = CASE WHEN @status = 'Processed' THEN GETDATE() ELSE ProcessedAt END,
            ErrorMessage = @error,
            RetryCount = CASE WHEN @status = 'Failed' THEN RetryCount + 1 ELSE RetryCount END,
            IsDeadLetter = CASE WHEN @status = 'Failed' AND RetryCount >= 2 THEN 1 ELSE IsDeadLetter END,
            LockedBy = NULL,
            LockedAt = NULL
        WHERE EventId = @id
      `);
  }

  async getDeadLetterEvents() {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM FinancialEvents WHERE IsDeadLetter = 1 ORDER BY CreatedAt DESC");
    return result.recordset;
  }

  async retryEvent(eventId: number) {
    const pool = await poolPromise;
    await pool.request()
      .input('id', sql.Int, eventId)
      .query("UPDATE FinancialEvents SET Status = 'Pending', IsDeadLetter = 0, RetryCount = 0, ErrorMessage = NULL WHERE EventId = @id");
  }
}

export class SubscriptionRepository {
  async getBySchoolId(schoolId: number) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('schoolId', sql.Int, schoolId)
      .query('SELECT TOP 1 * FROM Subscriptions WHERE SchoolId = @schoolId AND Status = \'Active\' ORDER BY EndDate DESC');
    return result.recordset[0];
  }

  async create(item: any, transaction?: sql.Transaction) {
    const request = transaction ? new sql.Request(transaction) : (await poolPromise).request();
    await request
      .input('schoolId', sql.Int, item.schoolId)
      .input('planType', sql.NVarChar, item.planType)
      .input('startDate', sql.DateTime, item.startDate)
      .input('endDate', sql.DateTime, item.endDate)
      .input('status', sql.NVarChar, item.status)
      .query(`INSERT INTO Subscriptions (SchoolId, PlanType, StartDate, EndDate, Status) 
              VALUES (@schoolId, @planType, @startDate, @endDate, @status)`);
  }
}

export class FeatureFlagRepository {
  async getBySchoolId(schoolId: number) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('schoolId', sql.Int, schoolId)
      .query('SELECT FeatureName, IsEnabled FROM TenantFeatureFlags WHERE SchoolId = @schoolId');
    return result.recordset;
  }

  async create(item: any, transaction?: sql.Transaction) {
    const request = transaction ? new sql.Request(transaction) : (await poolPromise).request();
    await request
      .input('schoolId', sql.Int, item.schoolId)
      .input('featureName', sql.NVarChar, item.featureName)
      .input('isEnabled', sql.Bit, item.isEnabled)
      .query('INSERT INTO TenantFeatureFlags (SchoolId, FeatureName, IsEnabled) VALUES (@schoolId, @featureName, @isEnabled)');
  }
}

export class RoleRepository {
  async getByName(name: string) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .query('SELECT * FROM Roles WHERE RoleName = @name');
    return result.recordset[0];
  }
}

export class BillingRepository {
  async createInvoice(invoice: any, transaction?: sql.Transaction) {
    const request = transaction ? new sql.Request(transaction) : (await poolPromise).request();
    await request
      .input('schoolId', sql.Int, invoice.schoolId)
      .input('subId', sql.Int, invoice.subscriptionId)
      .input('amount', sql.Decimal(18, 2), invoice.amount)
      .input('status', sql.NVarChar, invoice.status)
      .input('dueDate', sql.DateTime, invoice.dueDate)
      .input('start', sql.DateTime, invoice.billingPeriodStart)
      .input('end', sql.DateTime, invoice.billingPeriodEnd)
      .query(`INSERT INTO TenantInvoices (SchoolId, SubscriptionId, Amount, Status, DueDate, BillingPeriodStart, BillingPeriodEnd)
              VALUES (@schoolId, @subId, @amount, @status, @dueDate, @start, @end)`);
  }

  async getOverdueInvoices() {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM TenantInvoices WHERE Status = 'Pending' AND DueDate < GETDATE()");
    return result.recordset;
  }
}

export class UsageRepository {
  async incrementMetric(schoolId: number, metricName: string, value: number = 1) {
    const pool = await poolPromise;
    await pool.request()
      .input('schoolId', sql.Int, schoolId)
      .input('name', sql.NVarChar, metricName)
      .input('val', sql.BigInt, value)
      .query(`
        MERGE INTO TenantUsageMetrics AS target
        USING (SELECT @schoolId as SchoolId, @name as MetricName) AS source
        ON (target.SchoolId = source.SchoolId AND target.MetricName = source.MetricName)
        WHEN MATCHED THEN
          UPDATE SET MetricValue = MetricValue + @val, LastUpdated = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (SchoolId, MetricName, MetricValue) VALUES (@schoolId, @name, @val);
      `);
  }

  async getMetric(schoolId: number, metricName: string) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('schoolId', sql.Int, schoolId)
      .input('name', sql.NVarChar, metricName)
      .query('SELECT MetricValue FROM TenantUsageMetrics WHERE SchoolId = @schoolId AND MetricName = @name');
    return result.recordset[0]?.MetricValue || 0;
  }
}

export class MetricsRepository {
  async logMetric(type: string, value: number, context?: any) {
    const pool = await poolPromise;
    await pool.request()
      .input('type', sql.NVarChar, type)
      .input('value', sql.Decimal(18, 4), value)
      .input('context', sql.NVarChar, context ? JSON.stringify(context) : null)
      .query('INSERT INTO SystemMetrics (MetricType, Value, Context) VALUES (@type, @value, @context)');
  }

  async getHealthSummary() {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT MetricType, AVG(Value) as AvgValue, COUNT(*) as Count
      FROM SystemMetrics
      WHERE CreatedAt > DATEADD(hour, -1, GETDATE())
      GROUP BY MetricType
    `);
    return result.recordset;
  }
}

export class SummaryRepository {
  async updateCampusMonthlySummary(campusId: number, month: string, transaction?: sql.Transaction) {
    const request = transaction ? new sql.Request(transaction) : (await poolPromise).request();
    
    await request
      .input('campusId', sql.Int, campusId)
      .input('month', sql.NVarChar, month)
      .query(`
        MERGE INTO CampusMonthlySummary AS target
        USING (
          SELECT 
            @campusId as CampusId,
            @month as Month,
            SUM(PaidAmount) as TotalRevenue,
            SUM(ClosingBalance) as TotalPending,
            COUNT(DISTINCT StudentId) as TotalStudents,
            COUNT(DISTINCT CASE WHEN Status = 'Paid' THEN StudentId END) as PaidStudents,
            COUNT(DISTINCT CASE WHEN Status != 'Paid' THEN StudentId END) as UnpaidStudents
          FROM (
            SELECT StudentId, PaidAmount, ClosingBalance, Status,
                   ROW_NUMBER() OVER (PARTITION BY StudentId ORDER BY CreatedAt DESC) as rn
            FROM StudentFeeLedger
            WHERE CampusId = @campusId AND Month = @month
          ) as LatestLedger
          WHERE rn = 1
        ) AS source
        ON (target.CampusId = source.CampusId AND target.Month = source.Month)
        WHEN MATCHED THEN
          UPDATE SET 
            TotalRevenue = source.TotalRevenue,
            TotalPending = source.TotalPending,
            TotalStudents = source.TotalStudents,
            PaidStudents = source.PaidStudents,
            UnpaidStudents = source.UnpaidStudents,
            LastUpdated = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (CampusId, Month, TotalRevenue, TotalPending, TotalStudents, PaidStudents, UnpaidStudents, LastUpdated)
          VALUES (source.CampusId, source.Month, source.TotalRevenue, source.TotalPending, source.TotalStudents, source.PaidStudents, source.UnpaidStudents, GETDATE());
      `);
  }

  async getSuperAdminStats() {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        ISNULL(SUM(TotalRevenue), 0) as totalRevenue,
        ISNULL(SUM(TotalPending), 0) as totalPendingDues,
        ISNULL(SUM(TotalStudents), 0) as totalStudents,
        CASE WHEN SUM(TotalRevenue + TotalPending) > 0 
             THEN (SUM(TotalRevenue) * 100.0 / SUM(TotalRevenue + TotalPending)) 
             ELSE 0 END as collectionRate
      FROM CampusMonthlySummary
    `);
    return result.recordset[0];
  }

  async getMonthlyRevenueTrend() {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT Month as month, SUM(TotalRevenue) as revenue
      FROM CampusMonthlySummary
      GROUP BY Month
      ORDER BY Month ASC
    `);
    return result.recordset;
  }

  async getCampusStats(campusId: number) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('campusId', sql.Int, campusId)
      .query(`
        SELECT 
          ISNULL(SUM(TotalRevenue), 0) as campusRevenue,
          ISNULL(SUM(TotalPending), 0) as pendingDues,
          ISNULL(SUM(PaidStudents), 0) as paidStudentsCount,
          ISNULL(SUM(UnpaidStudents), 0) as unpaidStudentsCount
        FROM CampusMonthlySummary
        WHERE CampusId = @campusId
      `);
    return result.recordset[0];
  }

  async getDefaulters() {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        s.StudentId as studentId,
        s.Name as name,
        c.Name as campus,
        l.ClosingBalance as outstandingAmount,
        DATEDIFF(day, v.DueDate, GETDATE()) as overdueDays
      FROM StudentFeeLedger l
      JOIN Students s ON l.StudentId = s.StudentId
      JOIN Campuses c ON l.CampusId = c.CampusId
      JOIN FeeVouchers v ON l.StudentId = v.StudentId AND l.Month = v.Month
      WHERE l.Status != 'Paid' AND l.ClosingBalance > 0
      AND l.LedgerId IN (
        SELECT MAX(LedgerId) FROM StudentFeeLedger GROUP BY StudentId, Month
      )
      ORDER BY overdueDays DESC
    `);
    return result.recordset;
  }

  async getPaymentInsights() {
    const pool = await poolPromise;
    const daily = await pool.request().query(`
      SELECT CAST(CreatedAt AS DATE) as date, SUM(AmountPaid) as amount
      FROM FeePayments
      GROUP BY CAST(CreatedAt AS DATE)
      ORDER BY date ASC
    `);
    
    const methods = await pool.request().query(`
      SELECT PaymentMethod as method, SUM(AmountPaid) as amount
      FROM FeePayments
      GROUP BY PaymentMethod
    `);

    return {
      dailyCollections: daily.recordset,
      methodBreakdown: methods.recordset
    };
  }
}

