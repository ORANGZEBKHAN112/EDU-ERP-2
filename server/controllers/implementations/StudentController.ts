import { Response, NextFunction } from 'express';
import { IStudentService } from '../../interfaces/services/IStudentService';
import { createStudentSchema, updateStudentSchema } from '../../utils/validation';

export class StudentController {
  constructor(private studentService: IStudentService) {}

  getStudents = async (req: any, res: Response, next: NextFunction) => {
    try {
      const campusIds = req.user.campusIds;
      const schoolId = req.user.schoolId;
      const students = await this.studentService.getAllStudents(campusIds, schoolId);
      res.json(students);
    } catch (err) {
      next(err);
    }
  };

  getStudentById = async (req: any, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const student = await this.studentService.getStudentById(id, req.user.campusIds, req.user.schoolId);
      if (!student) return res.status(404).json({ message: 'Student not found' });
      res.json(student);
    } catch (err) {
      next(err);
    }
  };

  createStudent = async (req: any, res: Response, next: NextFunction) => {
    try {
      const validated = createStudentSchema.parse(req.body);
      const student = await this.studentService.createStudent({ ...validated, schoolId: req.user.schoolId });
      res.status(201).json(student);
    } catch (err: any) {
      next(err);
    }
  };

  updateStudent = async (req: any, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const validated = updateStudentSchema.parse(req.body);
      const student = await this.studentService.updateStudent(id, validated, req.user.campusIds, req.user.schoolId);
      if (!student) return res.status(404).json({ message: 'Student not found or access denied' });
      res.json(student);
    } catch (err) {
      next(err);
    }
  };

  deleteStudent = async (req: any, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const success = await this.studentService.deleteStudent(id, req.user.campusIds, req.user.schoolId);
      if (!success) return res.status(404).json({ message: 'Student not found or access denied' });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
