import { poolPromise, sql } from '../../config/db';
import { Student } from '../../models';
import { IStudentRepository } from '../../interfaces/repositories/IStudentRepository';

export class StudentRepository implements IStudentRepository {
  private buildIntInClause(values: number[], prefix: string, request: sql.Request): string {
    const sanitized = values
      .map(v => Number(v))
      .filter(v => Number.isInteger(v));

    if (sanitized.length === 0) {
      return 'NULL';
    }

    return sanitized
      .map((value, index) => {
        const name = `${prefix}${index}`;
        request.input(name, sql.Int, value);
        return `@${name}`;
      })
      .join(',');
  }

  async getAll(campusIds?: number[], schoolId?: number, filterCampusId?: number, search?: string): Promise<Student[]> {
    const pool = await poolPromise;
    
    // Allow SuperAdmin to see all students (no filtering), others must have campusIds or schoolId
    const isSuperAdminAccess = (!campusIds || campusIds.length === 0) && !schoolId;

    let query = 'SELECT s.*, c.SchoolId FROM Students s INNER JOIN Campuses c ON s.CampusId = c.CampusId WHERE 1=1';
    const request = pool.request();
    
    if (schoolId && !isSuperAdminAccess) {
      query += ' AND c.SchoolId = @schoolId';
      request.input('schoolId', sql.Int, schoolId);
    }

    if (campusIds && campusIds.length > 0 && !isSuperAdminAccess) {
      const campusClause = this.buildIntInClause(campusIds, 'campusId', request);
      query += ` AND s.CampusId IN (${campusClause})`;
    }

    if (filterCampusId) {
      query += ' AND s.CampusId = @filterCampusId';
      request.input('filterCampusId', sql.Int, filterCampusId);
    }

    if (search) {
      query += ' AND (s.FullName LIKE @search OR s.AdmissionNo LIKE @search)';
      request.input('search', sql.NVarChar, `%${search}%`);
    }
    
    const result = await request.query(query);
    return result.recordset.map(r => ({
      id: r.StudentId,
      schoolId: r.SchoolId,
      campusId: r.CampusId,
      classId: r.ClassId,
      admissionNo: r.AdmissionNo,
      fullName: r.FullName,
      fatherName: r.FatherName,
      phone: r.Phone,
      isActive: r.IsActive
    }));
  }

  async getById(id: number, campusIds?: number[], schoolId?: number): Promise<Student | undefined> {
    const pool = await poolPromise;

    // Allow SuperAdmin to see all students, others must have campusIds or schoolId
    const isSuperAdminAccess = (!campusIds || campusIds.length === 0) && !schoolId;
    if (isSuperAdminAccess) {
      // For SuperAdmin, just check if student exists
    }

    let query = 'SELECT s.*, c.SchoolId FROM Students s INNER JOIN Campuses c ON s.CampusId = c.CampusId WHERE s.StudentId = @id';
    const request = pool.request().input('id', sql.Int, id);
    
    if (schoolId && !isSuperAdminAccess) {
      query += ' AND c.SchoolId = @schoolId';
      request.input('schoolId', sql.Int, schoolId);
    }

    if (campusIds && campusIds.length > 0 && !isSuperAdminAccess) {
      const campusClause = this.buildIntInClause(campusIds, 'campusId', request);
      query += ` AND s.CampusId IN (${campusClause})`;
    }
    
    const result = await request.query(query);
    const r = result.recordset[0];
    if (!r) return undefined;
    return {
      id: r.StudentId,
      schoolId: r.SchoolId,
      campusId: r.CampusId,
      classId: r.ClassId,
      admissionNo: r.AdmissionNo,
      fullName: r.FullName,
      fatherName: r.FatherName,
      phone: r.Phone,
      isActive: r.IsActive
    };
  }

  async create(item: Partial<Student>): Promise<Student> {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('schoolId', sql.Int, item.schoolId)
      .input('campusId', sql.Int, item.campusId)
      .input('classId', sql.Int, item.classId)
      .input('admissionNo', sql.NVarChar, item.admissionNo)
      .input('fullName', sql.NVarChar, item.fullName)
      .input('fatherName', sql.NVarChar, item.fatherName)
      .input('phone', sql.NVarChar, item.phone)
      .query(`INSERT INTO Students (SchoolId, CampusId, ClassId, AdmissionNo, FullName, FatherName, Phone) 
              OUTPUT INSERTED.* 
              VALUES (@schoolId, @campusId, @classId, @admissionNo, @fullName, @fatherName, @phone)`);
    const r = result.recordset[0];
    return {
      id: r.StudentId,
      schoolId: r.SchoolId,
      campusId: r.CampusId,
      classId: r.ClassId,
      admissionNo: r.AdmissionNo,
      fullName: r.FullName,
      fatherName: r.FatherName,
      phone: r.Phone,
      isActive: r.IsActive
    };
  }

  async update(id: number, item: Partial<Student>): Promise<Student | undefined> {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('campusId', sql.Int, item.campusId)
      .input('classId', sql.Int, item.classId)
      .input('fullName', sql.NVarChar, item.fullName)
      .input('fatherName', sql.NVarChar, item.fatherName)
      .input('phone', sql.NVarChar, item.phone)
      .input('isActive', sql.Bit, item.isActive)
      .query(`UPDATE Students 
              SET CampusId = COALESCE(@campusId, CampusId),
                  ClassId = COALESCE(@classId, ClassId),
                  FullName = COALESCE(@fullName, FullName),
                  FatherName = COALESCE(@fatherName, FatherName),
                  Phone = COALESCE(@phone, Phone),
                  IsActive = COALESCE(@isActive, IsActive)
              OUTPUT INSERTED.*
              WHERE StudentId = @id`);
    
    const r = result.recordset[0];
    if (!r) return undefined;
    return {
      id: r.StudentId,
      schoolId: r.SchoolId,
      campusId: r.CampusId,
      classId: r.ClassId,
      admissionNo: r.AdmissionNo,
      fullName: r.FullName,
      fatherName: r.FatherName,
      phone: r.Phone,
      isActive: r.IsActive
    };
  }

  async delete(id: number): Promise<boolean> {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Students WHERE StudentId = @id');
    return (result.rowsAffected[0] || 0) > 0;
  }
}
