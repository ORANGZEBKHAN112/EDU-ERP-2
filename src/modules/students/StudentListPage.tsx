import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, UserPlus, Edit, CheckCircle, XCircle, Loader2, MapPin, Trash2, Edit2, Users } from 'lucide-react';
import apiClient from '@/services/apiClient';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export default function StudentListPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [campuses, setCampuses] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCampus, setSelectedCampus] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    fatherName: '',
    admissionNo: '',
    phone: '',
    campusId: '',
    classId: '',
    isActive: true
  });

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCampus !== 'all') params.append('campusId', selectedCampus);
      if (selectedClass !== 'all') params.append('classId', selectedClass);
      
      const res = await apiClient.get(`/students?${params.toString()}`);
      setStudents(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      toast.error('Failed to load students');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampuses = async () => {
    try {
      const res = await apiClient.get('/campuses');
      setCampuses(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to fetch campuses');
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await apiClient.get('/classes');
      setClasses(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to fetch classes');
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchStudents();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, selectedCampus, selectedClass]);

  useEffect(() => {
    fetchCampuses();
    fetchClasses();
  }, []);

  const handleOpenModal = (student: any = null) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        fullName: student.fullName,
        fatherName: student.fatherName,
        admissionNo: student.admissionNo,
        phone: student.phone || '',
        campusId: student.campusId.toString(),
        classId: student.classId.toString(),
        isActive: student.isActive
      });
    } else {
      setEditingStudent(null);
      setFormData({
        fullName: '',
        fatherName: '',
        admissionNo: '',
        phone: '',
        campusId: campuses[0]?.id.toString() || '',
        classId: classes[0]?.id.toString() || '',
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        campusId: parseInt(formData.campusId),
        classId: parseInt(formData.classId)
      };

      if (editingStudent) {
        await apiClient.put(`/students/${editingStudent.id}`, payload);
        toast.success('Student updated successfully');
      } else {
        await apiClient.post('/students', payload);
        toast.success('Student created successfully');
      }
      setIsModalOpen(false);
      fetchStudents();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save student');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (student: any) => {
    try {
      await apiClient.put(`/students/${student.id}`, {
        isActive: !student.isActive
      });
      toast.success(`Student ${student.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchStudents();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-10 p-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Student Registry</h1>
          <p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-widest flex items-center gap-2">
            <Users size={14} className="text-blue-500" />
            Centralized database oversight
          </p>
        </div>
        <Button 
          onClick={() => handleOpenModal()} 
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-6 rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-95 flex gap-2"
        >
          <UserPlus size={18} />
          New Enrollment
        </Button>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Filter by name, admission no or contact..." 
              className="pl-12 h-12 bg-slate-50/50 border-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="w-full sm:w-48">
              <Select value={selectedCampus} onValueChange={setSelectedCampus}>
                <SelectTrigger className="h-12 bg-slate-50/50 border-slate-100 rounded-xl">
                  <SelectValue placeholder="All Campuses" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                  <SelectItem value="all">Global Access</SelectItem>
                  {campuses.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="h-12 bg-slate-50/50 border-slate-100 rounded-xl">
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                  <SelectItem value="all">Every Level</SelectItem>
                  {classes.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden min-h-[400px]">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="data-grid-header w-[120px]">Admn ID</TableHead>
              <TableHead className="data-grid-header">Full Identity</TableHead>
              <TableHead className="data-grid-header">Paternal Record</TableHead>
              <TableHead className="data-grid-header">Campus</TableHead>
              <TableHead className="data-grid-header text-center">Designation</TableHead>
              <TableHead className="data-grid-header text-center">Status</TableHead>
              <TableHead className="data-grid-header text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                    <Loader2 className="animate-spin text-blue-500" size={32} />
                    <p className="text-xs font-black uppercase tracking-widest">Accessing records...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-64 text-center">
                   <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-dashed border-slate-200">
                       <Users size={32} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">No students found</p>
                      <p className="text-[10px] font-medium uppercase tracking-widest mt-1">Refine your search parameters</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              students.map((student) => (
                <TableRow key={student.id} className="data-grid-row border-slate-100 group">
                  <TableCell>
                    <span className="mono-id">{student.admissionNo}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">{student.fullName}</span>
                      {student.phone && <span className="text-[10px] text-slate-400 font-bold tracking-tight">{student.phone}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-slate-600">{student.fatherName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <MapPin className="text-slate-400" size={12} />
                       <span className="text-xs font-bold text-slate-700">{student.campusName || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-[11px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-lg border border-blue-100 uppercase tracking-widest">
                       {student.className || 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={`rounded-lg px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest border shadow-none ${
                        student.isActive 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                          : 'bg-slate-50 text-slate-400 border-slate-100'
                      }`}>
                      {student.isActive ? 'Active' : 'Archived'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleOpenModal(student)}
                        className="h-8 w-8 p-0 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                      >
                        <Edit size={14} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => toggleStatus(student)}
                        className={`h-8 w-8 p-0 rounded-lg transition-colors ${student.isActive ? 'text-red-400 hover:text-red-600 hover:bg-red-50' : 'text-green-400 hover:text-green-600 hover:bg-green-50'}`}
                      >
                        {student.isActive ? <XCircle size={14} /> : <CheckCircle size={14} />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl bg-white rounded-3xl p-8 border-none shadow-2xl">
          <DialogHeader className="mb-8">
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">
              {editingStudent ? 'Edit Profile' : 'New Admission'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <FormInput 
                  label="Legal Full Name"
                  placeholder="e.g. Julian Anderson"
                  value={formData.fullName}
                  onChange={(val: string) => setFormData({...formData, fullName: val})}
               />
               <FormInput 
                  label="Father / Guardian Name"
                  placeholder="e.g. Robert Anderson"
                  value={formData.fatherName}
                  onChange={(val: string) => setFormData({...formData, fatherName: val})}
               />
               <FormInput 
                  label="Admission Number"
                  placeholder="ADM-0000"
                  value={formData.admissionNo}
                  onChange={(val: string) => setFormData({...formData, admissionNo: val})}
                  mono
               />
               <FormInput 
                  label="Contact Primary"
                  placeholder="+92 XXX XXXXXXX"
                  value={formData.phone}
                  onChange={(val: string) => setFormData({...formData, phone: val})}
               />

                <div className="grid gap-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Campus Entity</label>
                  <Select 
                    value={formData.campusId} 
                    onValueChange={(val) => setFormData({...formData, campusId: val})}
                  >
                    <SelectTrigger className="h-12 bg-slate-50 border-slate-100 rounded-xl font-bold">
                      <SelectValue placeholder="Select Campus" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                      {campuses.map(c => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Academic Class</label>
                  <Select 
                    value={formData.classId} 
                    onValueChange={(val) => setFormData({...formData, classId: val})}
                  >
                    <SelectTrigger className="h-12 bg-slate-50 border-slate-100 rounded-xl font-bold">
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                      {classes.map(c => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
            </div>

            <DialogFooter className="pt-6 border-t border-slate-50">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setIsModalOpen(false)}
                className="font-bold text-slate-500 rounded-xl px-8"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-black px-10 rounded-xl shadow-lg shadow-blue-200"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingStudent ? 'Synchronize Data' : 'Finalize Admission')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const FormInput = ({ label, placeholder, value, onChange, mono = false }: any) => (
  <div className="grid gap-3">
    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
    <Input 
      placeholder={placeholder}
      className={`h-12 bg-slate-50 border-slate-100 rounded-xl focus:ring-4 focus:ring-blue-500/10 transition-all font-bold placeholder:font-medium ${mono ? 'font-mono tracking-tight text-blue-600' : ''}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);
