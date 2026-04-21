import { Class } from '../../models';

export interface IClassRepository {
  getByCampus(campusId: number): Promise<Class[]>;
  getBySchool(schoolId: number): Promise<Class[]>;
  getById(id: number): Promise<Class | undefined>;
  create(item: Partial<Class>): Promise<Class>;
  update(id: number, item: Partial<Class>): Promise<Class>;
  delete(id: number): Promise<boolean>;
}
