import { RequestContext } from '../../dtos/fee.dto';

export interface IReconciliationService {
  runDailyReconciliation(ctx: RequestContext): Promise<void>;
  getReports(ctx: RequestContext): Promise<any[]>;
}
