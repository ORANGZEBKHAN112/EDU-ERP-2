import { Campus } from '../../models';

export interface ICampusRepository {
  getAll(): Promise<Campus[]>;
  getById(id: number): Promise<Campus | undefined>;
  getBySchoolId(schoolId: number): Promise<Campus[]>;
  create(item: Partial<Campus>): Promise<Campus>;
}
