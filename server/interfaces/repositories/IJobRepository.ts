export interface IJobRepository {
  isAlreadyExecuted(jobName: string, executionDate: string, campusId?: number): Promise<boolean>;
  acquireLock(jobName: string, instanceId: string, durationSeconds: number): Promise<boolean>;
  releaseLock(jobName: string, instanceId: string): Promise<void>;
  startExecution(jobName: string, instanceId: string, executionDate: string, campusId?: number): Promise<number>;
  endExecution(executionId: number, status: string, errorMessage?: string): Promise<void>;
}
