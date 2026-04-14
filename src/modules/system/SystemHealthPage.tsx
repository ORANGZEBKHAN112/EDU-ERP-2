import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, ShieldCheck, Server, AlertTriangle, RefreshCw } from 'lucide-react';
import apiClient from '@/services/apiClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

export default function SystemHealthPage() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function fetchHealth() {
    setLoading(true);
    try {
      const res = await apiClient.get('/system/health');
      setHealth(res.data.data);
    } catch (error) {
      console.error('Failed to fetch system health', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY': return 'bg-green-100 text-green-800 border-green-200';
      case 'DEGRADED': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
          <p className="text-muted-foreground">Real-time monitoring of financial integrity and background services.</p>
        </div>
        <button 
          onClick={fetchHealth}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          disabled={loading}
        >
          <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={`border-2 ${health?.reconciliationStatus === 'HEALTHY' ? 'border-green-500/20' : 'border-red-500/20'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Financial Integrity</CardTitle>
            <ShieldCheck className={`h-4 w-4 ${health?.reconciliationStatus === 'HEALTHY' ? 'text-green-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health?.reconciliationStatus || 'UNKNOWN'}</div>
            <p className="text-xs text-muted-foreground mt-1">Based on latest reconciliation run</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ledger Consistency</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health?.ledgerConsistency || 'CHECKING...'}</div>
            <p className="text-xs text-muted-foreground mt-1">Transaction chain verification</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Transactions</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${health?.failedTransactions > 0 ? 'text-amber-500' : 'text-gray-400'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health?.failedTransactions || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Pending in recovery queue</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Background Job Status</CardTitle>
            <CardDescription>Status of distributed scheduled tasks.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Run</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {health?.backgroundJobs.map((job: any) => (
                  <TableRow key={job.name}>
                    <TableCell className="font-medium font-mono text-xs">{job.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={job.status === 'Success' ? 'text-green-600 border-green-200 bg-green-50' : 'text-red-600 border-red-200 bg-red-50'}>
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {job.lastRun ? format(new Date(job.lastRun), 'MMM dd, HH:mm') : 'Never'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Infrastructure Stats</CardTitle>
            <CardDescription>Core system entity counts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg"><Server className="h-4 w-4 text-blue-600" /></div>
                <div>
                  <p className="text-sm font-medium">Active Tenants</p>
                  <p className="text-xs text-muted-foreground">Schools currently on platform</p>
                </div>
              </div>
              <div className="text-xl font-bold">{health?.activeTenants || 0}</div>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg"><Activity className="h-4 w-4 text-purple-600" /></div>
                <div>
                  <p className="text-sm font-medium">Daily Transactions</p>
                  <p className="text-xs text-muted-foreground">Volume processed today</p>
                </div>
              </div>
              <div className="text-xl font-bold">${(health?.totalTransactionsToday || 0).toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
