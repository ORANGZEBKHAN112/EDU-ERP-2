import { Request, Response } from 'express';
import { ISchoolService } from '../../interfaces/services/ISchoolService';

export class SchoolController {
  constructor(private schoolService: ISchoolService) {}

  getSchools = async (req: Request, res: Response) => {
    const schools = await this.schoolService.getAllSchools();
    res.json(schools);
  };

  createSchool = async (req: Request, res: Response) => {
    const school = await this.schoolService.createSchool(req.body);
    res.status(201).json(school);
  };
}
