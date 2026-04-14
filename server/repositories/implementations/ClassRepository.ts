import { poolPromise, sql } from '../../config/db';
import { Class } from '../../models';

export class ClassRepository {
  async getByCampus(campusId: number): Promise<Class[]> {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('campusId', sql.Int, campusId)
      .query('SELECT * FROM Classes WHERE CampusId = @campusId');
    return result.recordset.map(r => ({
      id: r.ClassId,
      campusId: r.CampusId,
      name: r.ClassName
    }));
  }

  async create(item: Partial<Class>): Promise<Class> {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('campusId', sql.Int, item.campusId)
      .input('name', sql.NVarChar, item.name)
      .query('INSERT INTO Classes (CampusId, ClassName) OUTPUT INSERTED.* VALUES (@campusId, @name)');
    const r = result.recordset[0];
    return {
      id: r.ClassId,
      campusId: r.CampusId,
      name: r.ClassName
    };
  }
}
