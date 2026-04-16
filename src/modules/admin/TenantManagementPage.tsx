import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Building2, Shield, CreditCard, Activity, Search, AlertCircle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import apiClient from '@/services/apiClient';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDebounce } from 'use-debounce';

const TenantRow = React.memo(({ tenant }: { tenant: any }) => (
  <TableRow>
    <TableCell className="font-medium">{tenant.name}</TableCell>
    <TableCell>{tenant.country}</TableCell>
    <TableCell>
      <Badge variant={tenant.isActive ? 'default' : 'secondary'}>
        {tenant.isActive ? 'Active' : 'Inactive'}
      </Badge>
    </TableCell>
    <TableCell>{new Date(tenant.createdAt).toLocaleDateString()}</TableCell>
    <TableCell className="text-right">
      <Button variant="ghost" size="sm">
        <CreditCard className="h-4 w-4 mr-2" /> Billing
      </Button>
    </TableCell>
  </TableRow>
));

TenantRow.displayName = 'TenantRow';

export default function TenantManagementPage() {
  const [tenants, setTenants] = useState<any[]>([]);
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
    schoolName: '',
    country: 'Pakistan',
    adminName: '',
    adminEmail: '',
    adminPhone: '',
    planType: 'Basic'
  });

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/tenants');
      setTenants(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      setError('Failed to load tenants');
      toast.error('Failed to load tenants');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/tenants/create', formData);
      toast.success('Tenant onboarded successfully');
      setIsModalOpen(false);
      fetchTenants();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to onboard tenant';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Client-side filtering and pagination
  const filteredTenants = useMemo(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) return tenants;
    return tenants.filter(t => 
      t.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [tenants, debouncedSearch]);

  const paginatedTenants = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTenants.slice(start, start + pageSize);
  }, [filteredTenants, page, pageSize]);

  const totalPages = Math.ceil(filteredTenants.length / pageSize);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenant Management</h1>
          <p className="text-muted-foreground">Manage schools, subscriptions, and onboarding.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Onboard School
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenants.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenants.filter(t => t.isActive).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Healthy</div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search schools..." 
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
              <TableHead>School Name</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [1, 2, 3].map((i) => (
                <TableRow key={i}>
                  {[1, 2, 3, 4, 5].map((j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
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
                        onClick={fetchTenants}
                        className="mt-2 text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-2 mx-auto"
                      >
                        <RefreshCw size={16} /> Retry
                      </button>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : paginatedTenants.length > 0 ? (
              paginatedTenants.map((tenant) => (
                <TenantRow key={tenant.id} tenant={tenant} />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No schools found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {filteredTenants.length > 0 && !loading && !error && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <p className="text-sm text-slate-500 font-medium">
              Showing <span className="text-slate-900 font-bold">{(page - 1) * pageSize + 1}</span> to <span className="text-slate-900 font-bold">{Math.min(page * pageSize, filteredTenants.length)}</span> of <span className="text-slate-900 font-bold">{filteredTenants.length}</span> schools
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
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Onboard New School</DialogTitle>
              <DialogDescription>
                This will create a new school, main campus, and super admin account.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">School Name</label>
                  <Input 
                    required 
                    value={formData.schoolName} 
                    onChange={(e) => setFormData({...formData, schoolName: e.target.value})} 
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Plan Type</label>
                  <Select 
                    value={formData.planType} 
                    onValueChange={(val: any) => setFormData({...formData, planType: val})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Basic">Basic</SelectItem>
                      <SelectItem value="Pro">Pro</SelectItem>
                      <SelectItem value="Enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Admin Name</label>
                <Input 
                  required 
                  value={formData.adminName} 
                  onChange={(e) => setFormData({...formData, adminName: e.target.value})} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Admin Email</label>
                  <Input 
                    type="email"
                    required 
                    value={formData.adminEmail} 
                    onChange={(e) => setFormData({...formData, adminEmail: e.target.value})} 
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Admin Phone</label>
                  <Input 
                    required 
                    value={formData.adminPhone} 
                    onChange={(e) => setFormData({...formData, adminPhone: e.target.value})} 
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Onboarding...' : 'Create School'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
