export interface IFailedTransactionRepository {
  addToQueue(item: any): Promise<void>;
  getPending(limit: number): Promise<any[]>;
  updateStatus(queueId: number, status: string, error?: string): Promise<void>;
  incrementRetry(queueId: number): Promise<void>;
  getByCorrelationId(correlationId: string): Promise<any>;
}
