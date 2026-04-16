import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Edit, MapPin, ShieldCheck, Search, Map, AlertCircle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import apiClient from '@/services/apiClient';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useDebounce } from 'use-debounce';

const CampusRow = React.memo(({ campus, onEdit, canEdit }: { 
  campus: any, 
  onEdit: (campus: any) => void,
  canEdit: boolean
}) => (
  <TableRow className="group cursor-default">
    <TableCell>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100 transition-transform group-hover:scale-110">
          <MapPin className="h-4 w-4 text-emerald-600" />
        </div>
        <span className="font-bold text-slate-900">{campus.name}</span>
      </div>
    </TableCell>
    <TableCell>
      <span className="text-sm font-medium text-slate-500">{campus.city}, {campus.state}</span>
    </TableCell>
    <TableCell>
      <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
        <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
        {campus.financeAdminUserId ? `ID: ${campus.financeAdminUserId}` : <span className="text-slate-400 font-medium italic">Not Assigned</span>}
      </div>
    </TableCell>
    <TableCell>
      <Badge className={campus.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-600 border-slate-200'}>
        {campus.isActive ? 'Active' : 'Inactive'}
      </Badge>
    </TableCell>
    <TableCell className="text-right">
      {canEdit && (
        <Button variant="ghost" size="icon" onClick={() => onEdit(campus)} className="h-8 w-8 hover:bg-emerald-50 hover:text-emerald-600">
          <Edit className="h-4 w-4" />
        </Button>
      )}
    </TableCell>
  </TableRow>
));

CampusRow.displayName = 'CampusRow';

export default function CampusListPage() {
  const [campuses, setCampuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingCampus, setEditingCampus] = useState<any>(null);
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebounce(searchTerm, 300);

  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [formData, setFormData] = useState({
    name: '',
    city: '',
    state: '',
    address: '',
    financeAdminUserId: '',
    schoolId: user?.schoolId || 1
  });

  const fetchCampuses = useCallback(async () => {
    if (debouncedSearch.length > 0 && debouncedSearch.length < 2) return;

    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/campuses', { params: { search: debouncedSearch } });
      setCampuses(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      setError('Failed to load campuses');
      toast.error('Failed to load campuses');
      setCampuses([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchCampuses();
    setPage(1);
  }, [fetchCampuses]);

  const handleOpenModal = useCallback((campus: any = null) => {
    if (campus) {
      setEditingCampus(campus);
      setFormData({
        name: campus.name,
        city: campus.city,
        state: campus.state,
        address: campus.address,
        financeAdminUserId: campus.financeAdminUserId?.toString() || '',
        schoolId: campus.schoolId
      });
    } else {
      setEditingCampus(null);
      setFormData({
        name: '',
        city: '',
        state: '',
        address: '',
        financeAdminUserId: '',
        schoolId: user?.schoolId || 1
      });
    }
    setIsModalOpen(true);
  }, [user?.schoolId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        financeAdminUserId: formData.financeAdminUserId ? parseInt(formData.financeAdminUserId) : null
      };

      if (editingCampus) {
        await apiClient.put(`/campuses/${editingCampus.id}`, payload);
        toast.success('Campus updated successfully');
      } else {
        await apiClient.post('/campuses', payload);
        toast.success('Campus created successfully');
      }
      setIsModalOpen(false);
      fetchCampuses();
    } catch (error) {
      toast.error('Failed to save campus');
    } finally {
      setSubmitting(false);
    }
  };

  // Client-side pagination
  const paginatedCampuses = useMemo(() => {
    const start = (page - 1) * pageSize;
    return campuses.slice(start, start + pageSize);
  }, [campuses, page, pageSize]);

  const totalPages = Math.ceil(campuses.length / pageSize);

  const canEdit = !!user?.roles?.includes('SuperAdmin');

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Campuses</h1>
          <p className="text-slate-500 mt-1">Manage school campuses and physical locations.</p>
        </div>
        {canEdit && (
          <Button onClick={() => handleOpenModal()} className="shadow-lg shadow-emerald-900/20">
            <Plus className="mr-2 h-4 w-4" /> Add New Campus
          </Button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search campuses..." 
              className="pl-9 bg-white h-9" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {searchTerm.length > 0 && searchTerm.length < 2 && (
            <span className="text-xs text-amber-600 font-medium">Type at least 2 characters to search</span>
          )}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Campus Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Finance Admin</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [1, 2, 3, 4].map((i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-48 rounded-md" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-32 rounded-md" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24 rounded-md" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-md" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-md ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-500 gap-4">
                    <AlertCircle className="text-red-500" size={32} />
                    <div className="text-center">
                      <p className="font-medium text-slate-900">{error}</p>
                      <button 
                        onClick={fetchCampuses}
                        className="mt-2 text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-2 mx-auto"
                      >
                        <RefreshCw size={16} /> Retry
                      </button>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : campuses.length > 0 ? (
              paginatedCampuses.map((campus) => (
                <CampusRow 
                  key={campus.id} 
                  campus={campus} 
                  onEdit={handleOpenModal} 
                  canEdit={canEdit}
                />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400 gap-3">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                      <Map size={32} className="text-slate-200" />
                    </div>
                    <p className="font-medium italic">No campuses registered yet</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {campuses.length > 0 && !loading && !error && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <p className="text-sm text-slate-500 font-medium">
              Showing <span className="text-slate-900 font-bold">{(page - 1) * pageSize + 1}</span> to <span className="text-slate-900 font-bold">{Math.min(page * pageSize, campuses.length)}</span> of <span className="text-slate-900 font-bold">{campuses.length}</span> campuses
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
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
          <form onSubmit={handleSubmit}>
            <div className="p-8 bg-slate-900 text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight">{editingCampus ? 'Edit Campus' : 'Add New Campus'}</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Fill in the details below to {editingCampus ? 'update' : 'create'} a campus.
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="p-8 space-y-6 bg-white">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Campus Name</label>
                <Input 
                  required 
                  placeholder="Main Campus"
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500">City</label>
                  <Input 
                    required 
                    placeholder="New York"
                    value={formData.city} 
                    onChange={(e) => setFormData({...formData, city: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500">State</label>
                  <Input 
                    required 
                    placeholder="NY"
                    value={formData.state} 
                    onChange={(e) => setFormData({...formData, state: e.target.value})} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Full Address</label>
                <Input 
                  placeholder="123 Education St, Suite 100"
                  value={formData.address} 
                  onChange={(e) => setFormData({...formData, address: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Finance Admin User ID</label>
                <Input 
                  type="number"
                  placeholder="Enter User ID"
                  value={formData.financeAdminUserId} 
                  onChange={(e) => setFormData({...formData, financeAdminUserId: e.target.value})} 
                />
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting} className="min-w-[120px]">
                {editingCampus ? 'Update Campus' : 'Create Campus'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
