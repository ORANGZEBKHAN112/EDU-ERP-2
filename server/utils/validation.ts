import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const createStudentSchema = z.object({
  campusId: z.number(),
  classId: z.number(),
  admissionNo: z.string().min(1),
  fullName: z.string().min(2),
  fatherName: z.string().min(2),
  phone: z.string().optional(),
});

export const updateStudentSchema = z.object({
  campusId: z.number().optional(),
  classId: z.number().optional(),
  fullName: z.string().min(2).optional(),
  fatherName: z.string().min(2).optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const generateVouchersSchema = z
  .object({
    campusId: z.number().optional(),
    studentIds: z.array(z.number()).optional(),
    month: z.string().regex(/^\d{4}-\d{2}$/, "Format must be YYYY-MM"),
  })
  .refine((val) => !!val.campusId || (Array.isArray(val.studentIds) && val.studentIds.length > 0), {
    message: 'Either campusId or studentIds (non-empty) must be provided',
    path: ['campusId', 'studentIds'],
  });

export const createFeeStructureSchema = z.object({
  campusId: z.number(),
  classId: z.number(),
  monthlyFee: z.number().min(0),
  transportFee: z.number().min(0),
  examFee: z.number().min(0),
  effectiveFromMonth: z.string().regex(/^\d{4}-\d{2}$/, "Format must be YYYY-MM"),
});

export const initiatePaymentSchema = z.object({
  voucherId: z.number(),
  amountPaid: z.number().positive(),
  paymentMethod: z.string(),
  transactionRef: z.string().optional(),
});
