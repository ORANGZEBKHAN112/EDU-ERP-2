import { Student } from '../../models';

export interface IStudentRepository {
  getAll(campusIds?: number[], schoolId?: number): Promise<Student[]>;
  getById(id: number, campusIds?: number[], schoolId?: number): Promise<Student | undefined>;
  create(item: Partial<Student>): Promise<Student>;
  update(id: number, item: Partial<Student>): Promise<Student | undefined>;
  delete(id: number): Promise<boolean>;
}
