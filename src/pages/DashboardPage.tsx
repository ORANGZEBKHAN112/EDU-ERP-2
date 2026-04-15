import React, { useEffect, useState } from 'react';
import { studentApi } from '../api/studentApi';
import { systemApi } from '../api/systemApi';
import { Users, Activity, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface DashboardStats {
  totalStudents: number;
  totalTransactionsToday: number;
  failedTransactions: number;
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
        const [studentsRes, healthRes] = await Promise.all([
          studentApi.getAll(),
          systemApi.getHealth()
        ]);

        // Assuming studentsRes is an array or has a count property
        const studentCount = Array.isArray(studentsRes) ? studentsRes.length : (studentsRes.count || 0);
        
        // Map health data - adjusting based on likely backend response structure
        const healthData = healthRes.data || healthRes;
        
        setStats({
          totalStudents: studentCount,
          totalTransactionsToday: healthData.metrics?.todayTransactions || 0,
          failedTransactions: healthData.metrics?.failedTransactions || 0,
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
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
      case 'HEALTHY': return 'text-green-600 bg-green-50 border-green-100';
      case 'DEGRADED': return 'text-orange-600 bg-orange-50 border-orange-100';
      case 'CRITICAL': return 'text-red-600 bg-red-50 border-red-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'HEALTHY': return <CheckCircle2 className="text-green-500" size={24} />;
      case 'DEGRADED': return <Activity className="text-orange-500" size={24} />;
      case 'CRITICAL': return <AlertCircle className="text-red-500" size={24} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
        <div className={`px-4 py-1.5 rounded-full border text-sm font-semibold flex items-center gap-2 ${getStatusColor(stats?.systemStatus || '')}`}>
          {getStatusIcon(stats?.systemStatus || '')}
          System: {stats?.systemStatus}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Students" 
          value={stats?.totalStudents.toLocaleString() || '0'} 
          icon={<Users className="text-blue-600" size={24} />}
          color="blue"
        />
        <StatCard 
          label="Transactions Today" 
          value={stats?.totalTransactionsToday.toLocaleString() || '0'} 
          icon={<Activity className="text-indigo-600" size={24} />}
          color="indigo"
        />
        <StatCard 
          label="Failed Events" 
          value={stats?.failedTransactions.toLocaleString() || '0'} 
          icon={<AlertCircle className="text-red-600" size={24} />}
          color="red"
        />
        <StatCard 
          label="Active Campus" 
          value="Main Campus" 
          icon={<CheckCircle2 className="text-emerald-600" size={24} />}
          color="emerald"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm h-80 flex flex-col">
          <h3 className="font-semibold text-slate-800 mb-4">Collection Trends</h3>
          <div className="flex-1 flex items-center justify-center text-slate-400 italic bg-slate-50 rounded-lg border border-dashed border-slate-200">
            Revenue Chart (Coming Soon)
          </div>
        </div>
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm h-80 flex flex-col">
          <h3 className="font-semibold text-slate-800 mb-4">System Alerts</h3>
          <div className="flex-1 flex items-center justify-center text-slate-400 italic bg-slate-50 rounded-lg border border-dashed border-slate-200">
            Recent Logs (Coming Soon)
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
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color }) => {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50',
    indigo: 'bg-indigo-50',
    red: 'bg-red-50',
    emerald: 'bg-emerald-50',
  };

  return (
    <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorMap[color] || 'bg-slate-50'}`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
};
