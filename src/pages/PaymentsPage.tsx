import React, { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { feeApi } from '../api/feeApi';
import { paymentApi } from '../api/paymentApi';
import { unwrap } from '../utils/apiHelper';
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
  History
} from 'lucide-react';
import { toast } from 'sonner';

export const PaymentsPage: React.FC = () => {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebounce(searchTerm, 300);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'Cash',
    notes: ''
  });

  const fetchUnpaidVouchers = async () => {
    setIsLoading(true);
    try {
      // Fetching all vouchers and filtering for unpaid/overdue on frontend for now 
      // or passing params if backend supports it
      const data = await feeApi.getVouchers({ status: 'unpaid,overdue', search: debouncedSearch });
      setVouchers(unwrap(data));
    } catch (err) {
      toast.error('Failed to load pending vouchers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnpaidVouchers();
  }, [debouncedSearch]);

  const handlePayClick = (voucher: any) => {
    setSelectedVoucher(voucher);
    setPaymentForm({
      amount: voucher.totalAmount.toString(),
      method: 'Cash',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVoucher) return;

    const amount = parseFloat(paymentForm.amount);
    if (amount <= 0) {
      toast.error('Amount must be greater than zero');
      return;
    }

    if (amount > selectedVoucher.totalAmount) {
      toast.error('Payment cannot exceed the due amount');
      return;
    }

    if (!window.confirm(`Record payment of $${amount} via ${paymentForm.method}?`)) return;

    setIsSubmitting(true);
    try {
      await paymentApi.record({
        voucherId: selectedVoucher.id,
        amount: amount,
        paymentMethod: paymentForm.method,
        notes: paymentForm.notes
      });
      toast.success('Payment recorded successfully');
      setIsModalOpen(false);
      fetchUnpaidVouchers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

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
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-500 gap-3">
            <Loader2 className="animate-spin text-blue-600" size={32} />
            <p className="text-sm font-medium">Loading pending vouchers...</p>
          </div>
        ) : vouchers.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-400 gap-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
              <CheckCircle2 size={32} />
            </div>
            <div className="text-center">
              <p className="font-medium text-slate-600">No pending vouchers</p>
              <p className="text-sm">All students have cleared their dues or no vouchers generated.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Voucher ID</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount Due</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {vouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 text-sm font-mono text-slate-600">#{v.id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{v.studentName}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{v.className}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">${v.totalAmount}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        v.status === 'Overdue' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handlePayClick(v)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm flex items-center gap-1 ml-auto"
                      >
                        <CreditCard size={14} />
                        Pay Now
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {isModalOpen && selectedVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Banknote className="text-blue-600" size={20} />
                Record Payment
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-6">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex justify-between items-center">
                <div>
                  <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Voucher #{selectedVoucher.id}</p>
                  <p className="text-lg font-bold text-slate-900">{selectedVoucher.studentName}</p>
                  <p className="text-sm text-slate-500">{selectedVoucher.className}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 font-medium">Amount Due</p>
                  <p className="text-2xl font-black text-blue-600">${selectedVoucher.totalAmount}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Payment Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-semibold text-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Payment Method</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'Cash', icon: Banknote },
                      { id: 'Bank', icon: Building2 },
                      { id: 'Online', icon: Globe }
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentForm({...paymentForm, method: m.id})}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                          paymentForm.method === m.id 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' 
                            : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                        }`}
                      >
                        <m.icon size={20} />
                        <span className="text-xs font-bold">{m.id}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Notes (Optional)</label>
                  <textarea
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none h-20 text-sm"
                    placeholder="Reference number, check details, etc."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
