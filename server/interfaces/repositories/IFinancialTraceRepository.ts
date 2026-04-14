export interface IFinancialTraceRepository {
  create(trace: any): Promise<void>;
  getByCorrelationId(correlationId: string): Promise<any>;
}
