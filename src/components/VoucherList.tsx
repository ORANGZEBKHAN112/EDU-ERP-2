import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { Receipt, Search, Filter, Download } from 'lucide-react';

export default function VoucherList() {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      // Note: The backend might not have a global /vouchers endpoint yet, 
      // but the request asks to connect to /api/vouchers.
      // If it fails, we'll handle it gracefully.
      const res = await apiClient.get('/vouchers');
      setVouchers(Array.isArray(res.data) ? res.data : []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch vouchers', err);
      setError('Failed to load vouchers. Please try again later.');
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500">Loading vouchers...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by student or voucher ID..." 
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all">
            <Filter size={18} />
            Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all">
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-100 text-sm font-medium">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <th className="px-6 py-4">Voucher ID</th>
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4">Month</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Due Date</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vouchers.map((voucher) => (
              <tr key={voucher.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-slate-500">#{voucher.id}</td>
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">{voucher.studentName || 'Student #' + voucher.studentId}</div>
                </td>
                <td className="px-6 py-4 text-slate-600">{voucher.month}</td>
                <td className="px-6 py-4 font-bold text-slate-900">${voucher.totalAmount}</td>
                <td className="px-6 py-4 text-slate-500 text-sm">{new Date(voucher.dueDate).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                    voucher.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 
                    voucher.status === 'Overdue' ? 'bg-rose-100 text-rose-700' : 
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {voucher.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-blue-600 text-sm font-bold hover:underline">View Details</button>
                </td>
              </tr>
            ))}
            {vouchers.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                  <Receipt size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No vouchers found.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
