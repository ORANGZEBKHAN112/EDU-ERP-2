import { ISystemHealthService, SystemHealthMetrics } from '../../interfaces/services/ISystemHealthService';
import { SystemRepository } from '../../repositories/implementations/SystemRepository';

export class SystemHealthService implements ISystemHealthService {
  constructor(private systemRepo: SystemRepository) {}

  async getHealth(): Promise<SystemHealthMetrics> {
    const data = await this.systemRepo.getHealthData();

    let reconciliationStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' = 'HEALTHY';
    let ledgerConsistency: 'CONSISTENT' | 'INCONSISTENT' = 'CONSISTENT';

    if (data.latestReconciliation) {
      if (data.latestReconciliation.status === 'CRITICAL') {
        reconciliationStatus = 'CRITICAL';
        ledgerConsistency = 'INCONSISTENT';
      } else if (data.latestReconciliation.status === 'MISMATCH') {
        reconciliationStatus = 'DEGRADED';
        ledgerConsistency = 'INCONSISTENT';
      }
    }

    // If there are many failed transactions, we might be degraded
    if (data.failedTransactions > 10 && reconciliationStatus === 'HEALTHY') {
      reconciliationStatus = 'DEGRADED';
    }

    return {
      totalStudents: data.totalStudents,
      activeTenants: data.activeTenants,
      totalTransactionsToday: data.totalTransactionsToday,
      failedTransactions: data.failedTransactions,
      reconciliationStatus,
      ledgerConsistency,
      backgroundJobs: data.jobStatuses.map(j => ({
        name: j.name,
        status: j.status,
        lastRun: j.endTime
      }))
    };
  }
}
