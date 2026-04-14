import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Edit, MoreHorizontal, MapPin, ShieldCheck } from 'lucide-react';
import apiClient from '@/services/apiClient';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export default function CampusListPage() {
  const [campuses, setCampuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampus, setEditingCampus] = useState<any>(null);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    city: '',
    state: '',
    address: '',
    financeAdminUserId: '',
    schoolId: user?.schoolId || 1
  });

  const fetchCampuses = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/campuses');
      setCampuses(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to fetch campuses', error);
      toast.error('Failed to load campuses');
      setCampuses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampuses();
  }, []);

  const handleOpenModal = (campus: any = null) => {
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campuses</h1>
          <p className="text-muted-foreground">Manage school campuses and physical locations.</p>
        </div>
        {user?.roles?.includes('SuperAdmin') && (
          <Button onClick={() => handleOpenModal()}>
            <Plus className="mr-2 h-4 w-4" /> Add Campus
          </Button>
        )}
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campus Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Finance Admin ID</TableHead>
              <TableHead>Status</TableHead>
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
            ) : campuses.length > 0 ? (
              campuses.map((campus) => (
                <TableRow key={campus.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-primary/5 rounded-md">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      {campus.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{campus.city}, {campus.state}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs font-mono">{campus.financeAdminUserId || 'Not Assigned'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={campus.isActive ? 'default' : 'secondary'}>
                      {campus.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {user?.roles?.includes('SuperAdmin') && (
                      <Button variant="ghost" size="sm" onClick={() => handleOpenModal(campus)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No campuses found.
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
              <DialogTitle>{editingCampus ? 'Edit Campus' : 'Add New Campus'}</DialogTitle>
              <DialogDescription>
                Fill in the details below to {editingCampus ? 'update' : 'create'} a campus.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Campus Name</label>
                <Input 
                  required 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">City</label>
                  <Input 
                    required 
                    value={formData.city} 
                    onChange={(e) => setFormData({...formData, city: e.target.value})} 
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">State</label>
                  <Input 
                    required 
                    value={formData.state} 
                    onChange={(e) => setFormData({...formData, state: e.target.value})} 
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Address</label>
                <Input 
                  value={formData.address} 
                  onChange={(e) => setFormData({...formData, address: e.target.value})} 
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Finance Admin User ID</label>
                <Input 
                  type="number"
                  value={formData.financeAdminUserId} 
                  onChange={(e) => setFormData({...formData, financeAdminUserId: e.target.value})} 
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
