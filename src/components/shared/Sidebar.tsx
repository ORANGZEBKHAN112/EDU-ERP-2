import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Receipt, 
  History, 
  Activity,
  Building2,
  MapPin,
  GraduationCap,
  UserCog,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { useAuthStore } from '../../app/authStore';
import { useAuthContextStore } from '../../store/authContextStore';
import { canAccess } from '../../utils/rbac';

interface MenuItem {
  icon: any;
  label: string;
  path: string;
  roles: string[];
}

interface NavSection {
  title: string;
  items: MenuItem[];
}

const navigation: NavSection[] = [
  {
    title: 'MAIN',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['SuperAdmin', 'Admin', 'Teacher', 'Accountant', 'FinanceAdmin', 'CampusAdmin', 'Principal'] },
      { icon: Users, label: 'Students', path: '/students', roles: ['SuperAdmin', 'Admin', 'Teacher', 'CampusAdmin', 'Principal'] },
      { icon: CreditCard, label: 'Fees', path: '/fees', roles: ['SuperAdmin', 'Admin', 'Accountant', 'FinanceAdmin'] },
      { icon: Receipt, label: 'Payments', path: '/payments', roles: ['SuperAdmin', 'Admin', 'Accountant', 'FinanceAdmin'] },
    ]
  },
  {
    title: 'MANAGEMENT',
    items: [
      { icon: Building2, label: 'Schools', path: '/tenants', roles: ['SuperAdmin'] },
      { icon: MapPin, label: 'Campuses', path: '/campuses', roles: ['SuperAdmin', 'Admin'] },
      { icon: GraduationCap, label: 'Classes', path: '/classes', roles: ['SuperAdmin', 'Admin', 'CampusAdmin', 'Principal'] },
      { icon: UserCog, label: 'Users', path: '/users', roles: ['SuperAdmin'] },
    ]
  },
  {
    title: 'FINANCE',
    items: [
      { icon: History, label: 'Fee Ledger', path: '/ledger', roles: ['SuperAdmin', 'Admin', 'Accountant', 'FinanceAdmin'] },
    ]
  },
  {
    title: 'SYSTEM',
    items: [
      { icon: Activity, label: 'System Status', path: '/system-health', roles: ['SuperAdmin'] },
      { icon: ShieldCheck, label: 'Audit Trail', path: '/audit-logs', roles: ['SuperAdmin', 'FinanceAdmin'] },
    ]
  }
];

export const Sidebar: React.FC = () => {
  const logout = useAuthStore((state) => state.logout);
  const userContext = useAuthContextStore((state) => state.user);

  // Safe role extraction with fallback
  const userRoles = userContext?.roles || [];

  const filteredNavigation = navigation.map(section => ({
    ...section,
    items: section.items.filter(item => item.roles.some(role => userRoles.includes(role)))
  })).filter(section => section.items.length > 0);

  return (
    <aside className="w-64 bg-slate-950 text-slate-400 flex flex-col h-screen sticky top-0 border-r border-slate-900 shadow-2xl">
      <div className="p-8">
        <h1 className="text-lg font-black text-white tracking-widest flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-sm flex items-center justify-center text-xs shadow-[0_0_15px_rgba(37,99,235,0.45)]">EF</div>
          EDUFLOW
        </h1>
        <p className="text-[10px] text-slate-600 font-bold tracking-[0.2em] mt-2 translate-x-1">MISSION CONTROL</p>
      </div>

      <nav className="flex-1 px-4 space-y-9 overflow-y-auto py-2">
        {filteredNavigation.map((section) => (
          <div key={section.title} className="space-y-3">
            <h3 className="px-4 text-[9px] font-black text-slate-700 uppercase tracking-[0.25em]">
              {section.title}
            </h3>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-300 group ${
                      isActive 
                        ? 'bg-slate-900 text-blue-400 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] border border-slate-800' 
                        : 'hover:text-white hover:translate-x-1'
                    }`
                  }
                >
                  {({ isActive }: { isActive: boolean }) => (
                    <>
                      <item.icon size={16} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-blue-500' : 'group-hover:text-blue-400'} />
                      <span className={`text-[13px] font-semibold tracking-tight transition-colors ${isActive ? 'text-slate-100' : ''}`}>
                        {item.label}
                      </span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-6 bg-slate-950/50 border-t border-slate-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs">
            {userContext?.name?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-slate-200 truncate">{userContext?.name || 'User'}</p>
            <p className="text-[9px] text-blue-500/80 uppercase font-black tracking-widest mt-0.5">
              {userRoles[0] || 'Guest'}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-2.5 w-full text-left rounded-lg group hover:bg-red-500/10 transition-all duration-300 text-slate-500 hover:text-red-400 border border-transparent hover:border-red-500/20"
        >
          <LogOut size={16} className="group-hover:translate-x-0.5 transition-transform" />
          <span className="text-[13px] font-bold">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
