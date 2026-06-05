import { Response, NextFunction } from 'express';
import { IStudentService } from '../../interfaces/services/IStudentService';
import { createStudentSchema, updateStudentSchema } from '../../utils/validation';

export class StudentController {
  constructor(private studentService: IStudentService) {}

  getStudents = async (req: any, res: Response, next: NextFunction) => {
    try {
      // SuperAdmin can see all students, others are restricted to their campuses/school
      const isSuperAdmin = req.user.roles.includes('SuperAdmin');
      const campusIds = isSuperAdmin ? undefined : req.user.campusIds;
      const schoolId = isSuperAdmin ? undefined : req.user.schoolId;
      const filterCampusId = req.query.campusId ? parseInt(req.query.campusId as string) : undefined;
      const search = req.query.search as string;
      const students = await this.studentService.getAllStudents(campusIds, schoolId, filterCampusId, search);
      res.json({ success: true, data: students });
    } catch (err) {
      next(err);
    }
  };

  getStudentById = async (req: any, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      // SuperAdmin can see all students, others are restricted to their campuses/school
      const isSuperAdmin = req.user.roles.includes('SuperAdmin');
      const campusIds = isSuperAdmin ? undefined : req.user.campusIds;
      const schoolId = isSuperAdmin ? undefined : req.user.schoolId;
      const student = await this.studentService.getStudentById(id, campusIds, schoolId);
      if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
      res.json({ success: true, data: student });
    } catch (err) {
      next(err);
    }
  };

  createStudent = async (req: any, res: Response, next: NextFunction) => {
    try {
      const validated = createStudentSchema.parse(req.body);
      const student = await this.studentService.createStudent({ ...validated, schoolId: req.user.schoolId });
      // Provide `studentId` key for clients/tests that expect it
      res.status(201).json({ success: true, data: { studentId: student.id, ...student } });
    } catch (err: any) {
      next(err);
    }
  };

  updateStudent = async (req: any, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id);
      const validated = updateStudentSchema.parse(req.body);
      const student = await this.studentService.updateStudent(id, validated, req.user.campusIds, req.user.schoolId);
      if (!student) return res.status(404).json({ success: false, message: 'Student not found or access denied' });
      res.json({ success: true, data: student });
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
