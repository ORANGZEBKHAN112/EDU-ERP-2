import React, { useEffect, useState, useCallback } from 'react';
import { feeApi } from '../api/feeApi';
import { classApi } from '../api/classApi';
import { unwrapArray } from '../utils/apiHelper';
import { formatCurrency } from '../utils/format';
import { 
  Settings, 
  FileText, 
  Plus, 
  Loader2, 
  Calendar, 
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { ErrorState } from '../components/shared/ErrorState';
import { Button } from '@/components/ui/button';

export const FeesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'vouchers' | 'config'>('vouchers');
  const [classes, setClasses] = useState<any[]>([]);
  const [configs, setConfigs] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [configForm, setConfigForm] = useState({ classId: '', monthlyFee: '', transportFee: '' });
  const [genForm, setGenForm] = useState({ 
    month: new Date().getMonth() + 1, 
    year: new Date().getFullYear() 
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [classesRes, configsRes, vouchersRes] = await Promise.all([
        classApi.getAll(),
        feeApi.getConfigurations(),
        feeApi.getVouchers()
      ]);
      setClasses(unwrapArray(classesRes));
      setConfigs(unwrapArray(configsRes));
      setVouchers(unwrapArray(vouchersRes));
    } catch (err) {
      setError('Failed to load fee management data');
      toast.error('Failed to load fee data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isConfiguring) return;
    
    setIsConfiguring(true);
    try {
      await feeApi.configure({
        classId: parseInt(configForm.classId),
        monthlyFee: parseFloat(configForm.monthlyFee),
        transportFee: configForm.transportFee ? parseFloat(configForm.transportFee) : 0
      });
      toast.success('Fee structure updated');
      fetchData();
      setConfigForm({ classId: '', monthlyFee: '', transportFee: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update configuration');
    } finally {
      setIsConfiguring(false);
    }
  };

  const handleGenerateVouchers = async () => {
    if (isGenerating) return;
    if (!window.confirm(`Generate vouchers for ${genForm.month}/${genForm.year}? This action cannot be undone.`)) return;
    
    setIsGenerating(true);
    try {
      await feeApi.generateVouchers(genForm);
      toast.success('Vouchers generated successfully');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to generate vouchers');
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Paid</span>;
      case 'unpaid': return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">Unpaid</span>;
      case 'overdue': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Overdue</span>;
      default: return <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fee Management</h1>
          <p className="text-slate-500 text-sm">Configure structures and manage monthly billing</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('vouchers')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'vouchers' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Vouchers
          </button>
          <button 
            onClick={() => setActiveTab('config')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'config' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Configuration
          </button>
        </div>
      </div>

      {activeTab === 'vouchers' ? (
        <div className="space-y-6">
          {/* Generation Tool */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <Calendar size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Bulk Voucher Generation</h3>
                <p className="text-sm text-slate-500">Generate vouchers for all enrolled students</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select 
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500/20"
                value={genForm.month}
                onChange={(e) => setGenForm({...genForm, month: parseInt(e.target.value)})}
              >
                {Array.from({length: 12}, (_, i) => (
                  <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', {month: 'long'})}</option>
                ))}
              </select>
              <select 
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500/20"
                value={genForm.year}
                onChange={(e) => setGenForm({...genForm, year: parseInt(e.target.value)})}
              >
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <Button 
                onClick={handleGenerateVouchers}
                loading={isGenerating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-100"
              >
                Authorize Execution
              </Button>
            </div>
          </div>

          {/* Voucher List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">Recent Vouchers</h3>
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-slate-400" />
                <span className="text-xs font-medium text-slate-500 uppercase">Filters</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Voucher ID</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Month</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <Loader2 className="animate-spin text-blue-600 mx-auto mb-2" />
                        <span className="text-sm text-slate-500">Loading vouchers...</span>
                      </td>
                    </tr>
                  ) : (vouchers || []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                        No vouchers generated yet.
                      </td>
                    </tr>
                  ) : (
                    (vouchers || []).map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-mono text-slate-600">#{v.id}</td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-slate-900">{v.studentName}</p>
                          <p className="text-xs text-slate-500">{v.className}</p>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{v.month}/{v.year}</td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">PKR {formatCurrency(v.totalAmount)}</td>
                        <td className="px-6 py-4">{getStatusBadge(v.status)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Config Form */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-24">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Settings size={18} className="text-blue-600" />
                Configure Class Fees
              </h3>
              <form onSubmit={handleConfigSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Class</label>
                  <select 
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                    value={configForm.classId}
                    onChange={(e) => setConfigForm({...configForm, classId: e.target.value})}
                  >
                    <option value="">Select Class</option>
                    {(classes || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Monthly Fee (PKR)</label>
                  <input 
                    type="number" 
                    required
                    className="w-full px-4 py-2 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-emerald-500/50 transition-all font-bold"
                    placeholder="0.00"
                    value={configForm.monthlyFee}
                    onChange={(e) => setConfigForm({...configForm, monthlyFee: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Transport Fee (PKR)</label>
                  <input 
                    type="number" 
                    className="w-full px-4 py-2 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-emerald-500/50 transition-all font-bold"
                    placeholder="0.00"
                    value={configForm.transportFee}
                    onChange={(e) => setConfigForm({...configForm, transportFee: e.target.value})}
                  />
                </div>
                <Button 
                  type="submit"
                  loading={isConfiguring}
                  className="w-full bg-slate-900 hover:bg-black font-bold h-11 rounded-xl shadow-lg shadow-slate-200"
                >
                  Save Structure
                </Button>
              </form>
            </div>
          </div>

          {/* Config List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                <h3 className="font-semibold text-slate-800">Existing Structures</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Class</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Monthly Fee</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Transport</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(configs || []).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">No configurations found.</td>
                      </tr>
                    ) : (
                      (configs || []).map((c) => (
                        <tr key={c.classId} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-slate-900">{c.className}</td>
                          <td className="px-6 py-4 text-sm font-bold text-slate-900">PKR {formatCurrency(c.monthlyFee)}</td>
                          <td className="px-6 py-4 text-sm font-bold text-slate-900">PKR {formatCurrency(c.transportFee || 0)}</td>
                          <td className="px-6 py-4 text-sm font-black text-emerald-600 font-mono">PKR {formatCurrency(c.monthlyFee + (c.transportFee || 0))}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
