import { IStudentRepository } from '../../interfaces/repositories/IStudentRepository';
import { IStudentService } from '../../interfaces/services/IStudentService';
import { CreateStudentDto, UpdateStudentDto, StudentResponseDto } from '../../dtos/student.dto';

export class StudentService implements IStudentService {
  constructor(private studentRepo: IStudentRepository) {}

  async getAllStudents(campusIds?: number[], schoolId?: number, filterCampusId?: number, search?: string): Promise<StudentResponseDto[]> {
    const students = await this.studentRepo.getAll(campusIds, schoolId, filterCampusId, search);
    return students.map(s => this.mapToDto(s));
  }

  async getStudentById(id: number, campusIds?: number[], schoolId?: number): Promise<StudentResponseDto | undefined> {
    const student = await this.studentRepo.getById(id, campusIds, schoolId);
    return student ? this.mapToDto(student) : undefined;
  }

  async createStudent(data: CreateStudentDto): Promise<StudentResponseDto> {
    const student = await this.studentRepo.create(data);
    return this.mapToDto(student);
  }

  async updateStudent(id: number, data: UpdateStudentDto, campusIds?: number[], schoolId?: number): Promise<StudentResponseDto | undefined> {
    // Check if student exists and belongs to the campus/school
    const existing = await this.studentRepo.getById(id, campusIds, schoolId);
    if (!existing) return undefined;

    const updated = await this.studentRepo.update(id, data);
    return updated ? this.mapToDto(updated) : undefined;
  }

  async deleteStudent(id: number, campusIds?: number[], schoolId?: number): Promise<boolean> {
    // Check if student exists and belongs to the campus/school
    const existing = await this.studentRepo.getById(id, campusIds, schoolId);
    if (!existing) return false;

    return this.studentRepo.delete(id);
  }

  private mapToDto(student: any): StudentResponseDto {
    return {
      id: student.id,
      schoolId: student.schoolId,
      campusId: student.campusId,
      classId: student.classId,
      admissionNo: student.admissionNo,
      fullName: student.fullName,
      fatherName: student.fatherName,
      phone: student.phone,
      isActive: student.isActive
    };
  }
}
