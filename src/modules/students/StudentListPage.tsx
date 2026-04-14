import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, UserPlus, Edit, CheckCircle, XCircle, Loader2 } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCampus, setSelectedCampus] = useState<string>('all');
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
    classId: '1',
    isActive: true
  });

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCampus !== 'all') params.append('campusId', selectedCampus);
      
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

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchStudents();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, selectedCampus]);

  useEffect(() => {
    fetchCampuses();
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
        classId: '1',
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
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground">Manage student records and academic profiles.</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <UserPlus className="mr-2 h-4 w-4" /> Add Student
        </Button>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name or admission no..." 
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full md:w-64">
          <Select value={selectedCampus} onValueChange={setSelectedCampus}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Campus" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campuses</SelectItem>
              {campuses.map(c => (
                <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Admission No</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead>Father Name</TableHead>
              <TableHead>Campus</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : students.length > 0 ? (
              students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-mono text-xs">{student.admissionNo}</TableCell>
                  <TableCell className="font-medium">{student.fullName}</TableCell>
                  <TableCell>{student.fatherName}</TableCell>
                  <TableCell>{campuses.find(c => c.id === student.campusId)?.name || student.campusId}</TableCell>
                  <TableCell>Class {student.classId}</TableCell>
                  <TableCell>
                    <Badge variant={student.isActive ? 'default' : 'secondary'}>
                      {student.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenModal(student)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => toggleStatus(student)}
                        className={student.isActive ? 'text-red-500 hover:text-red-600' : 'text-green-500 hover:text-green-600'}
                      >
                        {student.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No students found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingStudent ? 'Edit Student' : 'Add New Student'}</DialogTitle>
              <DialogDescription>
                Enter student details below. Admission No is unique.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <Input 
                    required 
                    value={formData.fullName} 
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})} 
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Father Name</label>
                  <Input 
                    required 
                    value={formData.fatherName} 
                    onChange={(e) => setFormData({...formData, fatherName: e.target.value})} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Admission No</label>
                  <Input 
                    required 
                    disabled={!!editingStudent}
                    value={formData.admissionNo} 
                    onChange={(e) => setFormData({...formData, admissionNo: e.target.value})} 
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Phone</label>
                  <Input 
                    value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Campus</label>
                  <Select 
                    value={formData.campusId} 
                    onValueChange={(val) => setFormData({...formData, campusId: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Campus" />
                    </SelectTrigger>
                    <SelectContent>
                      {campuses.map(c => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Class</label>
                  <Select 
                    value={formData.classId} 
                    onValueChange={(val) => setFormData({...formData, classId: val})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Class 1</SelectItem>
                      <SelectItem value="2">Class 2</SelectItem>
                      <SelectItem value="3">Class 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Student'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
