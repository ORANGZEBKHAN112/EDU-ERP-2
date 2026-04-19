import { useState, useEffect } from 'react';
import { useAuthContextStore } from '../store/authContextStore';
import { classApi } from '../api/classApi';
import { sectionApi } from '../api/sectionApi';
import { Class, Section } from '../types';
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, Loader, AlertCircle, Check } from 'lucide-react';
import ClassForm from '../components/ClassForm';
import SectionsModal from '../components/SectionsModal';

export default function ClassesPage() {
  const { user, schoolId, campusIds } = useAuthContextStore();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedCampus, setSelectedCampus] = useState<number | null>(null);
  const [expandedClass, setExpandedClass] = useState<number | null>(null);
  const [sectionsMap, setSectionsMap] = useState<Record<number, Section[]>>({});
  const [showClassForm, setShowClassForm] = useState(false);
  const [showSectionsModal, setShowSectionsModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [editingClass, setEditingClass] = useState<Class | null>(null);

  // Check if user can create/edit classes
  const canManageClasses = user.roles.some((role) =>
    ['SuperAdmin', 'CampusAdmin'].includes(role)
  );

  useEffect(() => {
    if (campusIds.length > 0 && !selectedCampus) {
      setSelectedCampus(campusIds[0]);
    }
  }, [campusIds]);

  useEffect(() => {
    if (selectedCampus) {
      fetchClasses();
    }
  }, [selectedCampus]);

  const fetchClasses = async () => {
    if (!selectedCampus) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await classApi.getAll(schoolId, selectedCampus);
      setClasses(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch classes');
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async (classId: number) => {
    try {
      if (sectionsMap[classId]) {
        return; // Already fetched
      }
      const data = await sectionApi.getByClass(classId, schoolId);
      setSectionsMap((prev) => ({
        ...prev,
        [classId]: Array.isArray(data) ? data : [],
      }));
    } catch (err) {
      console.error('Failed to fetch sections:', err);
      setSectionsMap((prev) => ({
        ...prev,
        [classId]: [],
      }));
    }
  };

  const handleCreateClass = async (formData: { className: string }) => {
    try {
      const newClass = await classApi.create(schoolId, selectedCampus!, formData.className);
      setClasses((prev) => [...prev, newClass]);
      setSuccess('Class created successfully');
      setShowClassForm(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to create class');
    }
  };

  const handleUpdateClass = async (formData: { className: string }) => {
    if (!editingClass) return;
    try {
      const updated = await classApi.update(editingClass.id, formData.className);
      setClasses((prev) =>
        prev.map((c) => (c.id === editingClass.id ? updated : c))
      );
      setSuccess('Class updated successfully');
      setEditingClass(null);
      setShowClassForm(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update class');
    }
  };

  const handleDeleteClass = async (classId: number) => {
    if (!window.confirm('Are you sure you want to delete this class? All associated sections and students will be affected.')) {
      return;
    }
    try {
      await classApi.delete(classId);
      setClasses((prev) => prev.filter((c) => c.id !== classId));
      setSuccess('Class deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete class');
    }
  };

  const toggleExpandClass = async (classId: number) => {
    if (expandedClass === classId) {
      setExpandedClass(null);
    } else {
      setExpandedClass(classId);
      await fetchSections(classId);
    }
  };

  const handleEditClass = (classItem: Class) => {
    setEditingClass(classItem);
    setShowClassForm(true);
  };

  const handleManageSections = (classItem: Class) => {
    setSelectedClass(classItem);
    setShowSectionsModal(true);
  };

  const onSectionsUpdate = (updatedSections: Section[]) => {
    setSectionsMap((prev) => ({
      ...prev,
      [selectedClass!.id]: updatedSections,
    }));
  };

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Classes Management</h1>
          <p className="text-slate-600 mt-1">Create and manage classes for your school</p>
        </div>
        {canManageClasses && (
          <button
            onClick={() => {
              setEditingClass(null);
              setShowClassForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all"
          >
            <Plus size={18} />
            Add Class
          </button>
        )}
      </div>

      {/* Campus Selector */}
      {campusIds.length > 1 && (
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select Campus
          </label>
          <select
            value={selectedCampus || ''}
            onChange={(e) => setSelectedCampus(Number(e.target.value))}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {campusIds.map((campusId) => (
              <option key={campusId} value={campusId}>
                Campus {campusId}
              </option>
            ))}
          </select>
        </div>
      )}

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
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader size={32} className="animate-spin text-blue-600" />
          <span className="ml-3 text-slate-600">Loading classes...</span>
        </div>
      )}

      {/* Classes List */}
      {!loading && classes.length > 0 && (
        <div className="space-y-3">
          {classes.map((classItem) => (
            <div
              key={classItem.id}
              className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Class Header */}
              <div
                onClick={() => toggleExpandClass(classItem.id)}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpandClass(classItem.id);
                    }}
                    className="p-1 hover:bg-slate-200 rounded transition-colors"
                  >
                    {expandedClass === classItem.id ? (
                      <ChevronUp size={20} className="text-slate-600" />
                    ) : (
                      <ChevronDown size={20} className="text-slate-600" />
                    )}
                  </button>
                  <div>
                    <h3 className="font-bold text-slate-900">{classItem.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      ID: {classItem.id} • Campus: {classItem.campusId}
                    </p>
                  </div>
                </div>

                {/* Sections Count Badge */}
                {sectionsMap[classItem.id] && (
                  <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                    {sectionsMap[classItem.id].length} section{sectionsMap[classItem.id].length !== 1 ? 's' : ''}
                  </div>
                )}

                {/* Action Buttons */}
                {canManageClasses && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 ml-4"
                  >
                    <button
                      onClick={() => handleManageSections(classItem)}
                      className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 font-bold transition-colors"
                    >
                      Sections
                    </button>
                    <button
                      onClick={() => handleEditClass(classItem)}
                      className="p-2 text-slate-400 hover:text-blue-600 transition-colors hover:bg-blue-50 rounded"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteClass(classItem.id)}
                      className="p-2 text-slate-400 hover:text-red-600 transition-colors hover:bg-red-50 rounded"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>

              {/* Sections List (Expanded) */}
              {expandedClass === classItem.id && sectionsMap[classItem.id] && (
                <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
                  {sectionsMap[classItem.id].length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-600 uppercase">Sections:</p>
                      <div className="flex flex-wrap gap-2">
                        {sectionsMap[classItem.id].map((section) => (
                          <div
                            key={section.id}
                            className="px-3 py-1 bg-white border border-slate-200 rounded-full text-sm text-slate-700"
                          >
                            {section.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No sections yet</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && classes.length === 0 && (
        <div className="border-2 border-dashed border-slate-200 rounded-lg p-12 text-center">
          <div className="text-slate-400 mb-3">
            <Plus size={40} className="mx-auto" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No classes yet</h3>
          <p className="text-slate-600 mb-4">Create your first class to get started</p>
          {canManageClasses && (
            <button
              onClick={() => {
                setEditingClass(null);
                setShowClassForm(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all"
            >
              <Plus size={18} />
              Create Class
            </button>
          )}
        </div>
      )}

      {/* Class Form Modal */}
      {showClassForm && (
        <ClassForm
          initialClass={editingClass}
          schoolId={schoolId}
          campusId={selectedCampus!}
          onSubmit={editingClass ? handleUpdateClass : handleCreateClass}
          onCancel={() => {
            setShowClassForm(false);
            setEditingClass(null);
          }}
          isEditing={!!editingClass}
        />
      )}

      {/* Sections Modal */}
      {showSectionsModal && selectedClass && (
        <SectionsModal
          classItem={selectedClass}
          schoolId={schoolId}
          sections={sectionsMap[selectedClass.id] || []}
          onUpdate={onSectionsUpdate}
          onClose={() => {
            setShowSectionsModal(false);
            setSelectedClass(null);
          }}
          canManage={canManageClasses}
        />
      )}
    </div>
  );
}
