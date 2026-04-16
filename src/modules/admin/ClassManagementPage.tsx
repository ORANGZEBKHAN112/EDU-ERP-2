import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, GraduationCap, MapPin, Search, AlertCircle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import apiClient from '@/services/apiClient';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAppStore } from '@/store/appStore';
import { useDebounce } from 'use-debounce';

const ClassRow = React.memo(({ cls, campusName }: { cls: any, campusName?: string }) => (
  <TableRow>
    <TableCell className="font-mono text-xs">{cls.id}</TableCell>
    <TableCell className="font-medium">
      <div className="flex items-center gap-2">
        <GraduationCap className="h-4 w-4 text-primary" />
        {cls.name}
      </div>
    </TableCell>
    <TableCell>
      {campusName || 'Unknown Campus'}
    </TableCell>
    <TableCell className="text-right">
      <Button variant="ghost" size="sm">Edit</Button>
    </TableCell>
  </TableRow>
));

ClassRow.displayName = 'ClassRow';

export default function ClassManagementPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const { campuses, isCampusesLoaded, fetchCampuses } = useAppStore();
  const [selectedCampus, setSelectedCampus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebounce(searchTerm, 300);

  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [formData, setFormData] = useState({
    campusId: '',
    name: ''
  });

  useEffect(() => {
    if (!isCampusesLoaded) {
      fetchCampuses();
    }
  }, [isCampusesLoaded, fetchCampuses]);

  useEffect(() => {
    if (isCampusesLoaded && campuses.length > 0 && !selectedCampus) {
      setSelectedCampus(campuses[0].id.toString());
    }
  }, [isCampusesLoaded, campuses, selectedCampus]);

  const fetchClasses = useCallback(async (campusId: string) => {
    if (!campusId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/classes/${campusId}`);
      setClasses(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      setError('Failed to load classes');
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCampus) {
      fetchClasses(selectedCampus);
      setPage(1);
    }
  }, [selectedCampus, fetchClasses]);

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

  const handleOpenModal = useCallback(() => {
    setFormData({
      campusId: selectedCampus,
      name: ''
    });
    setIsModalOpen(true);
  }, [selectedCampus]);

  // Client-side filtering and pagination
  const filteredClasses = useMemo(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) return classes;
    return classes.filter(cls => 
      cls.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [classes, debouncedSearch]);

  const paginatedClasses = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredClasses.slice(start, start + pageSize);
  }, [filteredClasses, page, pageSize]);

  const totalPages = Math.ceil(filteredClasses.length / pageSize);

  const currentCampusName = useMemo(() => 
    campuses.find(c => c.id.toString() === selectedCampus)?.name
  , [campuses, selectedCampus]);

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-card p-4 border rounded-lg">
        <div className="flex items-center gap-4">
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
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search classes..." 
            className="pl-9 bg-white" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm.length > 0 && searchTerm.length < 2 && (
            <span className="absolute -bottom-5 left-0 text-[10px] text-amber-600 font-medium">Type at least 2 characters to search</span>
          )}
        </div>
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
            ) : error ? (
              <TableRow>
                <TableCell colSpan={4} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-500 gap-4">
                    <AlertCircle className="text-red-500" size={32} />
                    <div className="text-center">
                      <p className="font-medium text-slate-900">{error}</p>
                      <button 
                        onClick={() => fetchClasses(selectedCampus)}
                        className="mt-2 text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-2 mx-auto"
                      >
                        <RefreshCw size={16} /> Retry
                      </button>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedClasses.length > 0 ? (
              paginatedClasses.map((cls) => (
                <ClassRow 
                  key={cls.id} 
                  cls={cls} 
                  campusName={currentCampusName}
                />
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

        {filteredClasses.length > 0 && !loading && !error && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <p className="text-sm text-slate-500 font-medium">
              Showing <span className="text-slate-900 font-bold">{(page - 1) * pageSize + 1}</span> to <span className="text-slate-900 font-bold">{Math.min(page * pageSize, filteredClasses.length)}</span> of <span className="text-slate-900 font-bold">{filteredClasses.length}</span> classes
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
        )}
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
