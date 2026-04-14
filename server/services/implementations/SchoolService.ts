import { ISchoolRepository } from '../../interfaces/repositories/ISchoolRepository';
import { ICampusRepository } from '../../interfaces/repositories/ICampusRepository';
import { ISchoolService } from '../../interfaces/services/ISchoolService';
import { School, Campus } from '../../models';

export class SchoolService implements ISchoolService {
  constructor(
    private schoolRepo: ISchoolRepository,
    private campusRepo: ICampusRepository
  ) {}

  async getAllSchools(): Promise<School[]> {
    return this.schoolRepo.getAll();
  }

  async createSchool(data: any): Promise<School> {
    return this.schoolRepo.create(data);
  }

  async getAllCampuses(): Promise<Campus[]> {
    return this.campusRepo.getAll();
  }

  async getCampusesBySchool(schoolId: number): Promise<Campus[]> {
    return this.campusRepo.getBySchoolId(schoolId);
  }

  async createCampus(data: any): Promise<Campus> {
    return this.campusRepo.create(data);
  }

  async updateCampus(id: number, data: any): Promise<Campus> {
    return this.campusRepo.update(id, data);
  }
}
