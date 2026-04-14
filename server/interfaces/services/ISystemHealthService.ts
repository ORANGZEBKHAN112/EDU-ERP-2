export interface SystemHealthMetrics {
  totalStudents: number;
  activeTenants: number;
  totalTransactionsToday: number;
  failedTransactions: number;
  reconciliationStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  backgroundJobs: {
    name: string;
    status: string;
    lastRun: Date | null;
  }[];
  ledgerConsistency: 'CONSISTENT' | 'INCONSISTENT';
}

export interface ISystemHealthService {
  getHealth(): Promise<SystemHealthMetrics>;
}
