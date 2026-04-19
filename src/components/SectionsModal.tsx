import { useState, useEffect } from 'react';
import { Class, Section } from '../types';
import { sectionApi } from '../api/sectionApi';
import { X, Plus, Edit2, Trash2, Loader, AlertCircle, Check } from 'lucide-react';
import SectionForm from './SectionForm';

interface SectionsModalProps {
  classItem: Class;
  schoolId: number;
  sections: Section[];
  onUpdate: (sections: Section[]) => void;
  onClose: () => void;
  canManage: boolean;
}

export default function SectionsModal({
  classItem,
  schoolId,
  sections,
  onUpdate,
  onClose,
  canManage,
}: SectionsModalProps) {
  const [sectionsList, setSectionsList] = useState<Section[]>(sections);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);

  useEffect(() => {
    setSectionsList(sections);
  }, [sections]);

  const handleCreateSection = async (formData: { sectionName: string }) => {
    try {
      setLoading(true);
      setError(null);
      const newSection = await sectionApi.create(
        schoolId,
        classItem.campusId,
        classItem.id,
        formData.sectionName
      );
      const updatedSections = [...sectionsList, newSection];
      setSectionsList(updatedSections);
      onUpdate(updatedSections);
      setSuccess('Section created successfully');
      setShowSectionForm(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to create section');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSection = async (formData: { sectionName: string }) => {
    if (!editingSection) return;
    try {
      setLoading(true);
      setError(null);
      const updated = await sectionApi.update(
        editingSection.id,
        schoolId,
        formData.sectionName
      );
      const updatedSections = sectionsList.map((s) =>
        s.id === editingSection.id ? updated : s
      );
      setSectionsList(updatedSections);
      onUpdate(updatedSections);
      setSuccess('Section updated successfully');
      setEditingSection(null);
      setShowSectionForm(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update section');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSection = async (sectionId: number) => {
    if (!window.confirm('Are you sure you want to delete this section?')) {
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await sectionApi.delete(sectionId, schoolId);
      const updatedSections = sectionsList.filter((s) => s.id !== sectionId);
      setSectionsList(updatedSections);
      onUpdate(updatedSections);
      setSuccess('Section deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete section');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSection = (section: Section) => {
    setEditingSection(section);
    setShowSectionForm(true);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Manage Sections</h2>
            <p className="text-sm text-slate-600 mt-1">Class: {classItem.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded transition-colors"
          >
            <X size={20} className="text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Messages */}
          {error && (
            <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle size={18} />
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                ✕
              </button>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
              <Check size={18} />
              <span>{success}</span>
              <button
                onClick={() => setSuccess(null)}
                className="ml-auto text-green-600 hover:text-green-800"
              >
                ✕
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && !showSectionForm && (
            <div className="flex items-center justify-center py-8">
              <Loader size={32} className="animate-spin text-blue-600" />
              <span className="ml-3 text-slate-600">Loading...</span>
            </div>
          )}

          {/* Sections List */}
          {!loading && sectionsList.length > 0 && (
            <div className="space-y-3">
              {sectionsList.map((section) => (
                <div
                  key={section.id}
                  className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div>
                    <h4 className="font-bold text-slate-900">{section.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      ID: {section.id} • Created: {section.createdAt ? new Date(section.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditSection(section)}
                        className="p-2 text-slate-400 hover:text-blue-600 transition-colors hover:bg-blue-50 rounded"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteSection(section.id)}
                        className="p-2 text-slate-400 hover:text-red-600 transition-colors hover:bg-red-50 rounded"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && sectionsList.length === 0 && (
            <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center">
              <div className="text-slate-400 mb-2">
                <Plus size={32} className="mx-auto" />
              </div>
              <p className="text-slate-600">No sections created yet</p>
            </div>
          )}

          {/* Section Form */}
          {showSectionForm && (
            <SectionForm
              initialSection={editingSection}
              classId={classItem.id}
              onSubmit={editingSection ? handleUpdateSection : handleCreateSection}
              onCancel={() => {
                setShowSectionForm(false);
                setEditingSection(null);
              }}
              isEditing={!!editingSection}
              isInline
            />
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-6 flex gap-3">
          {canManage && !showSectionForm && (
            <button
              onClick={() => {
                setEditingSection(null);
                setShowSectionForm(true);
              }}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors"
            >
              <Plus size={18} />
              Add Section
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-bold hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
