import { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { Campus } from '../types';
import { Plus, Building2, MapPin, Users } from 'lucide-react';

export default function CampusList() {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/schools/1/campuses') // Assuming schoolId 1 for now, should be dynamic
      .then(res => setCampuses(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center">Loading campuses...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {campuses.map((campus) => (
        <div key={campus.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
              <Building2 size={24} />
            </div>
            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${campus.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
              {campus.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900">{campus.name}</h3>
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <MapPin size={16} />
              {campus.address}, {campus.city}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Users size={16} />
              Finance Admin: Not Assigned
            </div>
          </div>
          <button className="w-full mt-6 py-2 bg-slate-50 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-100 transition-colors">
            Manage Campus
          </button>
        </div>
      ))}
      <button className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-400 transition-all group">
        <Plus size={32} className="mb-2 group-hover:scale-110 transition-transform" />
        <span className="font-bold">Add New Campus</span>
      </button>
    </div>
  );
}
