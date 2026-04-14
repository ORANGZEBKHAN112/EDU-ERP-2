import { poolPromise, sql } from '../../config/db';
import { IFinancialTraceRepository } from '../../interfaces/repositories/IFinancialTraceRepository';

export class FinancialTraceRepository implements IFinancialTraceRepository {
  async create(trace: any): Promise<void> {
    const pool = await poolPromise;
    await pool.request()
      .input('correlationId', sql.NVarChar, trace.correlationId)
      .input('studentId', sql.Int, trace.studentId)
      .input('actionType', sql.NVarChar, trace.actionType)
      .input('amount', sql.Decimal(18, 2), trace.amount)
      .input('requestContext', sql.NVarChar, JSON.stringify(trace.requestContext))
      .query(`
        INSERT INTO FinancialTraces (CorrelationId, StudentId, ActionType, Amount, RequestContext)
        VALUES (@correlationId, @studentId, @actionType, @amount, @requestContext)
      `);
  }

  async getByCorrelationId(correlationId: string): Promise<any> {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('correlationId', sql.NVarChar, correlationId)
      .query('SELECT * FROM FinancialTraces WHERE CorrelationId = @correlationId');
    return result.recordset[0];
  }
}
