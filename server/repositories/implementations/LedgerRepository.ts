import { poolPromise, sql } from '../../config/db';
import { StudentFeeLedger } from '../../models';
import { ILedgerRepository } from '../../interfaces/repositories/ILedgerRepository';

export class LedgerRepository implements ILedgerRepository {
  private buildIntInClause(values: number[], prefix: string, request: sql.Request): string {
    const sanitized = values
      .map(v => Number(v))
      .filter(v => Number.isInteger(v));

    if (sanitized.length === 0) {
      return 'NULL';
    }

    return sanitized
      .map((value, index) => {
        const name = `${prefix}${index}`;
        request.input(name, sql.Int, value);
        return `@${name}`;
      })
      .join(',');
  }

  async getLatestByStudent(studentId: number, month: string, transaction?: sql.Transaction): Promise<StudentFeeLedger | null> {
    const request = transaction ? new sql.Request(transaction) : (await poolPromise).request();
    const result = await request
      .input('studentId', sql.Int, studentId)
      .input('month', sql.NVarChar, month)
      .query('SELECT TOP 1 * FROM StudentFeeLedger WITH (UPDLOCK, HOLDLOCK) WHERE StudentId = @studentId AND Month = @month ORDER BY CreatedAt DESC');
    
    if (result.recordset.length === 0) return null;
    const l = result.recordset[0];
    return this.mapToLedger(l);
  }

  async getAllByStudent(studentId: number): Promise<StudentFeeLedger[]> {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('studentId', sql.Int, studentId)
      .query('SELECT * FROM StudentFeeLedger WHERE StudentId = @studentId ORDER BY CreatedAt DESC');
    return result.recordset.map(l => this.mapToLedger(l));
  }

  async create(ledger: any, transaction?: sql.Transaction): Promise<StudentFeeLedger> {
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
    return this.mapToLedger(result.recordset[0]);
  }

  async getOpeningBalance(studentId: number, month: string): Promise<number> {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('studentId', sql.Int, studentId)
      .input('month', sql.NVarChar, month)
      .query(`SELECT TOP 1 ClosingBalance FROM StudentFeeLedger 
              WHERE StudentId = @studentId AND Month < @month 
              ORDER BY Month DESC, CreatedAt DESC`);
    return result.recordset[0]?.ClosingBalance || 0;
  }

  async createBulk(ledgers: any[], transaction?: sql.Transaction): Promise<StudentFeeLedger[]> {
    if (ledgers.length === 0) return [];

    const request = transaction ? new sql.Request(transaction) : (await poolPromise).request();
    const createdLedgers = [];

    // Insert ledgers one by one (simpler approach)
    for (const ledger of ledgers) {
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
      
      createdLedgers.push(this.mapToLedger(result.recordset[0]));
    }

    return createdLedgers;
  }

  async getOpeningBalancesBulk(studentIds: number[], month: string): Promise<any[]> {
    if (studentIds.length === 0) return [];

    const pool = await poolPromise;
    const request = pool.request();
    const idsList = this.buildIntInClause(studentIds, 'studentId', request);
    
    const result = await request
      .input('month', sql.NVarChar, month)
      .query(`
        SELECT StudentId, COALESCE(ClosingBalance, 0) as amount
        FROM (
          SELECT StudentId, ClosingBalance,
                 ROW_NUMBER() OVER (PARTITION BY StudentId ORDER BY Month DESC, CreatedAt DESC) as rn
          FROM StudentFeeLedger 
          WHERE StudentId IN (${idsList}) AND Month < @month
        ) t
        WHERE rn = 1
      `);

    return result.recordset;
  }

  async getByCorrelationId(correlationId: string): Promise<StudentFeeLedger | null> {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('correlationId', sql.NVarChar, correlationId)
      .query('SELECT TOP 1 * FROM StudentFeeLedger WHERE CorrelationId = @correlationId ORDER BY CreatedAt DESC');

    if (result.recordset.length === 0) return null;
    return this.mapToLedger(result.recordset[0]);
  }

  private mapToLedger(l: any): StudentFeeLedger {
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
      status: l.Status as 'Paid' | 'Partial' | 'Unpaid'
    };
  }
}
