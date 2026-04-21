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
  <TableRow className="data-grid-row border-slate-100 group">
    <TableCell>
      <span className="mono-id">{cls.id}</span>
    </TableCell>
    <TableCell>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
          <GraduationCap size={16} />
        </div>
        <span className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{cls.name}</span>
      </div>
    </TableCell>
    <TableCell>
      <div className="flex items-center gap-2 text-slate-500 font-medium italic text-xs">
        <MapPin size={12} />
        {campusName || 'Unknown Site'}
      </div>
    </TableCell>
    <TableCell className="text-right">
       <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
        <Button variant="ghost" size="sm" className="h-8 px-3 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 text-[11px] font-black uppercase tracking-widest">
          Configure
        </Button>
      </div>
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
    <div className="space-y-10 p-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Academic Groups</h1>
          <p className="text-slate-500 text-sm font-medium mt-1 uppercase tracking-widest flex items-center gap-2">
            <GraduationCap size={14} className="text-blue-500" />
            Define levels for each institution
          </p>
        </div>
        <Button 
          onClick={handleOpenModal} 
          className="bg-slate-900 hover:bg-slate-800 text-white font-black px-6 py-6 rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-95 flex gap-2"
        >
          <Plus size={18} />
          Create Level
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 p-8 bg-white rounded-3xl border border-slate-200/60 shadow-sm space-y-8">
           <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <MapPin size={12} className="text-blue-500" />
                Select Institution
              </h3>
              <Select value={selectedCampus} onValueChange={setSelectedCampus}>
                <SelectTrigger className="h-12 bg-slate-50/50 border-slate-100 rounded-xl font-bold">
                  <SelectValue placeholder="Select Campus" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                  {campuses.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
           </div>
           
           <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Quick Search</h3>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Filter by name..." 
                  className="pl-12 h-12 bg-slate-50/50 border-slate-100 rounded-xl font-bold" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
           </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden min-h-[400px]">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="data-grid-header w-[100px]">Logic ID</TableHead>
                <TableHead className="data-grid-header">Academic Label</TableHead>
                <TableHead className="data-grid-header">Operational Site</TableHead>
                <TableHead className="data-grid-header text-right">Scope</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                      <RefreshCw className="animate-spin text-blue-500" size={32} />
                      <p className="text-xs font-black uppercase tracking-widest">Hydrating data stream...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500 gap-4">
                      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center border border-red-100">
                         <AlertCircle className="text-red-500" size={32} />
                      </div>
                      <div className="text-center">
                        <p className="font-black text-slate-900 uppercase tracking-tight">{error}</p>
                        <button 
                          onClick={() => fetchClasses(selectedCampus)}
                          className="mt-3 text-[11px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-lg"
                        >
                          Retry Protocol
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
                  <TableCell colSpan={4} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-dashed border-slate-200">
                         <GraduationCap size={32} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 italic">No levels mapped to this site</p>
                        <p className="text-[10px] font-medium uppercase tracking-widest mt-1">Add a class to begin academic tracking</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {filteredClasses.length > 0 && !loading && !error && (
            <div className="p-6 border-t border-slate-100 bg-slate-50/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Viewing <span className="text-slate-900">{(page - 1) * pageSize + 1}—{Math.min(page * pageSize, filteredClasses.length)}</span> of <span className="text-slate-900">{filteredClasses.length}</span> entries
              </p>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="rounded-lg font-bold text-xs"
                >
                  <ChevronLeft size={16} />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setPage(i + 1)}
                      className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${
                        page === i + 1 
                          ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' 
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="rounded-lg font-bold text-xs"
                >
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-8 border-none shadow-2xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader className="mb-8">
              <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">New Academic Level</DialogTitle>
              <DialogDescription className="text-slate-500 font-medium">Create a structural group for site tracking.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid gap-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Destination Site</label>
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
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Academic Designation</label>
                <Input 
                  required 
                  placeholder="e.g. Class 1, Grade 10, Nursery"
                  className="h-12 bg-slate-50 border-slate-100 rounded-xl font-bold focus:ring-4 focus:ring-blue-500/10 transition-all uppercase"
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                />
              </div>
            </div>
            <DialogFooter className="pt-8 mt-6 border-t border-slate-50">
              <Button type="submit" disabled={submitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-6 rounded-xl shadow-lg shadow-blue-100 transition-all active:scale-[0.98]">
                {submitting ? 'Authenticating...' : 'Confirm Level Entry'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
