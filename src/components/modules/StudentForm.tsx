import React, { useState, useEffect } from 'react';
import { campusApi } from '../../api/campusApi';
import { classApi } from '../../api/classApi';
import { useAppStore } from '../../store/appStore';
import { unwrap } from '../../utils/apiHelper';
import { Loader2 } from 'lucide-react';

interface StudentFormProps {
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const StudentForm: React.FC<StudentFormProps> = ({ 
  initialData, 
  onSubmit, 
  onCancel,
  isSubmitting 
}) => {
  const { campuses, classes, setCampuses, setClasses } = useAppStore();
  const [formData, setFormData] = useState({
    fullName: initialData?.fullName || '',
    admissionNo: initialData?.admissionNo || '',
    fatherName: initialData?.fatherName || '',
    phone: initialData?.phone || '',
    campusId: initialData?.campusId || '',
    classId: initialData?.classId || '',
  });

  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  useEffect(() => {
    const fetchOptions = async () => {
      if (campuses.length > 0 && classes.length > 0) {
        setIsLoadingOptions(false);
        return;
      }
      try {
        const [campusesRes, classesRes] = await Promise.all([
          campusApi.getAll(),
          classApi.getAll()
        ]);
        setCampuses(unwrap(campusesRes));
        setClasses(unwrap(classesRes));
      } catch (err) {
        console.error('Failed to fetch form options', err);
      } finally {
        setIsLoadingOptions(false);
      }
    };
    fetchOptions();
  }, [campuses.length, classes.length, setCampuses, setClasses]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (isLoadingOptions) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
          <input
            type="text"
            name="fullName"
            required
            value={formData.fullName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Admission No</label>
          <input
            type="text"
            name="admissionNo"
            required
            value={formData.admissionNo}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Father's Name</label>
          <input
            type="text"
            name="fatherName"
            value={formData.fatherName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Campus</label>
          <select
            name="campusId"
            required
            value={formData.campusId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
          >
            <option value="">Select Campus</option>
            {campuses.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Class</label>
          <select
            name="classId"
            required
            value={formData.classId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
          >
            <option value="">Select Class</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-70"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          {initialData ? 'Update Student' : 'Add Student'}
        </button>
      </div>
    </form>
  );
};
