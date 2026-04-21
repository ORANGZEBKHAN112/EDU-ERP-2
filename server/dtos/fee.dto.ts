export interface RequestContext {
  schoolId: number;
  campusIds: number[];
  userId: number;
}

export interface GenerateVouchersDto {
  campusId: number;
  month: string;
}

export interface RecordPaymentDto {
  voucherId: number;
  amountPaid: number;
  paymentMethod: string;
  transactionRef: string;
}

export interface CreateFeeStructureDto {
  campusId: number;
  classId: number;
  monthlyFee: number;
  transportFee: number;
  examFee: number;
  effectiveFromMonth: string;
}
