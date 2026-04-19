import { useState } from 'react';
import { Section } from '../types';
import { X, Loader } from 'lucide-react';

interface SectionFormProps {
  initialSection: Section | null;
  classId: number;
  onSubmit: (data: { sectionName: string }) => Promise<void>;
  onCancel: () => void;
  isEditing: boolean;
  isInline?: boolean;
}

export default function SectionForm({
  initialSection,
  classId,
  onSubmit,
  onCancel,
  isEditing,
  isInline = false,
}: SectionFormProps) {
  const [sectionName, setSectionName] = useState(initialSection?.name || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!sectionName.trim()) {
      setError('Section name is required');
      return;
    }

    try {
      setLoading(true);
      await onSubmit({ sectionName: sectionName.trim() });
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Inline form (used inside modal)
  if (isInline) {
    return (
      <form onSubmit={handleSubmit} className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg space-y-3">
        <div>
          <label htmlFor="sectionName" className="block text-sm font-bold text-slate-700 mb-2">
            {isEditing ? 'Edit Section Name' : 'New Section Name'} *
          </label>
          <input
            type="text"
            id="sectionName"
            value={sectionName}
            onChange={(e) => setSectionName(e.target.value)}
            placeholder="e.g., Boys, Girls, A, B"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            disabled={loading}
            autoFocus
          />
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>

        <div className="flex gap-2">
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
            {isEditing ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    );
  }

  // Modal form (used for standalone)
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            {isEditing ? 'Edit Section' : 'Create New Section'}
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

          {/* Section Name Input */}
          <div>
            <label htmlFor="sectionName" className="block text-sm font-bold text-slate-700 mb-2">
              Section Name *
            </label>
            <input
              type="text"
              id="sectionName"
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              placeholder="e.g., Boys, Girls, A, B, Morning, Afternoon"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              disabled={loading}
            />
            <p className="text-xs text-slate-500 mt-1">
              Common section names: Boys, Girls, A, B, C, Morning, Afternoon
            </p>
          </div>

          {/* Context Info */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-xs text-slate-600">
              <span className="font-bold">Class ID:</span> {classId}
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
              {isEditing ? 'Update Section' : 'Create Section'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
