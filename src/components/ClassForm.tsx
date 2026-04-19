import { useState } from 'react';
import { Class } from '../types';
import { X, Loader } from 'lucide-react';

interface ClassFormProps {
  initialClass: Class | null;
  schoolId: number;
  campusId: number;
  onSubmit: (data: { className: string }) => Promise<void>;
  onCancel: () => void;
  isEditing: boolean;
}

export default function ClassForm({
  initialClass,
  schoolId,
  campusId,
  onSubmit,
  onCancel,
  isEditing,
}: ClassFormProps) {
  const [className, setClassName] = useState(initialClass?.name || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!className.trim()) {
      setError('Class name is required');
      return;
    }

    try {
      setLoading(true);
      await onSubmit({ className: className.trim() });
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            {isEditing ? 'Edit Class' : 'Create New Class'}
          </h2>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-slate-100 rounded transition-colors"
          >
            <X size={20} className="text-slate-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Class Name Input */}
          <div>
            <label htmlFor="className" className="block text-sm font-bold text-slate-700 mb-2">
              Class Name *
            </label>
            <input
              type="text"
              id="className"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="e.g., Class 1, Class 10, Grade 5"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              disabled={loading}
            />
            <p className="text-xs text-slate-500 mt-1">
              Enter a descriptive name for the class
            </p>
          </div>

          {/* Context Info */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-xs text-slate-600">
              <span className="font-bold">School ID:</span> {schoolId} • 
              <span className="font-bold ml-2">Campus ID:</span> {campusId}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading && <Loader size={16} className="animate-spin" />}
              {isEditing ? 'Update Class' : 'Create Class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
