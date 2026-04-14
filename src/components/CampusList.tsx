import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { Campus } from '../types';
import { Plus, Building2, MapPin, Users, AlertCircle } from 'lucide-react';

export default function CampusList() {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCampuses = async () => {
      try {
        setLoading(true);
        // Using a more robust approach to fetch campuses
        // We try to get campuses for school 1 as a default, or handle the case where it might fail
        const res = await apiClient.get('/campuses').catch(async () => {
          // Fallback to school-specific campuses if global list fails
          return apiClient.get('/schools/1/campuses');
        });
        
        const data = Array.isArray(res.data) ? res.data : [];
        setCampuses(data);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch campuses', err);
        setError('Unable to load campuses. Please check your connection.');
        setCampuses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCampuses();
  }, []);

  if (loading) return (
    <div className="p-12 text-center">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-slate-500 font-medium">Loading campuses...</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Campuses</h2>
          <p className="text-slate-500">Manage your school's physical locations and branches.</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-100 flex items-center gap-3">
          <AlertCircle size={20} />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campuses.map((campus) => (
          <div key={campus?.id || Math.random()} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                <Building2 size={24} />
              </div>
              <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${campus?.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                {campus?.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">{campus?.name || 'Unnamed Campus'}</h3>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <MapPin size={16} className="flex-shrink-0" />
                <span className="truncate">{campus?.address || 'No address'}, {campus?.city || 'No city'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Users size={16} className="flex-shrink-0" />
                <span>Finance Admin: {campus?.financeAdminUserId ? 'Assigned' : 'Not Assigned'}</span>
              </div>
            </div>
            <button className="w-full mt-6 py-2 bg-slate-50 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-100 transition-colors">
              Manage Campus
            </button>
          </div>
        ))}
        
        <button className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-400 transition-all group min-h-[200px]">
          <Plus size={32} className="mb-2 group-hover:scale-110 transition-transform" />
          <span className="font-bold">Add New Campus</span>
        </button>
      </div>
    </div>
  );
}
