import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { School as SchoolIcon, Plus, Edit2, Trash2, Globe, Calendar } from 'lucide-react';
import { School } from '../types';

export default function SchoolManagement() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/schools');
      setSchools(Array.isArray(res.data) ? res.data : []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch schools', err);
      setError('Failed to load schools.');
      setSchools([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500">Loading school management...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">School Management</h2>
          <p className="text-slate-500">Manage all schools registered on the platform.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all">
          <Plus size={18} />
          Add New School
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-100 text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schools.map((school) => (
          <div key={school.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-12 -mt-12 group-hover:bg-blue-100 transition-colors" />
            
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
                  <SchoolIcon size={24} />
                </div>
                <div className="flex gap-1">
                  <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-1">{school.name}</h3>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
                <Globe size={14} />
                {school.country}
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Status</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${school.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                    {school.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Joined</span>
                  <span className="text-slate-700 font-medium flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(school.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <button className="w-full mt-6 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors">
                View Details
              </button>
            </div>
          </div>
        ))}
        {schools.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
            <SchoolIcon size={48} className="mx-auto mb-4 opacity-20" />
            <p>No schools registered yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
