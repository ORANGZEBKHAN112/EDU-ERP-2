import { Response, NextFunction } from 'express';
import { SectionRepository } from '../../repositories/implementations/SectionRepository';

export class SectionController {
  constructor(private sectionRepo: SectionRepository) {}

  /**
   * Get all sections for a class
   * Requires: classId in params
   * Optional: schoolId in query (for strict validation)
   */
  getSectionsByClass = async (req: any, res: Response, next: NextFunction) => {
    try {
      const classId = parseInt(req.params.classId);
      const schoolId = req.query.schoolId ? parseInt(req.query.schoolId) : undefined;

      if (!classId) {
        return res.status(400).json({ success: false, message: 'classId is required' });
      }

      const sections = schoolId
        ? await this.sectionRepo.getByClassStrict(classId, schoolId)
        : await this.sectionRepo.getByClass(classId);

      res.json({ success: true, data: sections });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Get sections for a school (admin view)
   */
  getSectionsBySchool = async (req: any, res: Response, next: NextFunction) => {
    try {
      const schoolId = parseInt(req.params.schoolId);

      if (!schoolId) {
        return res.status(400).json({ success: false, message: 'schoolId is required' });
      }

      const sections = await this.sectionRepo.getBySchool(schoolId);
      res.json({ success: true, data: sections });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Get a single section by ID
   */
  getSectionById = async (req: any, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);

      if (!id) {
        return res.status(400).json({ success: false, message: 'id is required' });
      }

      const section = await this.sectionRepo.getById(id);
      if (!section) {
        return res.status(404).json({ success: false, message: 'Section not found' });
      }

      res.json({ success: true, data: section });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Create a new section
   * Requires: classId, campusId, schoolId, name
   * Validates classId belongs to the same school/campus
   */
  createSection = async (req: any, res: Response, next: NextFunction) => {
    try {
      const { schoolId, campusId, classId, name } = req.body;

      if (!schoolId || !campusId || !classId || !name) {
        return res.status(400).json({
          success: false,
          message: 'schoolId, campusId, classId, and name are required'
        });
      }

      const section = await this.sectionRepo.create({
        schoolId,
        campusId,
        classId,
        name
      });

      res.status(201).json({ success: true, data: section });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Update a section
   * Requires: schoolId for validation
   * Optional: name, isActive
   */
  updateSection = async (req: any, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const { schoolId, name, isActive } = req.body;

      if (!id || !schoolId) {
        return res.status(400).json({
          success: false,
          message: 'id and schoolId are required'
        });
      }

      const section = await this.sectionRepo.update(id, {
        schoolId,
        name,
        isActive
      });

      res.json({ success: true, data: section });
    } catch (err) {
      next(err);
    }
  };

  /**
   * Delete a section
   * Requires: id
   * Optional: schoolId for extra validation
   */
  deleteSection = async (req: any, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const { schoolId } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'id is required'
        });
      }

      const deleted = await this.sectionRepo.delete(id, schoolId);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Section not found or could not be deleted'
        });
      }

      res.json({ success: true, message: 'Section deleted successfully' });
    } catch (err) {
      next(err);
    }
  };
}
