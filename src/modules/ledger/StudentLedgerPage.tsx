import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownLeft, History, Wallet } from 'lucide-react';
import apiClient from '@/services/apiClient';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

export default function StudentLedgerPage() {
  const { studentId } = useParams();
  const [ledger, setLedger] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLedger() {
      try {
        const [ledgerRes, balanceRes] = await Promise.all([
          apiClient.get(`/fees/ledger/${studentId}`),
          apiClient.get(`/students/${studentId}/balance`) // Assuming this endpoint exists or derived
        ]);
        setLedger(ledgerRes.data);
        setBalance(balanceRes.data.balance || 0);
      } catch (error) {
        console.error('Failed to fetch ledger', error);
      } finally {
        setLoading(false);
      }
    }
    if (studentId) fetchLedger();
  }, [studentId]);

  if (loading) {
    return <div className="p-6 space-y-6"><Skeleton className="h-32 w-full" /><Skeleton className="h-[400px] w-full" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Ledger</h1>
          <p className="text-muted-foreground">Chronological financial history and balance state.</p>
        </div>
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-4 flex items-center gap-4">
            <Wallet className="h-8 w-8 opacity-50" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider opacity-70">Current Balance</p>
              <p className="text-2xl font-bold">${balance.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" /> Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledger.map((entry, idx) => {
                const isCredit = entry.entryType === 'Payment';
                return (
                  <TableRow key={idx}>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(entry.createdAt || Date.now()), 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="font-medium">{entry.month}</TableCell>
                    <TableCell>
                      <Badge variant={isCredit ? 'default' : 'outline'} className="flex w-fit items-center gap-1">
                        {isCredit ? <ArrowDownLeft className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                        {entry.entryType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{entry.status}</TableCell>
                    <TableCell className={`text-right font-mono ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                      {isCredit ? '-' : '+'}${entry.paidAmount || entry.monthlyFee || 0}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      ${entry.closingBalance.toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
