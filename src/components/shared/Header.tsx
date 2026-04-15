import React from 'react';
import { useAuthStore } from '../../app/authStore';
import { Bell, User as UserIcon, LogOut } from 'lucide-react';

export const Header: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-slate-800">Welcome back, {user?.fullName}</h2>
      </div>

      <div className="flex items-center gap-6">
        <button className="text-slate-500 hover:text-slate-800 transition-colors relative">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">{user?.fullName}</p>
            <p className="text-xs text-slate-500">{user?.roles?.[0] || 'User'}</p>
          </div>
          <button 
            onClick={logout}
            className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};
