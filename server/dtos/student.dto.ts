export interface CreateStudentDto {
  schoolId: number;
  campusId: number;
  classId: number;
  admissionNo: string;
  fullName: string;
  fatherName: string;
  phone?: string;
}

export interface UpdateStudentDto {
  campusId?: number;
  classId?: number;
  fullName?: string;
  fatherName?: string;
  phone?: string;
  isActive?: boolean;
}

export interface StudentResponseDto {
  id: number;
  schoolId: number;
  campusId: number;
  campusName?: string;
  classId: number;
  className?: string;
  admissionNo: string;
  fullName: string;
  fatherName: string;
  phone: string;
  isActive: boolean;
}
