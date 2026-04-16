import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDebounce } from 'use-debounce';
import { feeApi } from '../api/feeApi';
import { paymentApi } from '../api/paymentApi';
import { unwrap, unwrapArray } from '../utils/apiHelper';
import { formatCurrency } from '../utils/format';
import { 
  Search, 
  CreditCard, 
  Loader2, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Banknote,
  Building2,
  Globe,
  History,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ErrorState } from '../components/shared/ErrorState';

const PaymentRow = React.memo(({ voucher, onPay, isProcessing }: { 
  voucher: any, 
  onPay: (voucher: any) => void,
  isProcessing: boolean
}) => (
  <tr className="hover:bg-slate-50 transition-colors group">
    <td className="px-6 py-4 text-sm font-mono text-slate-600">#{voucher.id}</td>
    <td className="px-6 py-4 text-sm font-medium text-slate-900">{voucher.studentName}</td>
    <td className="px-6 py-4 text-sm text-slate-600">{voucher.className}</td>
    <td className="px-6 py-4 text-sm font-bold text-slate-900">PKR {formatCurrency(voucher.totalAmount)}</td>
    <td className="px-6 py-4">
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        voucher.status === 'Overdue' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
      }`}>
        {voucher.status}
      </span>
    </td>
    <td className="px-6 py-4 text-right">
      <Button 
        size="sm"
        onClick={() => onPay(voucher)}
        disabled={isProcessing}
        className="text-xs font-bold shadow-sm"
      >
        {isProcessing ? <Loader2 size={14} className="animate-spin mr-1" /> : <CreditCard size={14} className="mr-1" />}
        {isProcessing ? 'Processing...' : 'Pay Now'}
      </Button>
    </td>
  </tr>
));

PaymentRow.displayName = 'PaymentRow';

export const PaymentsPage: React.FC = () => {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebounce(searchTerm, 300);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingVouchers, setProcessingVouchers] = useState<Set<number>>(new Set());

  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'Cash',
    notes: ''
  });

  const fetchUnpaidVouchers = useCallback(async () => {
    // Search optimization
    if (debouncedSearch.length > 0 && debouncedSearch.length < 2) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await feeApi.getVouchers({ status: 'unpaid,overdue', search: debouncedSearch });
      setVouchers(unwrapArray(data));
    } catch (err) {
      setError('Failed to load pending vouchers');
      toast.error('Failed to load pending vouchers');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchUnpaidVouchers();
    setPage(1);
  }, [fetchUnpaidVouchers]);

  const handlePayClick = useCallback((voucher: any) => {
    if (processingVouchers.has(voucher.id)) {
      toast.error('Payment for this voucher is already being processed');
      return;
    }
    setSelectedVoucher(voucher);
    setPaymentForm({
      amount: voucher.totalAmount.toString(),
      method: 'Cash',
      notes: ''
    });
    setIsModalOpen(true);
  }, [processingVouchers]);

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVoucher || isSubmitting) return;

    const amount = parseFloat(paymentForm.amount);
    if (amount <= 0) {
      toast.error('Amount must be greater than zero');
      return;
    }

    if (amount > selectedVoucher.totalAmount) {
      toast.error('Payment cannot exceed the due amount');
      return;
    }

    if (!window.confirm(`Record payment of PKR ${formatCurrency(amount)} via ${paymentForm.method}?`)) return;

    setIsSubmitting(true);
    setProcessingVouchers(prev => new Set(prev).add(selectedVoucher.id));
    
    try {
      await paymentApi.record({
        voucherId: selectedVoucher.id,
        amount: amount,
        paymentMethod: paymentForm.method,
        notes: paymentForm.notes,
        referenceId: `REF-${Date.now()}-${selectedVoucher.id}`
      });
      toast.success('Payment recorded successfully');
      setIsModalOpen(false);
      fetchUnpaidVouchers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
      setProcessingVouchers(prev => {
        const next = new Set(prev);
        next.delete(selectedVoucher.id);
        return next;
      });
    }
  };

  // Client-side pagination
  const paginatedVouchers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return (vouchers || []).slice(start, start + pageSize);
  }, [vouchers, page, pageSize]);

  const totalPages = Math.ceil((vouchers || []).length / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Record Payments</h1>
          <p className="text-slate-500 text-sm">Process student fee collections and record transactions</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by student name or voucher ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>
          {searchTerm.length > 0 && searchTerm.length < 2 && (
            <span className="text-xs text-amber-600 font-medium">Type at least 2 characters to search</span>
          )}
        </div>

        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-500 gap-3">
            <Loader2 className="animate-spin text-emerald-600" size={32} />
            <p className="text-sm font-medium animate-pulse">Loading pending vouchers...</p>
          </div>
        ) : error ? (
          <div className="p-8">
            <ErrorState message={error} onRetry={fetchUnpaidVouchers} />
          </div>
        ) : (vouchers || []).length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 border border-slate-100">
              <CheckCircle2 size={32} />
            </div>
            <div className="text-center">
              <p className="font-bold text-slate-900">All cleared!</p>
              <p className="text-slate-500 text-sm max-w-[240px] mt-1">No pending collections found for the current criteria.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Voucher ID</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Class</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount Due</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-medium">
                  {paginatedVouchers.map((v) => (
                    <PaymentRow 
                      key={v.id} 
                      voucher={v} 
                      onPay={handlePayClick}
                      isProcessing={processingVouchers.has(v.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
              <p className="text-sm text-slate-500 font-medium font-mono">
                Showing <span className="text-slate-900 font-bold">{(page - 1) * pageSize + 1}</span> to <span className="text-slate-900 font-bold">{Math.min(page * pageSize, (vouchers || []).length)}</span> of <span className="text-slate-900 font-bold">{(vouchers || []).length}</span> records
              </p>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="font-bold gap-1"
                >
                  <ChevronLeft size={16} /> Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setPage(i + 1)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all border ${
                        page === i + 1 
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
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
                  className="font-bold gap-1"
                >
                  Next <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Payment Modal */}
      {isModalOpen && selectedVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <h3 className="font-black text-slate-900 text-xl flex items-center gap-2">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100 shadow-sm shadow-emerald-100">
                  <Banknote className="text-emerald-600" size={22} />
                </div>
                Record Payment
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handlePaymentSubmit} className="p-8 space-y-8">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Batch ID #{selectedVoucher.id}</p>
                  <p className="text-xl font-black text-slate-900 tracking-tight">{selectedVoucher.studentName}</p>
                  <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                    <History size={12} className="text-slate-400" />
                    {selectedVoucher.className}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-1">Due Amount</p>
                  <p className="text-2xl font-black text-emerald-600 font-mono">PKR {formatCurrency(selectedVoucher.totalAmount)}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Payment Amount (PKR)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-sm">PKR</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                      className="w-full pl-14 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-0 focus:border-emerald-500 outline-none transition-all font-black text-2xl tracking-tight text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Payment Method</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'Cash', icon: Banknote, color: 'emerald' },
                      { id: 'Bank', icon: Building2, color: 'blue' },
                      { id: 'Online', icon: Globe, color: 'violet' }
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentForm({...paymentForm, method: m.id})}
                        className={`group relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 ${
                          paymentForm.method === m.id 
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl shadow-emerald-200 -translate-y-1' 
                            : 'bg-white border-slate-100 text-slate-500 hover:border-emerald-300 hover:bg-emerald-50/30'
                        }`}
                      >
                        <m.icon size={22} className={paymentForm.method === m.id ? 'text-white' : 'text-slate-400 group-hover:text-emerald-500'} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{m.id}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Notes & Reference</label>
                  <textarea
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-0 focus:border-emerald-500 outline-none transition-all resize-none h-24 text-sm font-medium placeholder:text-slate-400"
                    placeholder="Enter manual reference ID or verification notes..."
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1 py-6 rounded-2xl font-bold border-2 border-slate-100" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Discard
                </Button>
                <Button
                  type="submit"
                  loading={isSubmitting}
                  className="flex-[2] py-6 rounded-2xl font-black text-lg shadow-xl shadow-emerald-600/20 active:scale-[0.98] transition-all"
                >
                  Authorize Payment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
