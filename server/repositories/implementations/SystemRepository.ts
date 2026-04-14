import { poolPromise, sql } from '../../config/db';

export interface SystemHealthData {
  totalStudents: number;
  activeTenants: number;
  totalTransactionsToday: number;
  failedTransactions: number;
  latestReconciliation: {
    status: string;
    timestamp: Date;
  } | null;
  jobStatuses: {
    name: string;
    status: string;
    endTime: Date | null;
  }[];
}

export class SystemRepository {
  async getHealthData(): Promise<SystemHealthData> {
    const pool = await poolPromise;
    
    const result = await pool.request().query(`
      -- Total Students
      SELECT COUNT(*) as totalStudents FROM Students WHERE IsActive = 1;
      
      -- Active Tenants (Schools)
      SELECT COUNT(*) as activeTenants FROM Schools WHERE IsActive = 1;
      
      -- Transactions Today (Payments)
      SELECT ISNULL(SUM(AmountPaid), 0) as totalTransactionsToday 
      FROM Payments 
      WHERE CAST(PaidAt AS DATE) = CAST(GETDATE() AS DATE);
      
      -- Failed Transactions (Pending in Queue)
      SELECT COUNT(*) as failedTransactions 
      FROM FailedTransactionQueue 
      WHERE Status != 'RESOLVED';
      
      -- Latest Reconciliation
      SELECT TOP 1 Status, CreatedAt as Timestamp 
      FROM ReconciliationReports 
      ORDER BY CreatedAt DESC;
      
      -- Background Job Statuses
      SELECT JobName, Status, EndTime
      FROM JobExecutions
      WHERE ExecutionId IN (
        SELECT MAX(ExecutionId) FROM JobExecutions GROUP BY JobName
      );
    `);

    return {
      totalStudents: result.recordsets[0][0].totalStudents,
      activeTenants: result.recordsets[1][0].activeTenants,
      totalTransactionsToday: result.recordsets[2][0].totalTransactionsToday,
      failedTransactions: result.recordsets[3][0].failedTransactions,
      latestReconciliation: result.recordsets[4][0] || null,
      jobStatuses: result.recordsets[5].map((r: any) => ({
        name: r.JobName,
        status: r.Status,
        endTime: r.EndTime
      }))
    };
  }
}
