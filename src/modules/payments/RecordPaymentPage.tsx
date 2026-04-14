import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Search, Wallet, CheckCircle } from 'lucide-react';
import apiClient from '@/services/apiClient';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export default function RecordPaymentPage() {
  const [searchId, setSearchId] = useState('');
  const [student, setStudent] = useState<any>(null);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Cash');
  const [ref, setRef] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchId) return;
    setLoading(true);
    try {
      const [studentRes, vouchersRes] = await Promise.all([
        apiClient.get(`/students/${searchId}`),
        apiClient.get(`/fees/ledger/${searchId}`) // Using ledger to find unpaid months
      ]);
      setStudent(studentRes.data);
      // Filter for unpaid vouchers in a real app, here we just show recent
      setVouchers(vouchersRes.data.filter((v: any) => v.status !== 'Paid'));
    } catch (error) {
      toast.error('Student not found');
      setStudent(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedVoucher || !amount || !ref) {
      toast.error('Please fill all fields');
      return;
    }
    try {
      await apiClient.post('/payments/initiate', {
        voucherId: parseInt(selectedVoucher),
        amountPaid: parseFloat(amount),
        paymentMethod: method,
        transactionRef: ref
      });
      toast.success('Payment recorded successfully');
      handleSearch(); // Refresh
      setAmount('');
      setRef('');
    } catch (error) {
      toast.error('Failed to record payment');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Record Payment</h1>
          <p className="text-muted-foreground">Process student fee payments and update ledger.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Find Student</CardTitle>
            <CardDescription>Enter Student ID to fetch pending dues.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input 
                placeholder="Student ID..." 
                value={searchId} 
                onChange={(e) => setSearchId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {student && (
              <div className="pt-4 border-t space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {student.name[0]}
                  </div>
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.className} • {student.campusName}</p>
                  </div>
                </div>
                <div className="bg-muted p-3 rounded-lg flex justify-between items-center">
                  <span className="text-sm">Current Balance</span>
                  <span className="font-bold text-red-600">${student.balance || 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
            <CardDescription>Record a new transaction for the selected student.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!student ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                Search for a student to record payment
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Voucher / Month</label>
                    <Select onValueChange={setSelectedVoucher} value={selectedVoucher}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose month..." />
                      </SelectTrigger>
                      <SelectContent>
                        {vouchers.map(v => (
                          <SelectItem key={v.id} value={v.id.toString()}>
                            {v.month} - Due: ${v.closingBalance}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount to Pay</label>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      value={amount} 
                      onChange={(e) => setAmount(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Payment Method</label>
                    <Select onValueChange={setMethod} value={method}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                        <SelectItem value="Cheque">Cheque</SelectItem>
                        <SelectItem value="Online">Online</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Reference / Receipt No.</label>
                    <Input 
                      placeholder="TXN-123456" 
                      value={ref} 
                      onChange={(e) => setRef(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="md:col-span-2 pt-4">
                  <Button className="w-full h-12 text-lg" onClick={handlePayment}>
                    <CheckCircle className="mr-2 h-5 w-5" /> Confirm & Record Payment
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
