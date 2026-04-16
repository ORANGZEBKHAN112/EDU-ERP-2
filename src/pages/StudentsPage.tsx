import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from 'use-debounce';
import { studentApi } from '../api/studentApi';
import { StudentForm } from '../components/modules/StudentForm';
import { unwrap, unwrapArray } from '../utils/apiHelper';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Loader2, 
  X,
  AlertCircle,
  User,
  History,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

const StudentRow = React.memo(({ student, onNavigate, onEdit, onDelete }: { 
  student: any, 
  onNavigate: (id: number) => void, 
  onEdit: (student: any) => void, 
  onDelete: (id: number) => void 
}) => (
  <tr className="hover:bg-slate-50 transition-colors group">
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
          onClick={() => onNavigate(student.id)}
          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all"
          title="View Ledger"
        >
          <History size={16} />
        </button>
        <button 
          onClick={() => onEdit(student)}
          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
          title="Edit"
        >
          <Edit2 size={16} />
        </button>
        <button 
          onClick={() => onDelete(student.id)}
          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </td>
  </tr>
));

StudentRow.displayName = 'StudentRow';

export const StudentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebounce(searchTerm, 300);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchStudents = useCallback(async () => {
    // Search optimization: Only search if length >= 2 or empty
    if (debouncedSearch.length > 0 && debouncedSearch.length < 2) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await studentApi.getAll({ search: debouncedSearch });
      setStudents(unwrapArray(data));
    } catch (err) {
      setError('Failed to load students');
      toast.error('Failed to load students');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchStudents();
    setPage(1); // Reset page on search
  }, [fetchStudents]);

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

  const handleDelete = useCallback(async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    
    try {
      await studentApi.delete(id);
      toast.success('Student deleted successfully');
      fetchStudents();
    } catch (err) {
      toast.error('Failed to delete student');
    }
  }, [fetchStudents]);

  const openAddModal = () => {
    setEditingStudent(null);
    setIsModalOpen(true);
  };

  const openEditModal = useCallback((student: any) => {
    setEditingStudent(student);
    setIsModalOpen(true);
  }, []);

  const handleNavigate = useCallback((id: number) => {
    navigate(`/ledger/${id}`);
  }, [navigate]);

  // Client-side pagination & sorting
  const paginatedStudents = useMemo(() => {
    const start = (page - 1) * pageSize;
    return students.slice(start, start + pageSize);
  }, [students, page, pageSize]);

  const totalPages = Math.ceil(students.length / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student Management</h1>
          <p className="text-slate-500 text-sm">Manage student enrollments and profiles</p>
        </div>
        <Button 
          onClick={openAddModal}
          className="shadow-lg shadow-emerald-900/20"
        >
          <Plus size={20} className="mr-2" />
          Add Student
        </Button>
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
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>
          {searchTerm.length > 0 && searchTerm.length < 2 && (
            <span className="text-xs text-amber-600 font-medium">Type at least 2 characters to search</span>
          )}
        </div>

        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-500 gap-3">
            <Loader2 className="animate-spin text-emerald-600" size={32} />
            <p className="text-sm font-medium">Loading students...</p>
          </div>
        ) : error ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-500 gap-4">
            <AlertCircle className="text-red-500" size={32} />
            <div className="text-center">
              <p className="font-medium text-slate-900">{error}</p>
              <button 
                onClick={fetchStudents}
                className="mt-2 text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-2 mx-auto"
              >
                <RefreshCw size={16} /> Retry
              </button>
            </div>
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
          <>
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
                  {paginatedStudents.map((student) => (
                    <StudentRow 
                      key={student.id} 
                      student={student} 
                      onNavigate={handleNavigate}
                      onEdit={openEditModal}
                      onDelete={handleDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
              <p className="text-sm text-slate-500 font-medium">
                Showing <span className="text-slate-900 font-bold">{(page - 1) * pageSize + 1}</span> to <span className="text-slate-900 font-bold">{Math.min(page * pageSize, students.length)}</span> of <span className="text-slate-900 font-bold">{students.length}</span> students
              </p>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft size={16} className="mr-1" /> Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setPage(i + 1)}
                      className={`w-8 h-8 rounded-md text-xs font-bold transition-all ${
                        page === i + 1 
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' 
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            </div>
          </>
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
