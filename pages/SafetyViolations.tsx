
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { SafetyViolation, Project, Employee, Subcontractor, User, ViolationType } from '../types';
import PageHeader from '../components/ui/PageHeader';
import { useMessage } from '../components/ConfirmationProvider';
import { ProjectTreeSelect } from '../components/ProjectTreeSelect';
import SearchableSelect from '../components/ui/SearchableSelect';
import { PencilIcon } from '../components/icons/PencilIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { PlusIcon } from '../components/icons/PlusIcon';
import { UploadIcon } from '../components/icons/UploadIcon';
import { VIOLATION_TYPES } from '../constants';
import { useStore } from '../store/appStore';
import { ProjectMultiSelectFilter } from '../components/ProjectMultiSelectFilter';

const getDescendantIds = (projectId: string, projects: Project[]): string[] => {
  let descendants: string[] = [];
  const children = projects.filter(p => p.parentId === projectId);
  children.forEach(child => {
    descendants.push(child.id);
    descendants = [...descendants, ...getDescendantIds(child.id, projects)];
  });
  return descendants;
};

const processImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7)); // compress to jpeg
      };
      img.onerror = reject;
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

interface SafetyViolationsPageProps {
    violations: SafetyViolation[];
    projects: Project[];
    employees: Employee[];
    subcontractors: Subcontractor[];
    onAdd: (violation: Omit<SafetyViolation, 'id'>) => void;
    onUpdate: (violation: SafetyViolation) => void;
    onDelete: (id: string) => void;
    currentUser: User;
}

