import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, GraduationCap, MapPin } from 'lucide-react';
import apiClient from '@/services/apiClient';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function ClassManagementPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [campuses, setCampuses] = useState<any[]>([]);
  const [selectedCampus, setSelectedCampus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    campusId: '',
    name: ''
  });

  const fetchCampuses = async () => {
    try {
      const res = await apiClient.get('/campuses');
      const data = Array.isArray(res.data) ? res.data : [];
      setCampuses(data);
      if (data.length > 0) {
        setSelectedCampus(data[0].id.toString());
      }
    } catch (error) {
      toast.error('Failed to load campuses');
    }
  };

  const fetchClasses = async (campusId: string) => {
    if (!campusId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/classes/${campusId}`);
      setClasses(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampuses();
  }, []);

  useEffect(() => {
    if (selectedCampus) {
      fetchClasses(selectedCampus);
    }
  }, [selectedCampus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/classes', {
        ...formData,
        campusId: parseInt(formData.campusId)
      });
      toast.success('Class created successfully');
      setIsModalOpen(false);
      fetchClasses(selectedCampus);
    } catch (error) {
      toast.error('Failed to create class');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      campusId: selectedCampus,
      name: ''
    });
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Class Management</h1>
          <p className="text-muted-foreground">Define academic classes for each campus.</p>
        </div>
        <Button onClick={handleOpenModal}>
          <Plus className="mr-2 h-4 w-4" /> Add Class
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 border rounded-lg">
        <MapPin className="h-5 w-5 text-muted-foreground" />
        <div className="flex-1 max-w-xs">
          <Select value={selectedCampus} onValueChange={setSelectedCampus}>
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
        <p className="text-sm text-muted-foreground italic">
          Showing classes for the selected campus.
        </p>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Class Name</TableHead>
              <TableHead>Campus</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [1, 2, 3].map((i) => (
                <TableRow key={i}>
                  {[1, 2, 3, 4].map((j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : classes.length > 0 ? (
              classes.map((cls) => (
                <TableRow key={cls.id}>
                  <TableCell className="font-mono text-xs">{cls.id}</TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-primary" />
                      {cls.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    {campuses.find(c => c.id.toString() === selectedCampus)?.name}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Edit</Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No classes found for this campus.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Add New Class</DialogTitle>
              <DialogDescription>
                Create a new academic class for the selected campus.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
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
                <label className="text-sm font-medium">Class Name</label>
                <Input 
                  required 
                  placeholder="e.g. Class 1, Grade 10, Nursery"
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Create Class'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
