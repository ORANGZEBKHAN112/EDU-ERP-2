import { Request, Response, NextFunction } from 'express';
import { ISchoolService } from '../../interfaces/services/ISchoolService';

export class CampusController {
  constructor(private schoolService: ISchoolService) {}

  getCampuses = async (req: any, res: Response, next: NextFunction) => {
    try {
      const schoolId = req.user?.schoolId;
      let campuses;
      if (schoolId) {
        campuses = await this.schoolService.getCampusesBySchool(schoolId);
      } else {
        campuses = await this.schoolService.getAllCampuses();
      }
      res.json({ success: true, data: campuses });
    } catch (err) {
      next(err);
    }
  };

  getBySchool = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      if (!schoolId) {
        return res.status(400).json({ success: false, message: 'schoolId is required' });
      }
      const campuses = await this.schoolService.getCampusesBySchool(schoolId);
      res.json({ success: true, data: campuses });
    } catch (err) {
      next(err);
    }
  };

  createCampus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.body.schoolId || !req.body.campusName) {
        return res.status(400).json({ success: false, message: 'schoolId and campusName are required' });
      }
      const campus = await this.schoolService.createCampus({
        schoolId: req.body.schoolId,
        name: req.body.campusName,
        state: req.body.state,
        city: req.body.city,
        address: req.body.address
      });
      res.status(201).json({ success: true, data: campus });
    } catch (err) {
      next(err);
    }
  };

  updateCampus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const campusId = parseInt(req.params.id);
      if (!campusId) {
        return res.status(400).json({ success: false, message: 'id is required' });
      }
      const campus = await this.schoolService.updateCampus(campusId, req.body);
      res.json({ success: true, data: campus });
    } catch (err) {
      next(err);
    }
  };
}
