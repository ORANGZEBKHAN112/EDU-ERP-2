import { IFinancialTraceService } from '../../interfaces/services/IFinancialTraceService';
import { IFinancialTraceRepository } from '../../interfaces/repositories/IFinancialTraceRepository';
import { RequestContext } from '../../dtos/fee.dto';

export class FinancialTraceService implements IFinancialTraceService {
  constructor(private traceRepo: IFinancialTraceRepository) {}

  async trace(
    actionType: 'PAYMENT' | 'VOUCHER' | 'FINE',
    studentId: number,
    amount: number,
    correlationId: string,
    context: RequestContext
  ): Promise<void> {
    try {
      // Non-blocking: we don't strictly need to await this if we want it to be truly non-blocking,
      // but usually in Node.js, we await it to ensure it's sent to the DB, 
      // but we wrap it in try-catch so it doesn't affect the caller.
      await this.traceRepo.create({
        actionType,
        studentId,
        amount,
        correlationId,
        requestContext: context
      });
    } catch (error) {
      // Log error but don't throw, as per "non-blocking" requirement
      console.error(`[FinancialTraceService] Failed to create trace for ${actionType}:`, error);
    }
  }
}
