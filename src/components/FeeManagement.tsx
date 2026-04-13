import { useState } from 'react';
import apiClient from '../services/apiClient';
import { CreditCard, Receipt, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

export default function FeeManagement() {
  const [campusId, setCampusId] = useState('1');
  const [month, setMonth] = useState('2024-04');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleGenerate = async () => {
    try {
      setProcessing(true);
      setMessage(null);
      const res = await apiClient.post('/fees/generate-vouchers', { campusId: parseInt(campusId), month });
      setMessage({ type: 'success', text: res.data.message });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to generate vouchers' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Generate Monthly Vouchers</h2>
          <p className="text-slate-500 mb-8">Run the monthly job to generate fee vouchers for all students in a campus.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Select Campus</label>
              <select 
                value={campusId}
                onChange={(e) => setCampusId(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                <option value="1">Main Campus - New York</option>
                <option value="2">Downtown Campus</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Select Month</label>
              <input 
                type="month" 
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
              />
            </div>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <span className="text-sm font-medium">{message.text}</span>
            </div>
          )}

          <button 
            onClick={handleGenerate}
            disabled={processing}
            className={`w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 hover:bg-blue-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${processing ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {processing ? 'Processing...' : 'Process Monthly Vouchers'}
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Recent Transactions</h2>
            <button className="text-sm text-blue-600 font-semibold hover:underline">View All</button>
          </div>
          <div className="p-12 text-center text-slate-400">
            <Receipt size={48} className="mx-auto mb-4 opacity-20" />
            <p>No recent transactions found for this period.</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
          <h3 className="text-lg font-bold mb-4">Fee Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Total Expected</span>
              <span className="font-bold">$45,000</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Total Collected</span>
              <span className="font-bold text-emerald-400">$32,500</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Outstanding</span>
              <span className="font-bold text-rose-400">$12,500</span>
            </div>
            <div className="pt-4 border-t border-slate-800">
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full w-[72%]" />
              </div>
              <p className="text-[10px] text-slate-500 mt-2">72% Collection Rate</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-3 rounded-xl bg-slate-50 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-all flex flex-col items-center gap-2">
              <Calendar size={18} />
              Set Due Date
            </button>
            <button className="p-3 rounded-xl bg-slate-50 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-all flex flex-col items-center gap-2">
              <CreditCard size={18} />
              Record Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
