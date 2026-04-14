import { poolPromise, sql } from '../../config/db';
import { User, Role, Campus } from '../../models';
import { IUserRepository } from '../../interfaces/repositories/IUserRepository';

export class UserRepository implements IUserRepository {
  async getByEmail(email: string): Promise<User | undefined> {
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

  async getById(id: number): Promise<User | undefined> {
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

  async create(item: any, transaction?: sql.Transaction): Promise<User> {
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

  async addUserRole(userId: number, roleId: number, transaction?: sql.Transaction): Promise<void> {
    const request = transaction ? new sql.Request(transaction) : (await poolPromise).request();
    await request
      .input('userId', sql.Int, userId)
      .input('roleId', sql.Int, roleId)
      .query('INSERT INTO UserRoles (UserId, RoleId) VALUES (@userId, @roleId)');
  }

  async addUserCampus(userId: number, campusId: number, transaction?: sql.Transaction): Promise<void> {
    const request = transaction ? new sql.Request(transaction) : (await poolPromise).request();
    await request
      .input('userId', sql.Int, userId)
      .input('campusId', sql.Int, campusId)
      .query('INSERT INTO UserCampuses (UserId, CampusId) VALUES (@userId, @campusId)');
  }

  async getUserRoles(userId: number): Promise<Role[]> {
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

  async getUserCampuses(userId: number): Promise<Campus[]> {
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
