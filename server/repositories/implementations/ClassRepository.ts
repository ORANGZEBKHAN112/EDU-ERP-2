import { poolPromise, sql } from '../../config/db';
import { Class } from '../../models';
import { IClassRepository } from '../../interfaces/repositories/IClassRepository';

export class ClassRepository implements IClassRepository {
  private mapRowToClass(r: any): Class {
    return {
      id: r.ClassId,
      schoolId: r.SchoolId,
      campusId: r.CampusId,
      name: r.ClassName
    };
  }

  /**
   * Get all classes (SuperAdmin only - no tenant filtering)
   */
  async getAll(): Promise<Class[]> {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT c.*, cp.SchoolId FROM Classes c INNER JOIN Campuses cp ON c.CampusId = cp.CampusId');
    return result.recordset.map(r => this.mapRowToClass(r));
  }

  /**
   * Get classes by school with strict filtering
   * Ensures schoolId is always included in query
   */
  async getBySchool(schoolId: number): Promise<Class[]> {
    if (!schoolId) {
      throw new Error('schoolId is required to fetch classes by school');
    }
    const pool = await poolPromise;
    const result = await pool.request()
      .input('schoolId', sql.Int, schoolId)
      .query(`SELECT c.*, cp.SchoolId FROM Classes c 
              INNER JOIN Campuses cp ON c.CampusId = cp.CampusId 
              WHERE cp.SchoolId = @schoolId`);
    return result.recordset.map(r => this.mapRowToClass(r));
  }

  /**
   * Get classes by campus with strict filtering
   * Ensures both schoolId and campusId are included in query
   */
  async getByCampus(campusId: number): Promise<Class[]> {
    if (!campusId) {
      throw new Error('campusId is required to fetch classes');
    }
    const pool = await poolPromise;
    const result = await pool.request()
      .input('campusId', sql.Int, campusId)
      .query(`SELECT c.*, cp.SchoolId FROM Classes c 
              INNER JOIN Campuses cp ON c.CampusId = cp.CampusId 
              WHERE c.CampusId = @campusId`);
    return result.recordset.map(r => this.mapRowToClass(r));
  }

  /**
   * Get a single class by ID with multi-tenant filtering
   */
  async getById(id: number): Promise<Class | undefined> {
    if (!id) {
      throw new Error('id is required to fetch a class');
    }
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`SELECT c.*, cp.SchoolId FROM Classes c 
              INNER JOIN Campuses cp ON c.CampusId = cp.CampusId 
              WHERE c.ClassId = @id`);
    const r = result.recordset[0];
    if (!r) return undefined;
    return this.mapRowToClass(r);
  }

  /**
   * Create a new class with strict multi-tenant validation
   * Requires both schoolId and campusId
   */
  async create(item: Partial<Class>): Promise<Class> {
    if (!item.campusId) {
      throw new Error('campusId is required to create a class');
    }
    if (!item.name) {
      throw new Error('name is required to create a class');
    }

    const pool = await poolPromise;
    const request = pool.request()
      .input('campusId', sql.Int, item.campusId)
      .input('name', sql.NVarChar, item.name)
      .input('schoolId', sql.Int, item.schoolId);

    const result = await request.query(`INSERT INTO Classes (SchoolId, CampusId, ClassName) 
              OUTPUT INSERTED.*
              VALUES (@schoolId, @campusId, @name)`);
    
    const r = result.recordset[0];
    if (!r) {
      throw new Error('Failed to create class');
    }
    return this.mapRowToClass(r);
  }

  /**
   * Update an existing class
   * Validates that the class belongs to the specified school
   */
  async update(id: number, item: Partial<Class>): Promise<Class> {
    if (!id) {
      throw new Error('id is required to update a class');
    }
    if (!item.schoolId) {
      throw new Error('schoolId is required to update a class');
    }

    const pool = await poolPromise;
    
    // Verify the class belongs to the specified school
    const verifyResult = await pool.request()
      .input('id', sql.Int, id)
      .input('schoolId', sql.Int, item.schoolId)
      .query(`SELECT c.ClassId FROM Classes c 
              INNER JOIN Campuses cp ON c.CampusId = cp.CampusId 
              WHERE c.ClassId = @id AND cp.SchoolId = @schoolId`);
    
    if (verifyResult.recordset.length === 0) {
      throw new Error('Class not found or does not belong to the specified school');
    }

    const updateResult = await pool.request()
      .input('id', sql.Int, id)
      .input('name', sql.NVarChar, item.name)
      .query(`UPDATE Classes 
              SET ClassName = COALESCE(@name, ClassName)
              OUTPUT INSERTED.*
              WHERE ClassId = @id`);
    
    const r = updateResult.recordset[0];
    if (!r) {
      throw new Error('Failed to update class');
    }
    return this.mapRowToClass(r);
  }

  /**
   * Delete a class with strict multi-tenant validation
   */
  async delete(id: number, schoolId?: number): Promise<boolean> {
    if (!id) {
      throw new Error('id is required to delete a class');
    }

    const pool = await poolPromise;
    let query = 'DELETE FROM Classes WHERE ClassId = @id';
    const request = pool.request().input('id', sql.Int, id);

    // If schoolId is provided, verify class belongs to it before deletion
    if (schoolId) {
      query = `DELETE FROM Classes WHERE ClassId = @id AND CampusId IN 
               (SELECT CampusId FROM Campuses WHERE SchoolId = @schoolId)`;
      request.input('schoolId', sql.Int, schoolId);
    }

    const result = await request.query(query);
    return result.rowsAffected[0] > 0;
  }
}
