import { poolPromise, sql } from '../../config/db';
import { Campus } from '../../models';
import { ICampusRepository } from '../../interfaces/repositories/ICampusRepository';

export class CampusRepository implements ICampusRepository {
  async getAll(): Promise<Campus[]> {
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

  async getById(id: number): Promise<Campus | undefined> {
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

  async getBySchoolId(schoolId: number): Promise<Campus[]> {
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

  async create(item: Partial<Campus>, transaction?: sql.Transaction): Promise<Campus> {
    const request = transaction ? new sql.Request(transaction) : (await poolPromise).request();
    const result = await request
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

  async update(id: number, item: Partial<Campus>): Promise<Campus> {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('name', sql.NVarChar, item.name)
      .input('state', sql.NVarChar, item.state)
      .input('city', sql.NVarChar, item.city)
      .input('address', sql.NVarChar, item.address)
      .input('financeAdminUserId', sql.Int, item.financeAdminUserId)
      .input('isActive', sql.Bit, item.isActive)
      .query(`UPDATE Campuses 
              SET CampusName = COALESCE(@name, CampusName),
                  State = COALESCE(@state, State),
                  City = COALESCE(@city, City),
                  Address = COALESCE(@address, Address),
                  FinanceAdminUserId = COALESCE(@financeAdminUserId, FinanceAdminUserId),
                  IsActive = COALESCE(@isActive, IsActive)
              OUTPUT INSERTED.*
              WHERE CampusId = @id`);
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
