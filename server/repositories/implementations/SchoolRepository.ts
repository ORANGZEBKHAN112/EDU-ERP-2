import { poolPromise, sql } from '../../config/db';
import { School } from '../../models';
import { ISchoolRepository } from '../../interfaces/repositories/ISchoolRepository';

export class SchoolRepository implements ISchoolRepository {
  async getAll(): Promise<School[]> {
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

  async getById(id: number): Promise<School | undefined> {
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

  async create(item: Partial<School>): Promise<School> {
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
