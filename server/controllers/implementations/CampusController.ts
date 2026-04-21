import { Request, Response, NextFunction } from 'express';
import { ISchoolService } from '../../interfaces/services/ISchoolService';

export class CampusController {
  constructor(private schoolService: ISchoolService) {}

  getCampuses = async (req: any, res: Response, next: NextFunction) => {
    try {
      const schoolId = req.user?.schoolId;
      const campusIds = req.user?.campusIds || [];
      const roles = req.user?.roles || [];
      const isSuperAdmin = roles.some((r: string) => r.toLowerCase() === 'superadmin');

      let campuses: any[];
      if (isSuperAdmin) {
        campuses = await this.schoolService.getAllCampuses();
      } else if (schoolId) {
        campuses = await this.schoolService.getCampusesBySchool(schoolId);
      } else {
        campuses = await this.schoolService.getAllCampuses();
      }

      // Final filter for users with restricted campus assignments
      if (!isSuperAdmin && campusIds.length > 0) {
        campuses = campuses.filter((c: any) => campusIds.includes(c.id));
      }

      res.json(campuses);
    } catch (err) {
      next(err);
    }
  };

  getBySchool = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const campuses = await this.schoolService.getCampusesBySchool(parseInt(req.params.schoolId));
      res.json(campuses);
    } catch (err) {
      next(err);
    }
  };

  createCampus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const campus = await this.schoolService.createCampus(req.body);
      res.json(campus);
    } catch (err) {
      next(err);
    }
  };

  updateCampus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const campus = await this.schoolService.updateCampus(parseInt(req.params.id), req.body);
      res.json(campus);
    } catch (err) {
      next(err);
    }
  };
}
