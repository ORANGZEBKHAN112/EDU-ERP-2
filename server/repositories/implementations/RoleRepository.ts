import { poolPromise, sql } from '../../config/db';
import { IRoleRepository } from '../../interfaces/repositories/IRoleRepository';

export class RoleRepository implements IRoleRepository {
  async getByName(name: string) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .query('SELECT * FROM Roles WHERE RoleName = @name');
    return result.recordset[0];
  }
}
