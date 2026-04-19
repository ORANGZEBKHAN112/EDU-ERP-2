# Classes & Sections UI - Quick Reference

## Component Structure

```
Pages/
├── ClassesPage.tsx
    ├── classAPI.getAll()
    ├── sectionAPI.getByClass()
    └── State:
        ├── classes: Class[]
        ├── sectionsMap: Map<classId, Section[]>
        ├── selectedCampus: number
        ├── expandedClass: number | null
        ├── selectedClass: Class | null
        └── editingClass: Class | null

Components/
├── ClassForm.tsx (Modal)
│   ├── className: string (input)
│   └── onSubmit: (data) => Promise
│
├── SectionsModal.tsx (Modal)
│   ├── sectionsList: Section[]
│   ├── showSectionForm: boolean
│   ├── editingSection: Section | null
│   └── SectionForm inline
│
└── SectionForm.tsx (Inline or Modal)
    ├── sectionName: string (input)
    └── onSubmit: (data) => Promise
```

## State Flow

```
ClassesPage (Container)
    │
    ├─→ Campus Selection
    │    └─→ fetchClasses(schoolId, campusId)
    │
    ├─→ Classes List
    │    ├─→ On expand: fetchSections(classId)
    │    ├─→ Show sections in expandedClass
    │    └─→ Actions: Create, Edit, Delete, Manage Sections
    │
    ├─→ ClassForm Modal
    │    ├─→ Create mode: newClass
    │    ├─→ Edit mode: editingClass
    │    └─→ onSubmit → handleCreateClass/handleUpdateClass
    │
    └─→ SectionsModal
         ├─→ SectionsList from sectionsMap[classId]
         ├─→ SectionForm (inline)
         └─→ Actions: Create, Edit, Delete sections
```

## API Calls & Expected Responses

### Get Classes
```
GET /api/classes/:campusId?schoolId=1&campusId=1
Response: { success: true, data: [{ id, schoolId, campusId, name }, ...] }
```

### Create Class
```
POST /api/classes
Body: { schoolId: 1, campusId: 1, className: "Class 1" }
Response: { success: true, data: { id, schoolId, campusId, name } }
```

### Update Class
```
PUT /api/classes/:id
Body: { className: "Class 1 Updated" }
Response: { success: true, data: { id, schoolId, campusId, name } }
```

### Delete Class
```
DELETE /api/classes/:id
Response: { success: true }
```

### Get Sections by Class
```
GET /api/sections/class/:classId
Response: { success: true, data: [{ id, classId, campusId, schoolId, name }, ...] }
```

### Create Section
```
POST /api/sections
Body: { schoolId: 1, campusId: 1, classId: 1, sectionName: "Boys" }
Response: { success: true, data: { id, classId, campusId, schoolId, name } }
```

### Update Section
```
PUT /api/sections/:id
Body: { sectionName: "Girls" }
Response: { success: true, data: { id, classId, campusId, schoolId, name } }
```

### Delete Section
```
DELETE /api/sections/:id
Response: { success: true }
```

## UI Elements

### ClassesPage Header
- Title: "Classes Management"
- Subtitle: "Create and manage classes for your school"
- "Add Class" button (SuperAdmin/CampusAdmin only)

### Campus Selector
- Dropdown showing available campuses
- Default: first campus in campusIds
- Only shown if multiple campuses

### Classes List Item
```
[▼] Class 1         [2 sections] [Edit] [Delete]
                    [Sections] 
```

When expanded:
```
[▲] Class 1         [2 sections] [Edit] [Delete]
                    [Sections]
    Sections:
    [Boys]  [Girls]
```

### ClassForm
```
Modal: "Create New Class" or "Edit Class"
├─ Class Name* [____________]
├─ School ID: 1 • Campus ID: 1
└─ Buttons: [Cancel] [Create Class]
```

### SectionsModal
```
Modal: "Manage Sections"
├─ Class: Class 1
├─ List of Sections:
│  - Boys    [Edit] [Delete]
│  - Girls   [Edit] [Delete]
├─ SectionForm (when creating)
└─ Buttons: [Add Section] [Close]
```

### SectionForm (Inline)
```
├─ Section Name* [____________]
├─ Example: Boys, Girls, A, B, Morning, Afternoon
└─ Buttons: [Cancel] [Create]
```

## User Roles & Permissions

| Role | Access | Actions |
|------|--------|---------|
| SuperAdmin | View all | Create, Edit, Delete all classes/sections |
| CampusAdmin | View campus classes | Create, Edit, Delete campus classes |
| Principal | View campus classes | Create, Edit, Delete campus classes |
| Student | View only | No actions |
| Teacher | View only | No actions (future) |

