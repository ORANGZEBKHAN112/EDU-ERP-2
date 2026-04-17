import { FeeVoucher, FeeAdjustment, FeeStructure, Payment } from '../../models';
import * as sql from 'mssql';

export interface IFeeRepository {
  getStructure(campusId: number, classId: number): Promise<FeeStructure | undefined>;
  createStructure(structure: Omit<FeeStructure, 'id'>, transaction?: sql.Transaction): Promise<FeeStructure>;
  getVoucher(studentId: number, month: string, campusIds?: number[]): Promise<FeeVoucher | undefined>;
  getVoucherById(id: number, campusIds?: number[]): Promise<FeeVoucher | undefined>;
  createVoucher(voucher: any, transaction?: sql.Transaction): Promise<FeeVoucher>;
  updateVoucherStatus(voucherId: number, status: string, transaction?: sql.Transaction): Promise<void>;
  updateVoucherAmount(studentId: number, month: string, amount: number, transaction?: sql.Transaction): Promise<void>;
  getAdjustments(studentId: number, month: string): Promise<FeeAdjustment[]>;
  createPayment(payment: any, transaction?: sql.Transaction): Promise<Payment>;
  createAdjustment(adj: any, transaction?: sql.Transaction): Promise<any>;
  getPaymentByRef(ref: string): Promise<Payment | undefined>;
  getAllPayments(campusIds?: number[]): Promise<Payment[]>;
  createVouchersBulk(vouchers: any[], transaction?: sql.Transaction): Promise<FeeVoucher[]>;
  getVouchersBulk(studentIds: number[], month: string): Promise<FeeVoucher[]>;
  getStructuresBulk(classIds: number[], campusId: number): Promise<FeeStructure[]>;
  getAdjustmentsBulk(studentIds: number[], month: string): Promise<FeeAdjustment[]>;
}
