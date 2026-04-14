import { RequestContext } from '../../dtos/fee.dto';

export interface IFinancialTraceService {
  trace(
    actionType: 'PAYMENT' | 'VOUCHER' | 'FINE',
    studentId: number,
    amount: number,
    correlationId: string,
    context: RequestContext
  ): Promise<void>;
}
