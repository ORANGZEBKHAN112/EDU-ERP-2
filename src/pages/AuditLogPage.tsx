import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  User, 
  Clock, 
  Activity, 
  Search, 
  Filter,
  ArrowRight,
  Database,
  Lock,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '../utils/format';

interface AuditLog {
  id: string;
  action: string;
  user: string;
  role: string;
  timestamp: string;
  details: string;
  status: 'Success' | 'Warning' | 'Critical';
  module: string;
}

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mocking audit logs as requested
    const mockLogs: AuditLog[] = [
      {
        id: 'LOG-8821',
        action: 'Payment Recorded',
        user: 'Orangzeb K.',
        role: 'FinanceAdmin',
        timestamp: new Date().toISOString(),
        details: 'Fee payment of PKR 15,000 for Student ID #2024-001 recorded via Cash.',
        status: 'Success',
        module: 'Finance'
      },
      {
        id: 'LOG-8822',
        action: 'Voucher Generation',
        user: 'System Scheduler',
        role: 'System',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        details: 'Automated monthly fee vouchers generated for 450 students in Main Campus.',
        status: 'Success',
        module: 'Fees'
      },
      {
        id: 'LOG-8823',
        action: 'User Profile Updated',
        user: 'Admin Support',
        role: 'SuperAdmin',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        details: 'Updated permission set for User ID #admin-4. Access level increased.',
        status: 'Warning',
        module: 'Identity'
      },
      {
        id: 'LOG-8824',
        action: 'Failed Login Attempt',
        user: 'Unknown (IP: 192.168.1.45)',
        role: 'Guest',
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        details: 'Too many failed login attempts for email: test@school.pk. IP temporary blocked.',
        status: 'Critical',
        module: 'Security'
      },
      {
        id: 'LOG-8825',
        action: 'Scholarship Applied',
        user: 'Finance Manager',
        role: 'FinanceAdmin',
        timestamp: new Date(Date.now() - 14400000).toISOString(),
        details: 'Applied 25% Merit Scholarship to Student ID #2024-089. Authorization confirmed.',
        status: 'Success',
        module: 'Finance'
      }
    ];

    const timer = setTimeout(() => {
      setLogs(mockLogs);
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Success': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Warning': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Critical': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 text-white rounded-lg">
              <ShieldCheck size={24} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Audit Trail</h1>
          </div>
          <p className="text-slate-500 font-medium">Monitoring system activity and financial record integrity.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="font-bold gap-2">
            <Download size={16} /> Export Logs
          </Button>
          <Button className="bg-slate-900 hover:bg-black font-bold gap-2">
            <Lock size={16} /> Security Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Events', value: '45.2k', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Security Alerts', value: '12', icon: ShieldCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Admin Actions', value: '156', icon: User, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Uptime', value: '99.99%', icon: Clock, color: 'text-violet-600', bg: 'bg-violet-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className={`p-3 w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4 border border-slate-50`}>
              <stat.icon size={24} />
            </div>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">{stat.label}</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search audit records..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-medium text-sm"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button variant="outline" className="flex-1 md:flex-none font-bold gap-2 rounded-xl">
              <Filter size={16} /> Filter
            </Button>
            <Button variant="outline" className="flex-1 md:flex-none font-bold gap-2 rounded-xl">
              <Database size={16} /> All Sources
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Timestamp</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Action</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operator</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Details</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-8 py-6"><div className="h-6 bg-slate-100 rounded-lg w-full"></div></td>
                  </tr>
                ))
              ) : logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors group cursor-default">
                  <td className="px-8 py-6 text-sm text-slate-400 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-slate-900 font-bold">{log.action}</span>
                      <span className="text-[10px] text-slate-400 uppercase">{log.module}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs ring-2 ring-white">
                        {log.user.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-900 font-bold text-sm tracking-tight">{log.user}</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest">{log.role}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 max-w-xs xl:max-w-md">
                    <p className="text-slate-500 text-sm leading-relaxed truncate group-hover:whitespace-normal group-hover:overflow-visible group-hover:z-10 bg-transparent group-hover:bg-white transition-all">
                      {log.details}
                    </p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <Badge variant="outline" className={`font-black rounded-lg ${getStatusColor(log.status)} shadow-sm`}>
                      {log.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-6 bg-slate-50/50 border-t border-slate-50 text-center">
          <Button variant="ghost" className="text-slate-400 hover:text-slate-900 font-bold gap-2">
            View Pagination Controls <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};
