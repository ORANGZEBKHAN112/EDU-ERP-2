import { poolPromise, sql } from '../../config/db';
import { Section } from '../../models';
import { ISectionRepository } from '../../interfaces/repositories/ISectionRepository';

export class SectionRepository implements ISectionRepository {
  private mapRowToSection(r: any): Section {
    return {
      id: r.SectionId,
      classId: r.ClassId,
      campusId: r.CampusId,
      schoolId: r.SchoolId,
      name: r.SectionName,
      isActive: r.IsActive,
      createdAt: r.CreatedAt,
      updatedAt: r.UpdatedAt
    };
  }

  /**
   * Get all sections (SuperAdmin only - no filtering)
   */
  async getAll(): Promise<Section[]> {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT * FROM Sections');
    return result.recordset.map(r => this.mapRowToSection(r));
  }

  /**
   * Get all sections for a school
   */
  async getBySchool(schoolId: number): Promise<Section[]> {
    if (!schoolId) {
      throw new Error('schoolId is required');
    }
    const pool = await poolPromise;
    const result = await pool.request()
      .input('schoolId', sql.Int, schoolId)
      .query('SELECT * FROM Sections WHERE SchoolId = @schoolId');
    return result.recordset.map(r => this.mapRowToSection(r));
  }

  /**
   * Get all sections for a class (any school)
   */
  async getByClass(classId: number): Promise<Section[]> {
    if (!classId) {
      throw new Error('classId is required');
    }
    const pool = await poolPromise;
    const result = await pool.request()
      .input('classId', sql.Int, classId)
      .query('SELECT * FROM Sections WHERE ClassId = @classId');
    return result.recordset.map(r => this.mapRowToSection(r));
  }

  /**
   * Get sections for a class with strict school validation
   * Prevents cross-school access
   */
  async getByClassStrict(classId: number, schoolId: number): Promise<Section[]> {
    if (!classId) {
      throw new Error('classId is required');
    }
    if (!schoolId) {
      throw new Error('schoolId is required');
    }
    const pool = await poolPromise;
    const result = await pool.request()
      .input('classId', sql.Int, classId)
      .input('schoolId', sql.Int, schoolId)
      .query(`SELECT * FROM Sections 
              WHERE ClassId = @classId AND SchoolId = @schoolId`);
    return result.recordset.map(r => this.mapRowToSection(r));
  }

  /**
   * Get a single section by ID
   */
  async getById(id: number): Promise<Section | undefined> {
    if (!id) {
      throw new Error('id is required');
    }
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Sections WHERE SectionId = @id');
    const r = result.recordset[0];
    if (!r) return undefined;
    return this.mapRowToSection(r);
  }

  /**
   * Create a new section with strict multi-tenant validation
   * Requires: classId, campusId, schoolId, name
   * Validates classId belongs to the same school and campus
   */
  async create(item: Partial<Section>): Promise<Section> {
    if (!item.classId) {
      throw new Error('classId is required');
    }
    if (!item.campusId) {
      throw new Error('campusId is required');
    }
    if (!item.schoolId) {
      throw new Error('schoolId is required');
    }
    if (!item.name) {
      throw new Error('name is required');
    }

    const pool = await poolPromise;

    // Verify classId belongs to the same school and campus
    // Allow SchoolId to be present either on the Classes row or on the Campuses row
    const verifyResult = await pool.request()
      .input('classId', sql.Int, item.classId)
      .input('campusId', sql.Int, item.campusId)
      .input('schoolId', sql.Int, item.schoolId)
      .query(`SELECT c.ClassId FROM Classes c
              LEFT JOIN Campuses cp ON c.CampusId = cp.CampusId
              WHERE c.ClassId = @classId
                AND c.CampusId = @campusId
                AND (cp.SchoolId = @schoolId OR c.SchoolId = @schoolId)`);
    if (verifyResult.recordset.length === 0) {
      throw new Error('Class not found or does not belong to the specified school/campus');
    }

    const result = await pool.request()
      .input('classId', sql.Int, item.classId)
      .input('campusId', sql.Int, item.campusId)
      .input('schoolId', sql.Int, item.schoolId)
      .input('name', sql.NVarChar, item.name)
      .query(`INSERT INTO Sections (ClassId, CampusId, SchoolId, SectionName) 
              OUTPUT INSERTED.*
              VALUES (@classId, @campusId, @schoolId, @name)`);
    
    const r = result.recordset[0];
    if (!r) {
      throw new Error('Failed to create section');
    }
    return this.mapRowToSection(r);
  }

  /**
   * Update a section
   * Validates school ownership before updating
   */
  async update(id: number, item: Partial<Section>): Promise<Section> {
    if (!id) {
      throw new Error('id is required');
    }
    if (!item.schoolId) {
      throw new Error('schoolId is required for validation');
    }

    const pool = await poolPromise;

    // Verify section belongs to the specified school
    const verifyResult = await pool.request()
      .input('id', sql.Int, id)
      .input('schoolId', sql.Int, item.schoolId)
      .query(`SELECT SectionId FROM Sections 
              WHERE SectionId = @id AND SchoolId = @schoolId`);
    
    if (verifyResult.recordset.length === 0) {
      throw new Error('Section not found or does not belong to the specified school');
    }

    const updateResult = await pool.request()
      .input('id', sql.Int, id)
      .input('name', sql.NVarChar, item.name)
      .input('isActive', sql.Bit, item.isActive)
      .query(`UPDATE Sections 
              SET SectionName = COALESCE(@name, SectionName),
                  IsActive = COALESCE(@isActive, IsActive),
                  UpdatedAt = GETDATE()
              OUTPUT INSERTED.*
              WHERE SectionId = @id`);
    
    const r = updateResult.recordset[0];
    if (!r) {
      throw new Error('Failed to update section');
    }
    return this.mapRowToSection(r);
  }

  /**
   * Delete a section
   * Optional schoolId verification for extra safety
   */
  async delete(id: number, schoolId?: number): Promise<boolean> {
    if (!id) {
      throw new Error('id is required');
    }

    const pool = await poolPromise;
    let query = 'DELETE FROM Sections WHERE SectionId = @id';
    const request = pool.request().input('id', sql.Int, id);

    // If schoolId is provided, verify section belongs to it before deletion
    if (schoolId) {
      query = 'DELETE FROM Sections WHERE SectionId = @id AND SchoolId = @schoolId';
      request.input('schoolId', sql.Int, schoolId);
    }

    const result = await request.query(query);
    return result.rowsAffected[0] > 0;
  }
}
