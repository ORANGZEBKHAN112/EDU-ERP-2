import * as sql from 'mssql';

export interface ISubscriptionRepository {
  getBySchoolId(schoolId: number): Promise<any>;
  create(item: any, transaction?: sql.Transaction): Promise<void>;
}
