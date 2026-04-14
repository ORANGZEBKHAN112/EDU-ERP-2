import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Play, Download, CheckCircle2 } from 'lucide-react';
import apiClient from '@/services/apiClient';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function FeeManagementPage() {
  const [campuses, setCampuses] = useState<any[]>([]);
  const [selectedCampus, setSelectedCampus] = useState<string>('');
  const [month, setMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function fetchCampuses() {
      try {
        const res = await apiClient.get('/campuses');
        setCampuses(res.data);
      } catch (error) {
        console.error('Failed to fetch campuses', error);
      }
    }
    fetchCampuses();
  }, []);

  const handleGenerate = async () => {
    if (!selectedCampus) {
      toast.error('Please select a campus');
      return;
    }
    setGenerating(true);
    try {
      await apiClient.post('/fees/generate-vouchers', {
        campusId: parseInt(selectedCampus),
        month
      });
      toast.success('Vouchers generated successfully');
    } catch (error) {
      toast.error('Failed to generate vouchers');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fee Management</h1>
          <p className="text-muted-foreground">Generate and manage monthly fee vouchers.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Generate Vouchers</CardTitle>
            <CardDescription>Run the monthly fee generation process.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Campus</label>
              <Select onValueChange={setSelectedCampus} value={selectedCampus}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose campus..." />
                </SelectTrigger>
                <SelectContent>
                  {campuses.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Billing Month</label>
              <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
            </div>
            <Button className="w-full" onClick={handleGenerate} disabled={generating}>
              {generating ? 'Generating...' : <><Play className="mr-2 h-4 w-4" /> Start Generation</>}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Generation Jobs</CardTitle>
            <CardDescription>Status of background fee processing tasks.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Completed At</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">MonthlyVoucherGeneration</TableCell>
                  <TableCell><Badge className="bg-green-100 text-green-800">Success</Badge></TableCell>
                  <TableCell>2026-04-01 00:05</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      {...props}
    />
  );
}
