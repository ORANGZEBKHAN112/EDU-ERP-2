import { Role } from '../../models';

export interface IRoleRepository {
  getByName(name: string): Promise<any>;
}
