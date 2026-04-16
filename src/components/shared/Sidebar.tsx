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
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm">EF</div>
          EduFlow ERP
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-8 overflow-y-auto py-4">
        {filteredNavigation.map((section) => (
          <div key={section.title} className="space-y-2">
            <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                        : 'hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <item.icon size={18} />
                  <span className="text-sm font-medium">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="px-3 py-2 mb-2">
          <p className="text-xs font-medium text-slate-400 truncate">{userContext?.name || 'User'}</p>
          <p className="text-[10px] text-slate-600 uppercase font-bold tracking-widest">
            {userRoles[0] || 'Guest'}
          </p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-md hover:bg-red-900/20 hover:text-red-400 transition-colors text-slate-400"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};
