import { SchoolRepository, CampusRepository, StudentRepository, FeeRepository, SummaryRepository } from '../repositories';

export class SchoolService {
  private schoolRepo = new SchoolRepository();
  private campusRepo = new CampusRepository();

  async getAllSchools() { return this.schoolRepo.getAll(); }
  async createSchool(data: any) { return this.schoolRepo.create(data); }
  
  async getAllCampuses() { return this.campusRepo.getAll(); }
  async getCampusesBySchool(schoolId: number) { return this.campusRepo.getBySchoolId(schoolId); }
}

export class StudentService {
  private studentRepo = new StudentRepository();
  async getAllStudents(campusIds?: number[], schoolId?: number) { return this.studentRepo.getAll(campusIds, schoolId); }
  async createStudent(data: any) { return this.studentRepo.create(data); }
}

export class DashboardService {
  private summaryRepo = new SummaryRepository();

  async getSuperAdminStats() {
    const stats = await this.summaryRepo.getSuperAdminStats();
    const trend = await this.summaryRepo.getMonthlyRevenueTrend();
    
    return {
      ...stats,
      monthlyRevenueTrend: trend
    };
  }

  async getCampusDashboard(campusId: number) {
    return this.summaryRepo.getCampusStats(campusId);
  }
}
