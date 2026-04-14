import { Request, Response } from 'express';
import { ISchoolService } from '../../interfaces/services/ISchoolService';

export class CampusController {
  constructor(private schoolService: ISchoolService) {}

  getCampuses = async (req: Request, res: Response) => {
    const campuses = await this.schoolService.getAllCampuses();
    res.json(campuses);
  };

  getBySchool = async (req: Request, res: Response) => {
    const campuses = await this.schoolService.getCampusesBySchool(parseInt(req.params.schoolId));
    res.json(campuses);
  };
}
