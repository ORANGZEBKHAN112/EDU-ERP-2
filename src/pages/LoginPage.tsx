import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../app/authStore';
import { useAuthContextStore } from '../store/authContextStore';
import { authApi } from '../api/authApi';
import { getRoleLandingPath } from '../utils/rbac';
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
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await authApi.login({ email, password });
      
      // Validate response structure
      if (!response || !response.token || !response.user) {
        throw new Error('Invalid login response - missing token or user data');
      }

      const { token, user } = response;
      
      // Ensure user roles are always a string array
      const userRoles = Array.isArray(user.roles)
        ? user.roles.map(r => String(r).toLowerCase())
        : [];
      
      // Ensure campusIds is always an array
      const campusIds = Array.isArray(user.campusIds) ? user.campusIds : [];
      
      // Set auth and context
      setAuth(token, {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        roles: userRoles,
      });
      
      setUserContext({
        user: {
          id: user.id,
          name: user.fullName,
          email: user.email,
          roles: userRoles,
        },
        schoolId: user.schoolId || 0,
        campusIds: campusIds,
        isAuthenticated: true,
      });

      const requestedPath = location.state?.from?.pathname;
      const fallbackPath = getRoleLandingPath(userRoles);
      const destination = requestedPath && requestedPath !== '/login' ? requestedPath : fallbackPath;
      navigate(destination, { replace: true });
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'An error occurred during login';
      setError(message);
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-blue-200">
            <Lock size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
          <p className="text-slate-500 mt-2">Enter your credentials to access EduFlow ERP</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                placeholder="admin@eduflow.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
            EduFlow ERP v1.0
          </p>
        </div>
      </div>
    </div>
  );
};
