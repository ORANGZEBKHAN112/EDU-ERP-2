import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from 'use-debounce';
import { studentApi } from '../api/studentApi';
import { StudentForm } from '../components/modules/StudentForm';
import { unwrap } from '../utils/apiHelper';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Loader2, 
  X,
  AlertCircle,
  User,
  History
} from 'lucide-react';
import { toast } from 'sonner';

export const StudentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebounce(searchTerm, 300);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const data = await studentApi.getAll({ search: debouncedSearch });
      setStudents(unwrap(data));
    } catch (err) {
      toast.error('Failed to load students');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [debouncedSearch]);

  const handleCreateOrUpdate = async (formData: any) => {
    setIsSubmitting(true);
    try {
      if (editingStudent) {
        await studentApi.update(editingStudent.id, formData);
        toast.success('Student updated successfully');
      } else {
        await studentApi.create(formData);
        toast.success('Student added successfully');
      }
      setIsModalOpen(false);
      setEditingStudent(null);
      fetchStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save student');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    
    try {
      await studentApi.delete(id);
      toast.success('Student deleted successfully');
      fetchStudents();
    } catch (err) {
      toast.error('Failed to delete student');
    }
  };

  const openAddModal = () => {
    setEditingStudent(null);
    setIsModalOpen(true);
  };

  const openEditModal = (student: any) => {
    setEditingStudent(student);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student Management</h1>
          <p className="text-slate-500 text-sm">Manage student enrollments and profiles</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-200"
        >
          <Plus size={20} />
          Add Student
        </button>
      </div>
      
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or admission no..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-500 gap-3">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <p className="text-sm font-medium">Loading students...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
              <User size={32} />
            </div>
            <div className="text-center">
              <p className="font-medium text-slate-600">No students found</p>
              <p className="text-sm">Try adjusting your search or add a new student.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Admission No</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Name</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Campus</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">{student.admissionNo}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 text-xs font-bold">
                          {student.fullName.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-slate-900">{student.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{student.className || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{student.campusName || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        student.isActive 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {student.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => navigate(`/ledger/${student.id}`)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all"
                          title="View Ledger"
                        >
                          <History size={16} />
                        </button>
                        <button 
                          onClick={() => openEditModal(student)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(student.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-lg">
                {editingStudent ? 'Edit Student Profile' : 'Enroll New Student'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <StudentForm 
                initialData={editingStudent}
                onSubmit={handleCreateOrUpdate}
                onCancel={() => setIsModalOpen(false)}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
