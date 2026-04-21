import React, { useEffect, useState } from 'react';
import { dashboardApi } from '../api/dashboardApi';
import { systemApi } from '../api/systemApi';
import { unwrap } from '../utils/apiHelper';
import { useAuthContextStore } from '../store/authContextStore';
import { Users, Activity, AlertCircle, CheckCircle2, Loader2, Banknote, Receipt, LayoutGrid } from 'lucide-react';

interface DashboardStats {
  totalStudents: number;
  totalRevenue: number;
  pendingFees: number;
  activeClasses: number;
  systemStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
}

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const user = useAuthContextStore.getState().user;
        const isSuperAdmin = user.roles.some(r => r.toLowerCase() === 'superadmin');
        const campusIds = useAuthContextStore.getState().campusIds;

        const [statsRes, healthRes] = await Promise.all([
          isSuperAdmin 
            ? dashboardApi.getSuperAdminStats() 
            : dashboardApi.getCampusStats(campusIds[0]),
          systemApi.getHealth()
        ]);

        const statsData = unwrap(statsRes);
        const healthData = unwrap(healthRes);
        
        setStats({
          totalStudents: statsData.totalStudents || statsData.totalStudentsCount || 0,
          totalRevenue: statsData.totalRevenue || statsData.campusRevenue || 0,
          pendingFees: statsData.totalPendingDues || statsData.pendingDues || 0,
          activeClasses: statsData.totalClasses || 0,
          systemStatus: healthData.status === 'ok' ? 'HEALTHY' : (healthData.status === 'error' ? 'CRITICAL' : 'DEGRADED')
        });
      } catch (err: any) {
        console.error('Dashboard fetch error:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center mb-8">
          <div className="h-8 w-48 bg-slate-200 animate-pulse rounded-lg"></div>
          <div className="h-8 w-32 bg-slate-200 animate-pulse rounded-full"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-white rounded-xl border border-slate-100 animate-pulse shadow-sm"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-100 rounded-xl text-red-600 flex items-center gap-3">
        <AlertCircle size={20} />
        <p>{error}</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'DEGRADED': return 'text-orange-600 bg-orange-50 border-orange-100';
      case 'CRITICAL': return 'text-red-600 bg-red-50 border-red-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'HEALTHY': return <CheckCircle2 className="text-emerald-500" size={20} />;
      case 'DEGRADED': return <Activity className="text-orange-500" size={20} />;
      case 'CRITICAL': return <AlertCircle className="text-red-500" size={20} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-10 p-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <LayoutGrid className="text-blue-600" size={32} />
            Command Center
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-2 flex items-center gap-2 italic">
            <Activity size={14} className="text-emerald-500" />
            Live system monitoring and school oversight
          </p>
        </div>
        <div className={`px-5 py-2.5 rounded-xl border text-[11px] font-black flex items-center gap-2.5 shadow-sm transition-all duration-500 hover:scale-105 ${getStatusColor(stats?.systemStatus || '')}`}>
          {getStatusIcon(stats?.systemStatus || '')}
          SYSTEM STATUS: {stats?.systemStatus}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard 
          label="Student Registry" 
          value={stats?.totalStudents.toLocaleString() || '0'} 
          icon={<Users size={20} />}
          color="blue"
          trend="+12% from last term"
        />
        <StatCard 
          label="Gross Revenue" 
          value={`$${stats?.totalRevenue.toLocaleString()}`} 
          icon={<Banknote size={20} />}
          color="emerald"
          trend="Real-time collection"
        />
        <StatCard 
          label="Unpaid Dues" 
          value={`$${stats?.pendingFees.toLocaleString()}`} 
          icon={<Receipt size={20} />}
          color="orange"
          trend="Requires action"
        />
        <StatCard 
          label="Active Groups" 
          value={stats?.activeClasses.toString() || '0'} 
          icon={<LayoutGrid size={20} />}
          color="indigo"
          trend="Classes & Sections"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 journalist-card p-8 min-h-[450px] flex flex-col bg-white border border-slate-200/60 rounded-3xl shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
             <Activity size={200} className="text-slate-900" />
          </div>
          <div className="flex items-center justify-between mb-10 relative z-10">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Revenue Analytics</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Institutional Cashflow</p>
            </div>
            <div className="flex gap-2">
              {['7D', '30D', '90D'].map(period => (
                <button key={period} className={`text-[10px] font-black px-3 py-1.5 rounded-lg border transition-all ${period === '30D' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'}`}>
                  {period}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100 relative z-10">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 rotate-3 transition-transform hover:rotate-0 duration-500">
              <Activity size={28} className="text-blue-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-900">Processing Stream Data...</p>
              <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-widest leading-relaxed">Visual intelligence components <br/>loading across all campuses</p>
            </div>
          </div>
        </div>

        <div className="p-8 bg-white rounded-3xl border border-slate-200/60 shadow-sm min-h-[450px] flex flex-col">
          <div className="mb-10">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Live Intelligence</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Chronological Events</p>
          </div>
          <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex gap-4 items-start p-4 rounded-2xl bg-white hover:bg-slate-50 transition-all duration-300 border border-slate-50 hover:border-slate-200 hover:translate-x-1 group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500 group-hover:rotate-12 ${i % 2 === 0 ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  {i % 2 === 0 ? <Receipt size={18} /> : <CheckCircle2 size={18} />}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-slate-900 truncate">
                    {i % 2 === 0 ? 'Voucher Generated' : 'Fee Recorded'}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                    {i % 2 === 0 ? 'Batch #941 processing' : 'Student ADM-1029 payment processed'}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest italic">{i*3} minutes ago</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: 'blue' | 'emerald' | 'orange' | 'indigo';
  trend?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color, trend }) => {
  const colorStyles = {
    blue: { bg: 'bg-blue-50/50', text: 'text-blue-600', border: 'border-blue-100/50', iconBg: 'bg-blue-600', iconText: 'text-white' },
    emerald: { bg: 'bg-emerald-50/50', text: 'text-emerald-600', border: 'border-emerald-100/50', iconBg: 'bg-emerald-600', iconText: 'text-white' },
    orange: { bg: 'bg-orange-50/50', text: 'text-orange-600', border: 'border-orange-100/50', iconBg: 'bg-orange-600', iconText: 'text-white' },
    indigo: { bg: 'bg-indigo-50/50', text: 'text-indigo-600', border: 'border-indigo-100/50', iconBg: 'bg-indigo-600', iconText: 'text-white' },
  };

  const style = colorStyles[color];

  return (
    <div className="relative p-8 bg-white rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-500 group overflow-hidden">
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full ${style.bg} blur-2xl transition-all duration-700 group-hover:scale-150`}></div>
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-8">
          <div className={`p-3 rounded-2xl ${style.iconBg} ${style.iconText} shadow-lg shadow-current/10 transition-transform duration-500 group-hover:-rotate-12`}>
            {icon}
          </div>
          {trend && (
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{trend}</span>
          )}
        </div>
        
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">{label}</p>
          <div className="flex items-baseline gap-1">
             <p className="text-4xl font-black text-slate-900 tracking-tight">{value}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
