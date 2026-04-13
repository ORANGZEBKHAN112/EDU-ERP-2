import { useState, useEffect, FormEvent } from 'react';
import { 
  LayoutDashboard, 
  School, 
  Building2, 
  Users, 
  GraduationCap, 
  CreditCard, 
  Receipt, 
  Settings,
  Menu,
  X,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  LogOut,
  Bell,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jwtDecode } from 'jwt-decode';

// --- Services & Components ---
import apiClient from './services/apiClient';
import StudentList from './components/StudentList';
import CampusList from './components/CampusList';
import FeeManagement from './components/FeeManagement';
import { Student, School as SchoolType } from './types';

interface UserPayload {
  id: number;
  schoolId: number;
  email: string;
  roles: string[];
  campusIds: number[];
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [schools, setSchools] = useState<SchoolType[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [user, setUser] = useState<UserPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState('admin@eduflow.com');
  const [loginPassword, setLoginPassword] = useState('admin123');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode<UserPayload>(token);
        setUser(decoded);
        fetchInitialData(decoded);
      } catch (err) {
        handleLogout();
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchInitialData = async (currentUser: UserPayload) => {
    try {
      setLoading(true);
      const isSuperAdmin = currentUser.roles.includes('SuperAdmin');
      const dashboardUrl = isSuperAdmin ? '/dashboard/superadmin' : `/dashboard/campus/${currentUser.campusIds[0]}`;
      
      const [statsRes, schoolsRes, studentsRes] = await Promise.all([
        apiClient.get(dashboardUrl),
        isSuperAdmin ? apiClient.get('/schools') : Promise.resolve({ data: [] }),
        apiClient.get('/students')
      ]);

      setStats(statsRes.data);
      setSchools(schoolsRes.data);
      setStudents(studentsRes.data);
    } catch (err) {
      console.error('Failed to fetch initial data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/auth/login', { email: loginEmail, password: loginPassword });
      const { token } = res.data;
      localStorage.setItem('token', token);
      const decoded = jwtDecode<UserPayload>(token);
      setUser(decoded);
      fetchInitialData(decoded);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Login failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setStats(null);
    setSchools([]);
    setStudents([]);
    setActiveTab('dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">Initializing EduFlow...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/20">
              <GraduationCap className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">EduFlow ERP</h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">SaaS Management Suite</p>
            </div>
          </div>
          
          <h2 className="text-xl font-bold text-slate-800 mb-6">Welcome Back</h2>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
              <input 
                type="email" 
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="admin@eduflow.com"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
              <input 
                type="password" 
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
            <button 
              type="submit"
              className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-900/20 hover:bg-blue-700 transition-all active:scale-[0.98]"
            >
              Sign In
            </button>
          </form>
          <div className="mt-8 pt-8 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center">
              Demo Credentials:<br/>
              Admin: admin@eduflow.com / admin123<br/>
              Finance: finance@eduflow.com / finance123
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  const isSuperAdmin = user.roles.includes('SuperAdmin');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['SuperAdmin', 'FinanceAdmin', 'CampusAdmin'] },
    { id: 'schools', label: 'Schools', icon: School, roles: ['SuperAdmin'] },
    { id: 'campuses', label: 'Campuses', icon: Building2, roles: ['SuperAdmin', 'FinanceAdmin'] },
    { id: 'students', label: 'Students', icon: GraduationCap, roles: ['SuperAdmin', 'FinanceAdmin', 'CampusAdmin'] },
    { id: 'fees', label: 'Fee Management', icon: CreditCard, roles: ['SuperAdmin', 'FinanceAdmin'] },
    { id: 'vouchers', label: 'Vouchers', icon: Receipt, roles: ['SuperAdmin', 'FinanceAdmin'] },
    { id: 'users', label: 'Users & Roles', icon: Users, roles: ['SuperAdmin'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['SuperAdmin', 'FinanceAdmin', 'CampusAdmin'] },
  ].filter(item => item.roles.some(role => user.roles.includes(role)));

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="bg-slate-900 text-white flex flex-col shadow-xl z-20"
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <GraduationCap size={18} />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">EduFlow</span>
            </motion.div>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={22} className={activeTab === item.id ? 'text-white' : 'group-hover:text-blue-400'} />
              {isSidebarOpen && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="ml-4 font-medium"
                >
                  {item.label}
                </motion.span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center font-bold">
                {user.email.charAt(0).toUpperCase()}
              </div>
              {isSidebarOpen && (
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold truncate">{user.roles[0]}</span>
                  <span className="text-xs text-slate-500 truncate">{user.email}</span>
                </div>
              )}
            </div>
            {isSidebarOpen && (
              <button 
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-slate-800 capitalize">
              {activeTab.replace('-', ' ')}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64 transition-all"
              />
            </div>
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
            </button>
            <div className="h-8 w-px bg-slate-200 mx-2" />
            <span className="text-sm text-slate-500 font-medium">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Total Revenue', value: `$${stats?.totalRevenue || 0}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+12.5%', isUp: true },
                    { label: 'Total Schools', value: stats?.totalSchools || 0, icon: School, color: 'text-blue-600', bg: 'bg-blue-50', trend: '+2', isUp: true, hide: !isSuperAdmin },
                    { label: 'Total Campuses', value: stats?.totalCampuses || 0, icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50', trend: '+5', isUp: true },
                    { label: 'Total Students', value: stats?.totalStudents || 0, icon: GraduationCap, color: 'text-orange-600', bg: 'bg-orange-50', trend: '+150', isUp: true },
                    { label: 'Collection Rate', value: `${stats?.collectionRate || 0}%`, icon: Receipt, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: '+3%', isUp: true, hide: isSuperAdmin },
                  ].filter(s => !s.hide).map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                      <div className="flex items-start justify-between">
                        <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                          <stat.icon size={24} />
                        </div>
                        <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${stat.isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {stat.isUp ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
                          {stat.trend}
                        </div>
                      </div>
                      <div className="mt-4">
                        <h3 className="text-slate-500 text-sm font-medium">{stat.label}</h3>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recent Activity & Schools */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                      <h2 className="text-lg font-bold text-slate-800">{isSuperAdmin ? 'Schools Overview' : 'Campus Performance'}</h2>
                      <button className="text-sm text-blue-600 font-semibold hover:underline">View All</button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                            <th className="px-6 py-4">{isSuperAdmin ? 'School Name' : 'Campus Name'}</th>
                            <th className="px-6 py-4">{isSuperAdmin ? 'Country' : 'Students'}</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Created At</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {isSuperAdmin ? schools.map((school) => (
                            <tr key={school.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 font-medium text-slate-900">{school.name}</td>
                              <td className="px-6 py-4 text-slate-600">{school.country}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${school.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                                  {school.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-slate-500 text-sm">{new Date(school.createdAt).toLocaleDateString()}</td>
                            </tr>
                          )) : (
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 font-medium text-slate-900">Main Campus</td>
                              <td className="px-6 py-4 text-slate-600">{stats?.totalStudents || 0}</td>
                              <td className="px-6 py-4">
                                <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">Active</span>
                              </td>
                              <td className="px-6 py-4 text-slate-500 text-sm">2024-01-15</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-lg font-bold text-slate-800 mb-6">Recent Students</h2>
                    <div className="space-y-6">
                      {students.slice(0, 5).map((student) => (
                        <div key={student.id} className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                            {student.fullName.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-bold text-slate-900">{student.fullName}</h4>
                            <p className="text-xs text-slate-500">{student.admissionNo} • Grade {student.classId}</p>
                          </div>
                          <span className="text-xs font-medium text-slate-400">Just now</span>
                        </div>
                      ))}
                      {students.length === 0 && (
                        <p className="text-center text-slate-400 py-8">No recent students</p>
                      )}
                    </div>
                    <button 
                      onClick={() => setActiveTab('students')}
                      className="w-full mt-8 py-3 bg-slate-50 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      View All Students
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'students' && (
              <motion.div
                key="students"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <StudentList />
              </motion.div>
            )}

            {activeTab === 'campuses' && (
              <motion.div
                key="campuses"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <CampusList />
              </motion.div>
            )}

            {activeTab === 'fees' && (
              <motion.div
                key="fees"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <FeeManagement />
              </motion.div>
            )}

            {['vouchers', 'users', 'settings', 'schools'].includes(activeTab) && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <div className="p-6 bg-slate-100 rounded-full mb-4">
                  <Settings size={48} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Module Under Development</h3>
                <p className="mt-2">This module is part of the ERP roadmap and will be available soon.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
