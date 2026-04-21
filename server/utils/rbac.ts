import { poolPromise, sql } from '../config/db';

export async function hasPermission(
  userId: number,
  permission: string,
  scope: {
    schoolId?: number;
    campusId?: number;
    classId?: number;
    sectionId?: number;
  } = {}
): Promise<boolean> {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('UserID', sql.Int, userId)
      .input('PermissionName', sql.NVarChar, permission)
      .input('SchoolID', sql.Int, scope.schoolId || null)
      .input('CampusID', sql.Int, scope.campusId || null)
      .input('ClassID', sql.Int, scope.classId || null)
      .input('SectionID', sql.Int, scope.sectionId || null)
      .execute('CheckPermission');

    return result.recordset[0]?.HasPermission === 1;
  } catch (error) {
    console.error(`[RBAC] Permission check failed for User:${userId}, Permission:${permission}`, error);
    return false;
  }
}