const SafetyViolationsPage: React.FC<SafetyViolationsPageProps> = ({ 
    violations, projects, employees, subcontractors, onAdd, onUpdate, onDelete, currentUser 
}) => {
    const { sharedFilters, setSharedFilters } = useStore();
    const { selectedProjects, dateRange } = sharedFilters;
    const { showError, showConfirmation } = useMessage();
    
    const [recordToEdit, setRecordToEdit] = useState<SafetyViolation | null>(null);
    const photoInputRef = useRef<HTMLInputElement>(null);

    // Form state
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [projectId, setProjectId] = useState<string | null>(null);
    const [subcontractor, setSubcontractor] = useState<string>('');
    const [empId, setEmpId] = useState<string>('');
    const [violationType, setViolationType] = useState<ViolationType>('No Helmet');
    const [description, setDescription] = useState('');
    const [actionTaken, setActionTaken] = useState('');
    const [photo, setPhoto] = useState<string | undefined>('');
    
    const canModify = currentUser.role === 'Admin' || currentUser.role === 'Data Entry' || currentUser.role === 'Project Manager';
    const canDelete = currentUser.role === 'Admin';
    const projectMap = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);

    const resetForm = useCallback(() => {
        setRecordToEdit(null);
        setDate(new Date().toISOString().split('T')[0]);
        setProjectId(null);
        setSubcontractor('');
        setEmpId('');
        setViolationType('No Helmet');
        setDescription('');
        setActionTaken('');
        setPhoto(undefined);
        if(photoInputRef.current) photoInputRef.current.value = "";
    }, []);
    
    useEffect(() => {
        if(recordToEdit) {
            setDate(recordToEdit.date);
            setProjectId(recordToEdit.projectId);
            setSubcontractor(recordToEdit.subcontractor);
            setEmpId(recordToEdit.empId || '');
            setViolationType(recordToEdit.violationType);
            setDescription(recordToEdit.description);
            setActionTaken(recordToEdit.actionTaken);
            setPhoto(recordToEdit.photo);
        } else {
            resetForm();
        }
    }, [recordToEdit, resetForm]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectId || !subcontractor || !violationType || !description || !actionTaken) {
            showError('Missing Information', 'Please fill all required fields.');
            return;
        }

        const violationData = {
            date,
            projectId,
            subcontractor,
            empId: empId || undefined,
            violationType,
            description,
            actionTaken,
            photo,
            createdBy: currentUser.id,
        };

        if (recordToEdit) {
            onUpdate({ ...violationData, id: recordToEdit.id });
        } else {
            onAdd(violationData);
        }
        resetForm();
    };

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const base64 = await processImage(file);
                setPhoto(base64);
            } catch (err) {
                showError('Image Error', 'Could not process the image file.');
            }
        }
    };

    const handleDelete = (id: string) => {
        showConfirmation('Delete Violation', 'Are you sure you want to delete this violation record?', () => onDelete(id));
    };

    const filteredViolations = useMemo(() => {
        if (!dateRange.start || !dateRange.end || !violations) return [];

        const projectIdsToFilter = new Set<string>();
        selectedProjects.forEach(id => {
          projectIdsToFilter.add(id);
          getDescendantIds(id, projects).forEach(descId => projectIdsToFilter.add(descId));
        });

        const projectIdsArray = Array.from(projectIdsToFilter);
        if (projectIdsArray.length === 0) return [];

        return violations.filter(v => 
            projectIdsArray.includes(v.projectId) &&
            v.date >= dateRange.start &&
            v.date <= dateRange.end
        ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [violations, selectedProjects, dateRange, projects]);

    const getPathString = useCallback((pId: string) => {
        const path = [];
        let current = projectMap.get(pId);
        while(current) {
            path.unshift(current.name);
            current = current.parentId ? projectMap.get(current.parentId) : undefined;
        }
        return path.join(' / ');
    }, [projectMap]);

    return (
        <div className="space-y-6">
            <PageHeader title="Safety Violations" subtitle="Log and track safety incidents across projects." />

            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Project</label>
                        <ProjectMultiSelectFilter projects={projects} selectedIds={selectedProjects} onSelectionChange={(ids) => setSharedFilters({ selectedProjects: ids })} />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date Range</label>
                        <div className="flex items-center gap-2">
                             <input type="date" name="start" value={dateRange.start} onChange={e => setSharedFilters({ dateRange: { ...dateRange, start: e.target.value }})} className="block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-700 focus:ring-[#28a745] focus:border-[#28a745] sm:text-sm" />
                             <span className="text-slate-500">to</span>
                             <input type="date" name="end" value={dateRange.end} onChange={e => setSharedFilters({ dateRange: { ...dateRange, end: e.target.value }})} className="block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-700 focus:ring-[#28a745] focus:border-[#28a745] sm:text-sm" />
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {canModify && (
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-sm">
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">{recordToEdit ? 'Edit Violation' : 'Record New Violation'}</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full mt-1 block border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-slate-700"/>
                                <ProjectTreeSelect projects={projects} selectedId={projectId} onSelect={setProjectId} placeholder="Select Location/Activity..."/>
                                <SearchableSelect options={subcontractors.map(s => ({ value: s.name, label: s.name }))} value={subcontractor} onChange={setSubcontractor} placeholder="Select Subcontractor..."/>
                                <input type="text" value={empId} onChange={e => setEmpId(e.target.value)} className="w-full mt-1 block border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-slate-700" list="employee-ids" placeholder="Employee ID (Optional)"/>
                                <datalist id="employee-ids">{employees.map(e => <option key={e.id} value={e.empId}>{e.name}</option>)}</datalist>
                                <select value={violationType} onChange={e => setViolationType(e.target.value as ViolationType)} required className="w-full mt-1 block border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-slate-700">
                                    {VIOLATION_TYPES.map(vt => <option key={vt} value={vt}>{vt}</option>)}
                                </select>
                                <textarea value={description} onChange={e => setDescription(e.target.value)} required placeholder="Description of Violation..." className="w-full mt-1 block border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-slate-700" rows={3}/>
                                <textarea value={actionTaken} onChange={e => setActionTaken(e.target.value)} required placeholder="Corrective Action Taken..." className="w-full mt-1 block border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-slate-700" rows={2}/>
                                
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Photo Evidence</label>
                                    <div className="flex items-center space-x-4">
                                        {photo && <img src={photo} alt="Violation" className="h-16 w-16 rounded-md object-cover"/>}
                                        <label className="cursor-pointer flex items-center justify-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm">
                                           <UploadIcon className="h-5 w-5 mr-2" /> {photo ? 'Change Photo' : 'Upload Photo'}
                                           <input ref={photoInputRef} type="file" onChange={handlePhotoChange} accept="image/*" className="hidden"/>
                                        </label>
                                    </div>
                                </div>

                                <div className="flex space-x-3 pt-2">
                                    {recordToEdit && <button type="button" onClick={resetForm} className="w-full flex items-center justify-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm">Cancel Edit</button>}
                                    <button type="submit" className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#28a745] hover:bg-green-700">
                                       <PlusIcon className="h-5 w-5 mr-2" /> {recordToEdit ? 'Update Record' : 'Add Record'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                <div className={canModify ? "lg:col-span-2 bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-sm" : "bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-sm"}>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Violation Log</h3>
                     {filteredViolations.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                <thead className="bg-slate-50 dark:bg-slate-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase">Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase">Location</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase">Violation</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase">Subcontractor</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium uppercase">Photo</th>
                                        {canModify && <th className="relative px-4 py-3"><span className="sr-only">Actions</span></th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {filteredViolations.map(v => (
                                        <tr key={v.id}>
                                            <td className="px-4 py-3 text-sm">{v.date}</td>
                                            <td className="px-4 py-3 text-sm" title={getPathString(v.projectId)}>{getPathString(v.projectId)}</td>
                                            <td className="px-4 py-3 text-sm">{v.violationType}</td>
                                            <td className="px-4 py-3 text-sm">{v.subcontractor}</td>
                                            <td className="px-4 py-3 text-sm">
                                                {v.photo ? <img src={v.photo} className="h-10 w-10 rounded-md object-cover" /> : 'N/A'}
                                            </td>
                                            {canModify && (
                                                <td className="px-4 py-3 text-right text-sm space-x-4">
                                                    <button onClick={() => setRecordToEdit(v)} className="text-[#28a745]"><PencilIcon className="h-5 w-5" /></button>
                                                    {canDelete && <button onClick={() => handleDelete(v.id)} className="text-red-600"><TrashIcon className="h-5 w-5" /></button>}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                     ) : (
                         <p className="text-center text-sm text-slate-500 py-8">No violations found for the selected filters.</p>
                     )}
                </div>
            </div>
        </div>
    );
};

export default SafetyViolationsPage;
