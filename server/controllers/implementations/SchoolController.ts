import { Request, Response } from 'express';
import { ISchoolService } from '../../interfaces/services/ISchoolService';

export class SchoolController {
  constructor(private schoolService: ISchoolService) {}

  getSchools = async (req: Request, res: Response) => {
    const schools = await this.schoolService.getAllSchools();
    res.json({ success: true, data: schools });
  };

  createSchool = async (req: Request, res: Response) => {
    try {
      if (!req.body.schoolName) {
        return res.status(400).json({ success: false, message: 'schoolName is required' });
      }
      const school = await this.schoolService.createSchool({
        name: req.body.schoolName,
        country: req.body.country
      });
      res.status(201).json({ success: true, data: school });
    } catch (error) {
      console.error('Error creating school:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
}
