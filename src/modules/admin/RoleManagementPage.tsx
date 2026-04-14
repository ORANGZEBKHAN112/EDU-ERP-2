import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, Lock, CheckCircle2 } from 'lucide-react';
import apiClient from '@/services/apiClient';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function RoleManagementPage() {
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const permissions = [
    { name: 'View Students', roles: ['SuperAdmin', 'CampusAdmin', 'FinanceAdmin'] },
    { name: 'Manage Students', roles: ['SuperAdmin', 'CampusAdmin'] },
    { name: 'Generate Vouchers', roles: ['SuperAdmin', 'FinanceAdmin'] },
    { name: 'Record Payments', roles: ['SuperAdmin', 'FinanceAdmin'] },
    { name: 'Manage Campuses', roles: ['SuperAdmin'] },
    { name: 'Onboard Schools', roles: ['SuperAdmin'] },
    { name: 'System Health Access', roles: ['SuperAdmin'] },
  ];

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/roles');
      setRoles(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Role & Permissions</h1>
        <p className="text-muted-foreground">View system roles and their associated access levels.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> Available Roles
          </h2>
          <div className="grid gap-3">
            {loading ? (
              [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full" />)
            ) : (
              roles.map(role => (
                <Card key={role} className="hover:border-primary transition-colors cursor-default">
                  <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-sm font-bold">{role}</CardTitle>
                    <Lock className="h-3 w-3 text-muted-foreground" />
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" /> Permission Matrix
          </h2>
          <div className="border rounded-lg bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Permission</TableHead>
                  {roles.map(role => (
                    <TableHead key={role} className="text-center text-[10px] uppercase tracking-wider">
                      {role}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.map((perm) => (
                  <TableRow key={perm.name}>
                    <TableCell className="text-sm font-medium">{perm.name}</TableCell>
                    {roles.map(role => (
                      <TableCell key={role} className="text-center">
                        {perm.roles.includes(role) ? (
                          <div className="flex justify-center">
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                          </div>
                        ) : (
                          <div className="flex justify-center">
                            <div className="h-2 w-2 rounded-full bg-gray-200" />
                          </div>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
