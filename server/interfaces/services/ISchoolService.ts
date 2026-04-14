import { School, Campus } from '../../models';

export interface ISchoolService {
  getAllSchools(): Promise<School[]>;
  createSchool(data: any): Promise<School>;
  getAllCampuses(): Promise<Campus[]>;
  getCampusesBySchool(schoolId: number): Promise<Campus[]>;
}
