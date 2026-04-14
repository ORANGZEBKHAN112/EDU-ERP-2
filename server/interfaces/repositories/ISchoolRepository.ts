import { School } from '../../models';

export interface ISchoolRepository {
  getAll(): Promise<School[]>;
  getById(id: number): Promise<School | undefined>;
  create(item: Partial<School>, transaction?: any): Promise<School>;
}
