import { Response, NextFunction } from 'express';
import { IFeeService } from '../../interfaces/services/IFeeService';
import { initiatePaymentSchema } from '../../utils/validation';
import { RequestContext, RecordPaymentDto } from '../../dtos/fee.dto';

export class PaymentController {
  constructor(private feeService: IFeeService) {}

  initiate = async (req: any, res: Response, next: NextFunction) => {
    try {
      const validated = initiatePaymentSchema.parse(req.body);
      const ctx: RequestContext = {
        schoolId: req.user.schoolId,
        campusIds: req.user.campusIds,
        userId: req.user.id
      };

      const dto: RecordPaymentDto = {
        voucherId: validated.voucherId,
        amountPaid: validated.amountPaid,
        paymentMethod: validated.paymentMethod,
        transactionRef: validated.transactionRef || `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      };

      const payment = await this.feeService.initiatePayment(ctx, dto);
      res.json(payment);
    } catch (err: any) {
      next(err);
    }
  };
}
