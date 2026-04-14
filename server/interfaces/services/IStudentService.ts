import { CreateStudentDto, UpdateStudentDto, StudentResponseDto } from '../../dtos/student.dto';

export interface IStudentService {
  getAllStudents(campusIds?: number[], schoolId?: number, filterCampusId?: number, search?: string): Promise<StudentResponseDto[]>;
  getStudentById(id: number, campusIds?: number[], schoolId?: number): Promise<StudentResponseDto | undefined>;
  createStudent(data: CreateStudentDto): Promise<StudentResponseDto>;
  updateStudent(id: number, data: UpdateStudentDto, campusIds?: number[], schoolId?: number): Promise<StudentResponseDto | undefined>;
  deleteStudent(id: number, campusIds?: number[], schoolId?: number): Promise<boolean>;
}