## Keyboard Shortcuts (Future)

- `Ctrl+N`: New class
- `Escape`: Close modal
- `Enter`: Submit form
- `Tab`: Navigate form fields

## Testing Scenarios

### Scenario 1: Create Class as SuperAdmin
1. Login as SuperAdmin
2. Navigate to /classes
3. Click "Add Class" button
4. Enter class name "Class 1"
5. Click "Create Class"
6. Verify class appears in list
7. ✅ PASS: Class visible with ID

### Scenario 2: Add Section to Class
1. Classes page loaded
2. Click chevron to expand "Class 1"
3. Sections visible (empty or existing)
4. Click "Sections" button
5. SectionsModal opens
6. Click "Add Section"
7. Enter "Boys"
8. Click "Create"
9. ✅ PASS: "Boys" appears in list

### Scenario 3: Edit Class Name
1. Hover over class in list
2. Click Edit icon
3. ClassForm modal opens with current name
4. Change name to "Class 1 - Advanced"
5. Click "Update Class"
6. ✅ PASS: List updates with new name

### Scenario 4: Delete Section
1. SectionsModal open
2. Click Delete icon on "Boys"
3. Confirm deletion
4. ✅ PASS: "Boys" removed, list updates

### Scenario 5: RBAC - Student Cannot Edit
1. Login as Student
2. Navigate to /classes
3. ✅ PASS: Route redirects or shows empty
4. OR if allowed to view:
   - No "Edit" or "Delete" buttons visible
   - No "Sections" button visible
   - "Add Class" button absent

### Scenario 6: Campus Switch
1. Classes page with Campus 1 displayed
2. Select Campus 2 from dropdown
3. ✅ PASS: Class list updates to Campus 2 classes
4. Sections cache cleared
5. Expand a class - sections load fresh

### Scenario 7: Error Handling
1. Create class with empty name
2. ✅ PASS: Error message: "Class name is required"
3. Submit form with network down
4. ✅ PASS: Error alert displayed
5. Dismiss alert with X button
6. ✅ PASS: Alert disappears

## Common Issues & Solutions

| Issue | Root Cause | Solution |
|-------|-----------|----------|
| Classes not showing | API error | Check backend logs, verify token |
| Sections empty | Not fetched yet | Click expand, wait for load |
| Form won't submit | Validation error | Check console error message |
| Modal doesn't close | State not clearing | Hard refresh page |
| Buttons disabled | Loading state stuck | Check network, try again |
| Campus dropdown gone | Single campus | Remove multi-campus check |

## Performance Tips

1. **Sections Load Lazily:** Only fetch when expanding a class
2. **Cache Sections:** Don't re-fetch same class sections
3. **Debounce Search:** (Future) Implement with input delay
4. **Paginate Classes:** (Future) Load 20 at a time
5. **Optimize Re-renders:** Use React.memo for list items

## Code Examples

### Fetch Classes
```typescript
const fetchClasses = async () => {
  try {
    setLoading(true);
    const data = await classApi.getAll(schoolId, selectedCampus);
    setClasses(Array.isArray(data) ? data : []);
  } catch (err) {
    setError(err.message || 'Failed to fetch');
  } finally {
    setLoading(false);
  }
};
```

### Create Class
```typescript
const handleCreateClass = async (formData) => {
  try {
    const newClass = await classApi.create(
      schoolId, 
      selectedCampus, 
      formData.className
    );
    setClasses(prev => [...prev, newClass]);
    setSuccess('Class created');
  } catch (err) {
    setError(err.message);
  }
};
```

### Expand Sections
```typescript
const toggleExpandClass = async (classId) => {
  if (expandedClass === classId) {
    setExpandedClass(null);
  } else {
    setExpandedClass(classId);
    await fetchSections(classId);
  }
};
```

## Build & Deployment

```bash
# Build
npm run build

# Verify output
ls dist/

# Run dev server
npm run dev

# Navigate to Classes
http://localhost:5173/classes
```

## File Checklist

- [x] src/pages/ClassesPage.tsx
- [x] src/components/ClassForm.tsx
- [x] src/components/SectionsModal.tsx
- [x] src/components/SectionForm.tsx
- [x] src/api/classApi.ts (updated)
- [x] src/api/sectionApi.ts (recreated)
- [x] src/App.tsx (route added)
- [x] src/layouts/DashboardLayout.tsx (no change needed)
- [x] src/components/shared/Sidebar.tsx (Classes nav added)
- [x] src/utils/rbac.ts (classes path added)
- [x] src/types.ts (Class interface updated)

**Status:** ✅ All files in place, Build successful

---

**Last Updated:** 2026-04-20 17:45 UTC  
**Version:** 1.0 Production
