import { School, Campus } from '../../models';

export interface ISchoolService {
  getAllSchools(): Promise<School[]>;
  createSchool(data: any): Promise<School>;
  getAllCampuses(): Promise<Campus[]>;
  getCampusesBySchool(schoolId: number): Promise<Campus[]>;
  createCampus(data: any): Promise<Campus>;
  updateCampus(id: number, data: any): Promise<Campus>;
}
