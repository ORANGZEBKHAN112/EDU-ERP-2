import { Response, NextFunction } from 'express';
import { IFeeService } from '../../interfaces/services/IFeeService';
import { generateVouchersSchema, configureFeeSchema } from '../../utils/validation';
import { RequestContext } from '../../dtos/fee.dto';

export class FeeController {
  constructor(private feeService: IFeeService) {}

  generateVouchers = async (req: any, res: Response, next: NextFunction) => {
    try {
      const validated = generateVouchersSchema.parse(req.body);
      
      let monthStr: string;
      if (typeof validated.month === 'number' && validated.year) {
        monthStr = `${validated.year}-${validated.month.toString().padStart(2, '0')}`;
      } else if (typeof validated.month === 'string') {
        monthStr = validated.month;
      } else {
        monthStr = new Date().toISOString().slice(0, 7);
      }

      const ctx: RequestContext = {
        schoolId: req.user.schoolId,
        campusIds: req.user.campusIds || [],
        userId: req.user.id
      };

      // If campusId was sent, use it. Otherwise, if it's a CampusAdmin, use their campus.
      // If it's a SuperAdmin and no campusId, we might need a different logic, but let's assume one campus for now or fetch all.
      const targetCampusId = validated.campusId || ctx.campusIds[0];
      
      if (!targetCampusId && !req.user.roles.includes('SuperAdmin')) {
        return res.status(400).json({ message: 'No campus access' });
      }

      const vouchers = await this.feeService.generateVouchers(ctx, {
        campusId: targetCampusId,
        month: monthStr
      });
      res.json({ message: `Generated ${vouchers.length} vouchers`, vouchers });
    } catch (err: any) {
      next(err);
    }
  };

  getConfigurations = async (req: any, res: Response, next: NextFunction) => {
    try {
      const ctx: RequestContext = {
        schoolId: req.user.schoolId,
        campusIds: req.user.campusIds || [],
        userId: req.user.id
      };
      const configs = await this.feeService.getConfigurations(ctx);
      res.json(configs);
    } catch (err) {
      next(err);
    }
  };

  configure = async (req: any, res: Response, next: NextFunction) => {
    try {
      const validated = configureFeeSchema.parse(req.body);
      const ctx: RequestContext = {
        schoolId: req.user.schoolId,
        campusIds: req.user.campusIds || [],
        userId: req.user.id
      };
      
      // Default campusId if not provided
      const campusId = validated.campusId || ctx.campusIds[0];
      
      await this.feeService.configure(ctx, {
        ...validated,
        campusId
      });
      res.json({ message: 'Fee structure configured successfully' });
    } catch (err) {
      next(err);
    }
  };

  getVouchers = async (req: any, res: Response, next: NextFunction) => {
    try {
      const ctx: RequestContext = {
        schoolId: req.user.schoolId,
        campusIds: req.user.campusIds || [],
        userId: req.user.id
      };
      const month = req.query.month as string;
      const vouchers = await this.feeService.getVouchers(ctx, month);
      res.json(vouchers);
    } catch (err) {
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
