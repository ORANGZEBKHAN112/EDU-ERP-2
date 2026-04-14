import { poolPromise, sql } from '../../config/db';
import { IFailedTransactionRepository } from '../../interfaces/repositories/IFailedTransactionRepository';

export class FailedTransactionRepository implements IFailedTransactionRepository {
  async addToQueue(item: any): Promise<void> {
    const pool = await poolPromise;
    await pool.request()
      .input('correlationId', sql.NVarChar, item.correlationId)
      .input('payload', sql.NVarChar, JSON.stringify(item.payload))
      .query(`
        IF NOT EXISTS (SELECT 1 FROM FailedTransactionQueue WHERE CorrelationId = @correlationId AND Status != 'RESOLVED')
        BEGIN
          INSERT INTO FailedTransactionQueue (CorrelationId, Payload)
          VALUES (@correlationId, @payload)
        END
      `);
  }

  async getPending(limit: number): Promise<any[]> {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('limit', sql.Int, limit)
      .query('SELECT TOP (@limit) * FROM FailedTransactionQueue WHERE Status IN (\'PENDING\', \'RETRYING\') AND RetryCount < 5 ORDER BY CreatedAt ASC');
    
    return result.recordset.map(r => ({
      id: r.QueueId,
      correlationId: r.CorrelationId,
      payload: JSON.parse(r.Payload),
      status: r.Status,
      retryCount: r.RetryCount
    }));
  }

  async updateStatus(queueId: number, status: string, error?: string): Promise<void> {
    const pool = await poolPromise;
    await pool.request()
      .input('id', sql.Int, queueId)
      .input('status', sql.NVarChar, status)
      .input('error', sql.NVarChar, error || null)
      .query('UPDATE FailedTransactionQueue SET Status = @status, ErrorMessage = @error, UpdatedAt = GETDATE() WHERE QueueId = @id');
  }

  async incrementRetry(queueId: number): Promise<void> {
    const pool = await poolPromise;
    await pool.request()
      .input('id', sql.Int, queueId)
      .query('UPDATE FailedTransactionQueue SET RetryCount = RetryCount + 1, Status = \'RETRYING\', UpdatedAt = GETDATE() WHERE QueueId = @id');
  }

  async getByCorrelationId(correlationId: string): Promise<any> {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('correlationId', sql.NVarChar, correlationId)
      .query('SELECT * FROM FailedTransactionQueue WHERE CorrelationId = @correlationId');
    return result.recordset[0];
  }
}
