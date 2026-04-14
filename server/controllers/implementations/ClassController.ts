import { Response, NextFunction } from 'express';
import { ClassRepository } from '../../repositories/implementations/ClassRepository';

export class ClassController {
  constructor(private classRepo: ClassRepository) {}

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
