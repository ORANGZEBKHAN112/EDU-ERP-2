import { poolPromise, sql } from '../../config/db';
import { IJobRepository } from '../../interfaces/repositories/IJobRepository';

export class JobRepository implements IJobRepository {
  async isAlreadyExecuted(jobName: string, executionDate: string, campusId?: number): Promise<boolean> {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('jobName', sql.NVarChar, jobName)
      .input('executionDate', sql.NVarChar, executionDate)
      .input('campusId', sql.Int, campusId)
      .query(`
        SELECT 1 as Executed FROM JobExecutions 
        WHERE JobName = @jobName AND ExecutionDate = @executionDate AND Status = 'Success'
        ${campusId ? 'AND CampusId = @campusId' : ''}
      `);
    return result.recordset.length > 0;
  }

  async acquireLock(jobName: string, instanceId: string, durationSeconds: number): Promise<boolean> {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('jobName', sql.NVarChar, jobName)
      .input('instanceId', sql.NVarChar, instanceId)
      .input('duration', sql.Int, durationSeconds)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM JobLocks WHERE JobName = @jobName)
        BEGIN
          INSERT INTO JobLocks (JobName, LockedBy, LockedUntil)
          VALUES (@jobName, @instanceId, DATEADD(second, @duration, GETDATE()))
          SELECT 1 as Success
        END
        ELSE
        BEGIN
          UPDATE JobLocks
          SET LockedBy = @instanceId,
              LockedUntil = DATEADD(second, @duration, GETDATE())
          WHERE JobName = @jobName AND (LockedUntil < GETDATE() OR LockedBy = @instanceId)
          SELECT @@ROWCOUNT as Success
        END
      `);
    return result.recordset[0].Success > 0;
  }

  async releaseLock(jobName: string, instanceId: string): Promise<void> {
    const pool = await poolPromise;
    await pool.request()
      .input('jobName', sql.NVarChar, jobName)
      .input('instanceId', sql.NVarChar, instanceId)
      .query('DELETE FROM JobLocks WHERE JobName = @jobName AND LockedBy = @instanceId');
  }

  async startExecution(jobName: string, instanceId: string, executionDate: string, campusId?: number): Promise<number> {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('jobName', sql.NVarChar, jobName)
      .input('instanceId', sql.NVarChar, instanceId)
      .input('executionDate', sql.NVarChar, executionDate)
      .input('campusId', sql.Int, campusId)
      .query(`
        INSERT INTO JobExecutions (JobName, InstanceId, ExecutionDate, CampusId, Status, StartTime)
        OUTPUT INSERTED.ExecutionId
        VALUES (@jobName, @instanceId, @executionDate, @campusId, 'Running', GETDATE())
      `);
    return result.recordset[0].ExecutionId;
  }

  async endExecution(executionId: number, status: string, errorMessage?: string): Promise<void> {
    const pool = await poolPromise;
    await pool.request()
      .input('id', sql.Int, executionId)
      .input('status', sql.NVarChar, status)
      .input('error', sql.NVarChar, errorMessage || null)
      .query(`
        UPDATE JobExecutions
        SET Status = @status,
            EndTime = GETDATE(),
            ErrorMessage = @error
        WHERE ExecutionId = @id
      `);
  }
}
