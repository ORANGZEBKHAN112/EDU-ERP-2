import { Payment, FeeStructure } from '../../models';
import { RequestContext, GenerateVouchersDto, RecordPaymentDto, CreateFeeStructureDto } from '../../dtos/fee.dto';

export interface IFeeService {
  generateVouchers(ctx: RequestContext, dto: GenerateVouchersDto): Promise<any>;
  initiatePayment(ctx: RequestContext, dto: RecordPaymentDto): Promise<Payment>;
  getStudentLedger(ctx: RequestContext, studentId: number): Promise<any[]>;
  getStudentBalance(ctx: RequestContext, studentId: number): Promise<number>;
  createFeeStructure(ctx: RequestContext, dto: CreateFeeStructureDto): Promise<FeeStructure>;
}
