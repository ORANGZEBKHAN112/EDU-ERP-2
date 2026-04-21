import { Response, NextFunction } from 'express';
import { ClassRepository } from '../../repositories/implementations/ClassRepository';

export class ClassController {
  constructor(private classRepo: ClassRepository) {}

  getAllClasses = async (req: any, res: Response, next: NextFunction) => {
    try {
      const campusIds = req.user?.campusIds || [];
      const roles = req.user?.roles || [];
      const isSuperAdmin = roles.some((r: string) => r.toLowerCase() === 'superadmin');
      
      let classes = await this.classRepo.getAll();
      
      // Filter classes by authorized campuses for non-SuperAdmins
      if (!isSuperAdmin && campusIds.length > 0) {
        classes = classes.filter((cls: any) => campusIds.includes(cls.campusId));
      }
      
      res.json(classes);
    } catch (err) {
      next(err);
    }
  };

  getClasses = async (req: any, res: Response, next: NextFunction) => {
    try {
      const campusId = parseInt(req.params.campusId);
      const classes = await this.classRepo.getByCampus(campusId);
      res.json(classes);
    } catch (err) {
      next(err);
    }
  };

  createClass = async (req: any, res: Response, next: NextFunction) => {
    try {
      const { campusId, name } = req.body;
      const newClass = await this.classRepo.create({ campusId, name });
      res.status(201).json(newClass);
    } catch (err) {
      next(err);
    }
  };
}
