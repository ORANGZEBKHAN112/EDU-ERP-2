import { Response, NextFunction } from 'express';
import { ClassRepository } from '../../repositories/implementations/ClassRepository';

export class ClassController {
  constructor(private classRepo: ClassRepository) {}

  /**
   * Get all classes for a specific campus
   * Requires campusId in params or query
   */
  getClasses = async (req: any, res: Response, next: NextFunction) => {
    try {
      const campusId = parseInt(req.params.campusId || req.query.campusId);
      if (!campusId) {
        return res.status(400).json({ success: false, message: 'campusId is required' });
      }
      const classes = await this.classRepo.getByCampus(campusId);
      res.json({ success: true, data: classes });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Get classes for a specific school
   */
  getClassesBySchool = async (req: any, res: Response, next: NextFunction) => {
    try {
      const schoolId = parseInt(req.params.schoolId);
      if (!schoolId) {
        return res.status(400).json({ success: false, message: 'schoolId is required' });
      }
      const classes = await this.classRepo.getBySchool(schoolId);
      res.json({ success: true, data: classes });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Get a single class by ID
   */
  getClassById = async (req: any, res: Response, next: NextFunction) => {
    try {
      const classId = parseInt(req.params.id);
      if (!classId) {
        return res.status(400).json({ success: false, message: 'id is required' });
      }
      const classItem = await this.classRepo.getById(classId);
      if (!classItem) {
        return res.status(404).json({ success: false, message: 'Class not found' });
      }
      res.json({ success: true, data: classItem });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Create a new class
   * Requires: schoolId, campusId, className
   */
  createClass = async (req: any, res: Response, next: NextFunction) => {
    try {
      const { schoolId, campusId, className } = req.body;
      
      if (!schoolId || !campusId || !className) {
        return res.status(400).json({ 
          success: false, 
          message: 'schoolId, campusId, and className are required' 
        });
      }

      const newClass = await this.classRepo.create({ 
        schoolId, 
        campusId, 
        name: className 
      });
      res.status(201).json({ success: true, data: newClass });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Update an existing class
   */
  updateClass = async (req: any, res: Response, next: NextFunction) => {
    try {
      const classId = parseInt(req.params.id);
      const { schoolId, className } = req.body;

      if (!classId || !schoolId) {
        return res.status(400).json({ 
          success: false, 
          message: 'classId and schoolId are required' 
        });
      }

      const updated = await this.classRepo.update(classId, { 
        schoolId, 
        name: className 
      });
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Delete a class
   */
  deleteClass = async (req: any, res: Response, next: NextFunction) => {
    try {
      const classId = parseInt(req.params.id);
      const { schoolId } = req.body;

      if (!classId) {
        return res.status(400).json({ 
          success: false, 
          message: 'classId is required' 
        });
      }

      const deleted = await this.classRepo.delete(classId, schoolId);
      if (!deleted) {
        return res.status(404).json({ 
          success: false, 
          message: 'Class not found or could not be deleted' 
        });
      }
      res.json({ success: true, message: 'Class deleted successfully' });
    } catch (err) {
      next(err);
    }
  };
}
