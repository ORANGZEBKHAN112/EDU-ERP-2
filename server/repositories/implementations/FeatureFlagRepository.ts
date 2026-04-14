import { poolPromise, sql } from '../../config/db';
import { IFeatureFlagRepository } from '../../interfaces/repositories/IFeatureFlagRepository';

export class FeatureFlagRepository implements IFeatureFlagRepository {
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
