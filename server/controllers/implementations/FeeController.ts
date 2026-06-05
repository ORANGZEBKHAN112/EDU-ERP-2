import { Response, NextFunction } from 'express';
import { IFeeService } from '../../interfaces/services/IFeeService';
import { generateVouchersSchema, createFeeStructureSchema } from '../../utils/validation';
import { RequestContext, CreateFeeStructureDto } from '../../dtos/fee.dto';

export class FeeController {
  constructor(private feeService: IFeeService) {}

  createFeeStructure = async (req: any, res: Response, next: NextFunction) => {
    try {
      const validated = createFeeStructureSchema.parse(req.body);
      const ctx: RequestContext = {
        schoolId: req.user.schoolId,
        campusIds: req.user.campusIds,
        userId: req.user.id
      };
      
      const structure = await this.feeService.createFeeStructure(ctx, validated);
      res.status(201).json({ message: 'Fee structure created successfully', structure });
    } catch (err: any) {
      next(err);
    }
  };

  generateVouchers = async (req: any, res: Response, next: NextFunction) => {
    try {
      const validated = generateVouchersSchema.parse(req.body);
      const ctx: RequestContext = {
        schoolId: req.user.schoolId,
        campusIds: req.user.campusIds,
        userId: req.user.id
      };
      
      const vouchers = await this.feeService.generateVouchers(ctx, validated);
      res.json({ success: true, message: `Generated ${vouchers.length} vouchers`, data: vouchers });
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

  getConfigurations = async (req: any, res: Response, next: NextFunction) => {
    try {
      const campusId = Number(req.query.campusId || req.user.campusIds?.[0]);
      const ctx: RequestContext = {
        schoolId: req.user.schoolId,
        campusIds: req.user.campusIds,
        userId: req.user.id
      };
      const configs = await this.feeService.getFeeConfigurations(ctx, campusId);
      res.json({ success: true, data: configs });
    } catch (err) {
      next(err);
    }
  };

  getVouchers = async (req: any, res: Response, next: NextFunction) => {
    try {
      const campusId = Number(req.query.campusId || req.user.campusIds?.[0]);
      const month = req.query.month ? String(req.query.month) : undefined;
      const ctx: RequestContext = {
        schoolId: req.user.schoolId,
        campusIds: req.user.campusIds,
        userId: req.user.id
      };
      const vouchers = await this.feeService.getVouchers(ctx, campusId, month);
      res.json({ success: true, data: vouchers });
    } catch (err) {
      next(err);
    }
  };
}
