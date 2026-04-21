import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../app/authStore';
import { useAuthContextStore } from '../store/authContextStore';
import { authApi } from '../api/authApi';
import { Lock, Mail, Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const setAuth = useAuthStore((state) => state.setAuth);
  const setUserContext = useAuthContextStore((state) => state.setUserContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await authApi.login({ email, password });
      setAuth(response.token, response.user);
      
      // Initialize Auth Context
      setUserContext({
        user: {
          id: response.user.id,
          name: response.user.fullName,
          email: response.user.email,
          roles: response.user.roles || [],
        },
        schoolId: response.user.schoolId || 0,
        campusIds: response.user.campusIds || [],
        isAuthenticated: true,
      });

      navigate(from, { replace: true });
    } catch (err: any) {
      const message = err.response?.data?.message || 'An error occurred during login';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -mr-64 -mt-64"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -ml-64 -mb-64"></div>
      
      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-[0_0_40px_rgba(37,99,235,0.3)] group hover:scale-110 transition-transform duration-500">
            <Lock size={32} strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-widest uppercase">Eduflow</h1>
          <p className="text-slate-500 text-[10px] uppercase font-black tracking-[0.3em] mt-2">Mission Control Access</p>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-slate-800/50 p-10 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent rounded-[2.5rem] pointer-events-none"></div>
          
          <div className="relative z-10">
            {error && (
              <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-black uppercase tracking-widest rounded-xl text-center">
                Authentication Failure: {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Terminal ID (Email)</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-700/50 text-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all outline-none font-bold placeholder:text-slate-600"
                      placeholder="admin@access.io"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Security Key (Password)</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-700/50 text-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all outline-none font-bold placeholder:text-slate-600"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl shadow-[0_10px_30px_rgba(37,99,235,0.3)] hover:shadow-[0_15px_40px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center gap-3 disabled:opacity-70 group active:scale-[0.98]"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <span className="uppercase tracking-[0.2em] text-sm italic">Initiate Session</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-[10px] text-slate-600 uppercase font-black tracking-[0.4em]">
            SYSTEM VERSION // 4.0.0-PRO
          </p>
        </div>
      </div>
    </div>
  );
};
