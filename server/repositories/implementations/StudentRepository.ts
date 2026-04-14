import { poolPromise, sql } from '../../config/db';
import { Student } from '../../models';
import { IStudentRepository } from '../../interfaces/repositories/IStudentRepository';

export class StudentRepository implements IStudentRepository {
  async getAll(campusIds?: number[], schoolId?: number, filterCampusId?: number, search?: string): Promise<Student[]> {
    const pool = await poolPromise;
    let query = 'SELECT * FROM Students WHERE 1=1';
    const request = pool.request();
    
    if (schoolId) {
      query += ' AND SchoolId = @schoolId';
      request.input('schoolId', sql.Int, schoolId);
    }

    if (campusIds && campusIds.length > 0) {
      query += ' AND CampusId IN (' + campusIds.join(',') + ')';
    }

    if (filterCampusId) {
      query += ' AND CampusId = @filterCampusId';
      request.input('filterCampusId', sql.Int, filterCampusId);
    }

    if (search) {
      query += ' AND (FullName LIKE @search OR AdmissionNo LIKE @search)';
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
    let query = 'SELECT * FROM Students WHERE StudentId = @id';
    const request = pool.request().input('id', sql.Int, id);
    
    if (schoolId) {
      query += ' AND SchoolId = @schoolId';
      request.input('schoolId', sql.Int, schoolId);
    }

    if (campusIds && campusIds.length > 0) {
      query += ' AND CampusId IN (' + campusIds.join(',') + ')';
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
