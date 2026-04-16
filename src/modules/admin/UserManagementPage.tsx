import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { UserPlus, Shield, MapPin, Mail, Search, UserX, AlertCircle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import apiClient from '@/services/apiClient';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { useAppStore } from '@/store/appStore';
import { useDebounce } from 'use-debounce';

const UserRow = React.memo(({ user }: { user: any }) => (
  <TableRow className="group cursor-default">
    <TableCell className="font-bold text-slate-900">{user.fullName}</TableCell>
    <TableCell>
      <div className="flex items-center gap-2 text-slate-500 font-medium">
        <Mail className="h-3.5 w-3.5 text-slate-400" />
        {user.email}
      </div>
    </TableCell>
    <TableCell>
      <div className="flex flex-wrap gap-1.5">
        {user.roles?.map((role: string) => (
          <Badge key={role} variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-[10px] font-bold uppercase tracking-wider px-2">
            {role}
          </Badge>
        ))}
      </div>
    </TableCell>
    <TableCell>
      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
        <MapPin className="h-3.5 w-3.5 text-slate-400" />
        {user.campusIds?.length || 0} <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">Campuses</span>
      </div>
    </TableCell>
    <TableCell>
      <Badge className={user.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-600 border-slate-200'}>
        {user.isActive ? 'Active' : 'Inactive'}
      </Badge>
    </TableCell>
  </TableRow>
));

UserRow.displayName = 'UserRow';

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const { campuses, roles, fetchCampuses, fetchRoles } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebounce(searchTerm, 300);

  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    roleNames: [] as string[],
    campusIds: [] as number[]
  });

  const fetchUsers = useCallback(async () => {
    if (debouncedSearch.length > 0 && debouncedSearch.length < 2) return;

    setLoading(true);
    setError(null);
    try {
      const usersRes = await apiClient.get('/users', { params: { search: debouncedSearch } });
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      
      // Fetch supporting data (cached)
      fetchCampuses();
      fetchRoles();
    } catch (error: any) {
      setError('Failed to load users');
      toast.error('Failed to load user management data');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, fetchCampuses, fetchRoles]);

  useEffect(() => {
    fetchUsers();
    setPage(1);
  }, [fetchUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.roleNames.length === 0) {
      toast.error('Please select at least one role');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post('/users', formData);
      toast.success('User created successfully');
      setIsModalOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleRole = useCallback((role: string) => {
    setFormData(prev => ({
      ...prev,
      roleNames: prev.roleNames.includes(role)
        ? prev.roleNames.filter(r => r !== role)
        : [...prev.roleNames, role]
    }));
  }, []);

  const toggleCampus = useCallback((id: number) => {
    setFormData(prev => ({
      ...prev,
      campusIds: prev.campusIds.includes(id)
        ? prev.campusIds.filter(cid => cid !== id)
        : [...prev.campusIds, id]
    }));
  }, []);

  // Client-side pagination
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return users.slice(start, start + pageSize);
  }, [users, page, pageSize]);

  const totalPages = Math.ceil(users.length / pageSize);

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">User Management</h1>
          <p className="text-slate-500 mt-1">Manage staff accounts, roles, and campus access.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="shadow-lg shadow-emerald-900/20">
          <UserPlus className="mr-2 h-4 w-4" /> Add New User
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search users..." 
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
              <TableHead className="w-[250px]">Full Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Campuses</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32 rounded-md" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-48 rounded-md" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24 rounded-md" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-md" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 rounded-md" /></TableCell>
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
                        onClick={fetchUsers}
                        className="mt-2 text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-2 mx-auto"
                      >
                        <RefreshCw size={16} /> Retry
                      </button>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length > 0 ? (
              paginatedUsers.map((user) => (
                <UserRow key={user.id} user={user} />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400 gap-3">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                      <UserX size={32} className="text-slate-200" />
                    </div>
                    <p className="font-medium italic">No users found in the system</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {users.length > 0 && !loading && !error && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <p className="text-sm text-slate-500 font-medium">
              Showing <span className="text-slate-900 font-bold">{(page - 1) * pageSize + 1}</span> to <span className="text-slate-900 font-bold">{Math.min(page * pageSize, users.length)}</span> of <span className="text-slate-900 font-bold">{users.length}</span> users
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
        <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
          <form onSubmit={handleSubmit}>
            <div className="p-8 bg-slate-900 text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight">Create New User</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Add a new staff member and assign their permissions.
                </DialogDescription>
              </DialogHeader>
            </div>
            <div className="p-8 space-y-6 bg-white">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500">Full Name</label>
                  <Input 
                    required 
                    placeholder="John Doe"
                    value={formData.fullName} 
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500">Email Address</label>
                  <Input 
                    type="email"
                    required 
                    placeholder="john@school.edu"
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500">Password</label>
                  <Input 
                    type="password"
                    placeholder="••••••••"
                    value={formData.password} 
                    onChange={(e) => setFormData({...formData, password: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500">Phone Number</label>
                  <Input 
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone} 
                    onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-100">
                <div className="space-y-4">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5" /> Assign Roles
                  </label>
                  <div className="grid gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    {roles.map(role => (
                      <div key={role} className="flex items-center space-x-3">
                        <Checkbox 
                          id={`role-${role}`} 
                          checked={formData.roleNames.includes(role)}
                          onCheckedChange={() => toggleRole(role)}
                        />
                        <label htmlFor={`role-${role}`} className="text-sm font-bold text-slate-700 cursor-pointer">
                          {role}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5" /> Campus Access
                  </label>
                  <div className="grid gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 max-h-[180px] overflow-y-auto">
                    {campuses.map(campus => (
                      <div key={campus.id} className="flex items-center space-x-3">
                        <Checkbox 
                          id={`campus-${campus.id}`} 
                          checked={formData.campusIds.includes(campus.id)}
                          onCheckedChange={() => toggleCampus(campus.id)}
                        />
                        <label htmlFor={`campus-${campus.id}`} className="text-sm font-bold text-slate-700 cursor-pointer">
                          {campus.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting} className="min-w-[120px]">
                Create User
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
