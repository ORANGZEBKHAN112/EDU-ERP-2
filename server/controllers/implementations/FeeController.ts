import { Response, NextFunction } from 'express';
import { IFeeService } from '../../interfaces/services/IFeeService';
import { generateVouchersSchema } from '../../utils/validation';
import { RequestContext } from '../../dtos/fee.dto';

export class FeeController {
  constructor(private feeService: IFeeService) {}

  generateVouchers = async (req: any, res: Response, next: NextFunction) => {
    try {
      const validated = generateVouchersSchema.parse(req.body);
      const ctx: RequestContext = {
        schoolId: req.user.schoolId,
        campusIds: req.user.campusIds,
        userId: req.user.id
      };
      
      const vouchers = await this.feeService.generateVouchers(ctx, validated);
      res.json({ message: `Generated ${vouchers.length} vouchers`, vouchers });
    } catch (err: any) {
      next(err);
    }
  };

  getLedger = async (req: any, res: Response, next: NextFunction) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const ctx: RequestContext = {
        schoolId: req.user.schoolId,
        campusIds: req.user.campusIds,
        userId: req.user.id
      };
      const ledger = await this.feeService.getStudentLedger(ctx, studentId);
      res.json(ledger);
    } catch (err) {
      next(err);
    }
  };
}
