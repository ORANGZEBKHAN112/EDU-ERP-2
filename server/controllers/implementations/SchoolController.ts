import { Request, Response } from 'express';
import { ISchoolService } from '../../interfaces/services/ISchoolService';

export class SchoolController {
  constructor(private schoolService: ISchoolService) {}

  getSchools = async (req: Request, res: Response) => {
    const schools = await this.schoolService.getAllSchools();
    res.json(schools);
  };

  createSchool = async (req: Request, res: Response) => {
    try {
      const school = await this.schoolService.createSchool({
        name: req.body.schoolName,
        country: req.body.country
      });
      res.status(201).json(school);
    } catch (error) {
      console.error('Error creating school:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
}
