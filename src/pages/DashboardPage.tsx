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
    <div className="space-y-8 p-2">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500 text-sm mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        <div className={`px-4 py-2 rounded-full border text-xs font-bold flex items-center gap-2 shadow-sm ${getStatusColor(stats?.systemStatus || '')}`}>
          {getStatusIcon(stats?.systemStatus || '')}
          SYSTEM: {stats?.systemStatus}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Students" 
          value={stats?.totalStudents.toLocaleString() || '0'} 
          icon={<Users size={22} />}
          color="blue"
        />
        <StatCard 
          label="Total Revenue" 
          value={`$${stats?.totalRevenue.toLocaleString()}`} 
          icon={<Banknote size={22} />}
          color="emerald"
        />
        <StatCard 
          label="Pending Fees" 
          value={`$${stats?.pendingFees.toLocaleString()}`} 
          icon={<Receipt size={22} />}
          color="orange"
        />
        <StatCard 
          label="Active Classes" 
          value={stats?.activeClasses.toString() || '0'} 
          icon={<LayoutGrid size={22} />}
          color="indigo"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 bg-white rounded-2xl border border-slate-200/60 shadow-sm h-96 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800">Collection Trends</h3>
            <select className="text-xs font-bold text-slate-500 bg-slate-50 border-none rounded-lg px-2 py-1 outline-none cursor-pointer">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100">
              <Activity size={24} className="text-slate-300" />
            </div>
            <p className="text-sm font-medium italic">Revenue visualization coming soon</p>
          </div>
        </div>
        <div className="p-6 bg-white rounded-2xl border border-slate-200/60 shadow-sm h-96 flex flex-col">
          <h3 className="font-bold text-slate-800 mb-6">Recent Activity</h3>
          <div className="flex-1 space-y-4 overflow-y-auto pr-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex gap-3 items-start p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={14} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Fee Payment Recorded</p>
                  <p className="text-[10px] text-slate-500">Student #10{i} paid monthly fee</p>
                  <p className="text-[9px] text-slate-400 mt-1 uppercase font-bold tracking-wider">2 mins ago</p>
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
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color }) => {
  const colorStyles = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' },
  };

  const style = colorStyles[color];

  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${style.bg} ${style.text} ${style.border} border transition-transform group-hover:scale-110 duration-300`}>
          {icon}
        </div>
        <div className="h-1 w-8 bg-slate-100 rounded-full"></div>
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-3xl font-black text-slate-900">{value}</p>
      </div>
    </div>
  );
};
