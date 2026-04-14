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

export interface StudentBalanceDto {
  studentId: number;
  fullName: string;
  admissionNo: string;
  currentBalance: number;
  lastPaymentDate?: Date;
  status: 'Paid' | 'Partial' | 'Unpaid';
}
