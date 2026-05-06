import { Section } from '../../models';

export interface ISectionRepository {
  getAll(): Promise<Section[]>;
  getBySchool(schoolId: number): Promise<Section[]>;
  getByClass(classId: number): Promise<Section[]>;
  getByClassStrict(classId: number, schoolId: number): Promise<Section[]>;
  getById(id: number): Promise<Section | undefined>;
  create(item: Partial<Section>): Promise<Section>;
  update(id: number, item: Partial<Section>): Promise<Section>;
  delete(id: number, schoolId?: number): Promise<boolean>;
}
