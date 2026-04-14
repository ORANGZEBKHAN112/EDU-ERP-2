import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { UserPlus, Shield, MapPin, Mail } from 'lucide-react';
import apiClient from '@/services/apiClient';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [campuses, setCampuses] = useState<any[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    roleNames: [] as string[],
    campusIds: [] as number[]
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const usersRes = await apiClient.get('/users');
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      
      const campusesRes = await apiClient.get('/campuses');
      setCampuses(Array.isArray(campusesRes.data) ? campusesRes.data : []);
      
      const rolesRes = await apiClient.get('/roles');
      setRoles(Array.isArray(rolesRes.data) ? rolesRes.data : []);
    } catch (error: any) {
      console.error('Data loading error:', error);
      const message = error.response?.data?.message || error.message || 'Failed to load user management data';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      fetchData();
    } catch (error) {
      toast.error('Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleRole = (role: string) => {
    setFormData(prev => ({
      ...prev,
      roleNames: prev.roleNames.includes(role)
        ? prev.roleNames.filter(r => r !== role)
        : [...prev.roleNames, role]
    }));
  };

  const toggleCampus = (id: number) => {
    setFormData(prev => ({
      ...prev,
      campusIds: prev.campusIds.includes(id)
        ? prev.campusIds.filter(cid => cid !== id)
        : [...prev.campusIds, id]
    }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage staff accounts, roles, and campus access.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Full Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Campuses</TableHead>
              <TableHead>Status</TableHead>
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
            ) : users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.fullName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles?.map((role: string) => (
                        <Badge key={role} variant="outline" className="text-[10px]">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {user.campusIds?.length || 0} Campuses
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? 'default' : 'secondary'}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new staff member and assign their permissions.
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
                  <label className="text-sm font-medium">Email</label>
                  <Input 
                    type="email"
                    required 
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Password</label>
                  <Input 
                    type="password"
                    placeholder="EduFlow@123"
                    value={formData.password} 
                    onChange={(e) => setFormData({...formData, password: e.target.value})} 
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

              <div className="grid grid-cols-2 gap-6 pt-2">
                <div className="space-y-3">
                  <label className="text-sm font-bold flex items-center gap-2">
                    <Shield className="h-4 w-4" /> Roles
                  </label>
                  <div className="grid gap-2">
                    {roles.map(role => (
                      <div key={role} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`role-${role}`} 
                          checked={formData.roleNames.includes(role)}
                          onCheckedChange={() => toggleRole(role)}
                        />
                        <label htmlFor={`role-${role}`} className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          {role}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Campuses
                  </label>
                  <div className="grid gap-2 max-h-[150px] overflow-y-auto pr-2">
                    {campuses.map(campus => (
                      <div key={campus.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`campus-${campus.id}`} 
                          checked={formData.campusIds.includes(campus.id)}
                          onCheckedChange={() => toggleCampus(campus.id)}
                        />
                        <label htmlFor={`campus-${campus.id}`} className="text-sm leading-none">
                          {campus.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
