export interface School {
  id: number;
  name: string;
  country: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Campus {
  id: number;
  schoolId: number;
  name: string;
  state: string;
  city: string;
  address: string;
  financeAdminUserId: number;
  isActive: boolean;
}

export interface User {
  id: number;
  fullName: string;
  email: string;
  passwordHash: string;
  phone: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Role {
  id: number;
  name: 'SuperAdmin' | 'FinanceAdmin' | 'CampusAdmin' | 'Student' | 'Parent';
}

export interface UserRole {
  id: number;
  userId: number;
  roleId: number;
}

export interface UserCampus {
  id: number;
  userId: number;
  campusId: number;
}

export interface Class {
  id: number;
  campusId: number;
  name: string;
}

export interface Student {
  id: number;
  campusId: number;
  classId: number;
  admissionNo: string;
  fullName: string;
  fatherName: string;
  phone: string;
  isActive: boolean;
}

export interface FeeStructure {
  id: number;
  campusId: number;
  classId: number;
  monthlyFee: number;
  transportFee: number;
  examFee: number;
  effectiveFromMonth: string;
}

export interface StudentFeeLedger {
  id: number;
  studentId: number;
  campusId: number;
  month: string;
  openingBalance: number;
  monthlyFee: number;
  fine: number;
  discount: number;
  paidAmount: number;
  closingBalance: number;
  status: 'Paid' | 'Partial' | 'Unpaid';
}

export interface FeeVoucher {
  id: number;
  studentId: number;
  campusId: number;
  month: string;
  totalAmount: number;
  dueDate: Date;
  status: 'Paid' | 'Unpaid';
  generatedAt: Date;
}

export interface Payment {
  id: number;
  voucherId: number;
  studentId: number;
  amountPaid: number;
  paymentMethod: string;
  transactionRef: string;
  paymentStatus: string;
  paidAt: Date;
}

export interface FeeAdjustment {
  id: number;
  studentId: number;
  campusId: number;
  month: string;
  type: 'Fine' | 'Discount' | 'Manual';
  amount: number;
  reason: string;
  createdBy: number;
}
