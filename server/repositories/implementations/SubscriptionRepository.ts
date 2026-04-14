import { poolPromise, sql } from '../../config/db';
import { ISubscriptionRepository } from '../../interfaces/repositories/ISubscriptionRepository';

export class SubscriptionRepository implements ISubscriptionRepository {
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
