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
  LogOut
} from 'lucide-react';
import { useAuthStore } from '../../app/authStore';
import { useAuthContextStore } from '../../store/authContextStore';
import { canAccess } from '../../utils/rbac';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['SuperAdmin', 'Admin', 'Principal', 'Teacher'] },
  { icon: Building2, label: 'Tenants', path: '/tenants', roles: ['SuperAdmin'] },
  { icon: MapPin, label: 'Campuses', path: '/campuses', roles: ['SuperAdmin', 'Admin'] },
  { icon: UserCog, label: 'Users', path: '/users', roles: ['SuperAdmin'] },
  { icon: Users, label: 'Students', path: '/students', roles: ['SuperAdmin', 'Admin', 'Principal', 'Teacher'] },
  { icon: CreditCard, label: 'Fees', path: '/fees', roles: ['SuperAdmin', 'Admin'] },
  { icon: Receipt, label: 'Payments', path: '/payments', roles: ['SuperAdmin', 'Admin'] },
  { icon: History, label: 'Fee History', path: '/ledger', roles: ['SuperAdmin', 'Admin'] },
  { icon: Activity, label: 'System Status', path: '/system-health', roles: ['SuperAdmin'] },
];

export const Sidebar: React.FC = () => {
  const logout = useAuthStore((state) => state.logout);
  const userContext = useAuthContextStore((state) => state.user);

  const filteredItems = menuItems.filter(item => canAccess(userContext, item.roles));

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm">EF</div>
          EduFlow ERP
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <item.icon size={20} />
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 w-full text-left rounded-md hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut size={20} />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};
