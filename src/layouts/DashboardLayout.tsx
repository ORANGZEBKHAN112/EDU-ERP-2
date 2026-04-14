import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Receipt, 
  History, 
  Activity, 
  LogOut,
  ChevronRight,
  School,
  Building2,
  ShieldCheck,
  Shield,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Toaster } from '@/components/ui/sonner';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Students', path: '/students', icon: Users },
  { name: 'Campuses', path: '/campuses', icon: School },
  { name: 'Fees', path: '/fees', icon: Receipt },
  { name: 'Payments', path: '/payments', icon: History },
  { name: 'System Health', path: '/system-health', icon: Activity },
];

const adminItems = [
  { name: 'Schools', path: '/admin/tenants', icon: Building2 },
  { name: 'Users', path: '/admin/users', icon: ShieldCheck },
  { name: 'Roles', path: '/admin/roles', icon: Shield },
  { name: 'Classes', path: '/admin/classes', icon: GraduationCap },
];

export default function DashboardLayout() {
  const { logout, user } = useAuth();
  const location = useLocation();

  const isSuperAdmin = user?.roles?.includes('SuperAdmin');

  return (
    <div className="flex h-screen bg-gray-50/50">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-white flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b">
          <div className="bg-primary p-2 rounded-lg">
            <School className="h-6 w-6 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">EduFlow</span>
        </div>

        <ScrollArea className="flex-1 px-4 py-6">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                    isActive 
                      ? 'bg-primary/10 text-primary font-medium' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  {isActive && <ChevronRight className="h-3 w-3" />}
                </Link>
              );
            })}
          </nav>

          {isSuperAdmin && (
            <div className="mt-8">
              <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Admin Control</p>
              <nav className="space-y-1">
                {adminItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                        isActive 
                          ? 'bg-primary/10 text-primary font-medium' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      {isActive && <ChevronRight className="h-3 w-3" />}
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t space-y-4">
          <div className="px-3 py-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">User</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">
                {user?.email?.[0].toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{user?.email}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.roles?.[0]}</p>
              </div>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b bg-white flex items-center px-8 justify-between">
          <div className="text-sm text-gray-500">
            ERP / <span className="text-gray-900 font-medium capitalize">{location.pathname.replace('/', '') || 'Dashboard'}</span>
          </div>
        </header>
        <ScrollArea className="flex-1">
          <Outlet />
        </ScrollArea>
      </main>
      <Toaster position="top-right" />
    </div>
  );
}
