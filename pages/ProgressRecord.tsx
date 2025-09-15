import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Project, ProgressRecord as ProgressRecordType, User, Shift, ProjectNodeType, ActivityGroup, ActivityGroupMapping } from '../types';
import PageHeader from '../components/ui/PageHeader';
import { PlusIcon } from '../components/icons/PlusIcon';
import { PencilIcon } from '../components/icons/PencilIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { useMessage } from '../components/ConfirmationProvider';
import { ExportIcon } from '../components/icons/ExportIcon';
import { exportToExcel } from '../utils/excel';
import { ChevronUpDownIcon } from '../components/icons/ChevronUpDownIcon';
import SearchableSelect from '../components/ui/SearchableSelect';
import { HIERARCHY, DEFAULT_HIERARCHY_LABELS } from '../constants';
import Modal from '../components/ui/Modal';

const getDescendantIds = (projectId: string, allProjects: Project[]): string[] => {
    const ids = [projectId];
    const children = allProjects.filter(p => p.parentId === projectId);
    children.forEach(child => {
        ids.push(...getDescendantIds(child.id, allProjects));
    });
    return ids;
};

interface ProgressRecordPageProps {
    projects: Project[];
    progressRecords: ProgressRecordType[];
    activityGroups: ActivityGroup[];
    activityGroupMappings: ActivityGroupMapping[];
    onAddProgress: (record: Omit<ProgressRecordType, 'id'>) => void;
    onUpdateProgress: (record: ProgressRecordType) => void;
    onDeleteProgress: (id: string) => void;
    currentUser: User;
}

type SortDirection = 'ascending' | 'descending';
type SortableProgressRecord = ProgressRecordType & { dailyQty: number; activityPath: string };

interface SortConfig {
  key: keyof SortableProgressRecord | 'qty';
  direction: SortDirection;
}

const useSortableData = (items: SortableProgressRecord[], config: SortConfig | null = null) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(config);

  const sortedItems = useMemo(() => {
    let sortableItems = [...items];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key as keyof SortableProgressRecord];
        let bValue = b[sortConfig.key as keyof SortableProgressRecord];
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
             return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
        }
        
        if (String(aValue).localeCompare(String(bValue)) < 0) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (String(aValue).localeCompare(String(bValue)) > 0) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key: keyof SortableProgressRecord | 'qty') => {
    let direction: SortDirection = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  return { items: sortedItems, requestSort, sortConfig };
};

const SortableHeader: React.FC<{ sortKey: keyof SortableProgressRecord | 'qty', title: string, requestSort: (key: any) => void, sortConfig: SortConfig | null }> = ({ sortKey, title, requestSort, sortConfig }) => {
    const isSorted = sortConfig?.key === sortKey;
    return (
        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort(sortKey)}>
            <div className="flex items-center">
                <span>{title}</span>
                <ChevronUpDownIcon className={`h-4 w-4 ml-1.5 ${isSorted ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`} />
            </div>
        </th>
    );
};

const initialHierarchyState = HIERARCHY.reduce((acc, level) => ({ ...acc, [level]: null }), {} as Record<ProjectNodeType, string | null>);

const ProgressRecordPage: React.FC<ProgressRecordPageProps> = ({ projects, progressRecords, activityGroups, activityGroupMappings, onAddProgress, onUpdateProgress, onDeleteProgress, currentUser }) => {
    const [selectedHierarchy, setSelectedHierarchy] = useState<Record<ProjectNodeType, string | null>>(initialHierarchyState);
    const [recordToEdit, setRecordToEdit] = useState<ProgressRecordType | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Form state
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [cumulativeQty, setCumulativeQty] = useState<number | ''>('');
    const [shift, setShift] = useState<Shift>(Shift.DAY);
    const { showError, showConfirmation } = useMessage();
    const canModify = currentUser.role === 'Admin' || currentUser.role === 'Data Entry';

    const projectMap = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);

    const getRootProject = useCallback((projectId: string | null) => {
        if (!projectId) return null;
        let current = projectMap.get(projectId);
        while (current?.parentId) {
            current = projectMap.get(current.parentId);
        }
        return current || null;
    }, [projectMap]);

    const hierarchyLabels = useMemo(() => {
        const root = getRootProject(selectedHierarchy.Project);
        return { ...DEFAULT_HIERARCHY_LABELS, ...(root?.hierarchyLabels || {}) };
    }, [selectedHierarchy, getRootProject]);

    const handleHierarchyChange = useCallback((level: ProjectNodeType, value: string | null) => {
        setSelectedHierarchy(prev => {
            const newState = { ...prev, [level]: value };
            const levelIndex = HIERARCHY.indexOf(level);
            HIERARCHY.slice(levelIndex + 1).forEach(l => { newState[l] = null; });
            return newState;
        });
        setRecordToEdit(null);
    }, []);

    const activityForForm = useMemo(() => {
        const activityId = recordToEdit ? recordToEdit.activityId : selectedHierarchy.Activity;
        return activityId ? projectMap.get(activityId) : null;
    }, [selectedHierarchy, projectMap, recordToEdit]);

    useEffect(() => {
        if (recordToEdit) {
            setDate(recordToEdit.date);
            setCumulativeQty(recordToEdit.qty);
            setShift(recordToEdit.shift || Shift.DAY);
            const path: Record<ProjectNodeType, string | null> = { ...initialHierarchyState };
            let current = projectMap.get(recordToEdit.activityId);
            while (current) {
                path[current.type] = current.id;
                current = current.parentId ? projectMap.get(current.parentId) : undefined;
            }
            setSelectedHierarchy(path);
        }
    }, [recordToEdit, projectMap]);

    const handleOpenAddModal = () => {
        setRecordToEdit(null);
        setDate(new Date().toISOString().split('T')[0]);
        setCumulativeQty('');
        setShift(Shift.DAY);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (rec: ProgressRecordType) => {
        setRecordToEdit(rec);
        setIsModalOpen(true);
    };

    const previousCumulativeQty = useMemo(() => {
        if (!activityForForm) return 0;
        const relevantRecords = progressRecords.filter(r => {
            if (r.activityId !== activityForForm.id) return false;
            if (recordToEdit && r.id === recordToEdit.id) return false;
            if (r.date < date) return true;
            if (r.date > date) return false;
            return r.shift === Shift.DAY && shift === Shift.NIGHT;
        });
        if (relevantRecords.length === 0) return 0;
        relevantRecords.sort((a, b) => {
            const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime();
            if (dateComparison !== 0) return dateComparison;
            if (a.shift === Shift.NIGHT && b.shift === Shift.DAY) return 1;
            if (a.shift === Shift.DAY && b.shift === Shift.NIGHT) return -1;
            return 0;
        });
        return relevantRecords[0]?.qty || 0;
    }, [progressRecords, activityForForm, date, shift, recordToEdit]);
    
    const dailyQtyForEntry = useMemo(() => {
        const currentQty = Number(cumulativeQty);
        if (isNaN(currentQty) || cumulativeQty === '') return 0;
        return currentQty - previousCumulativeQty;
    }, [cumulativeQty, previousCumulativeQty]);

    const progressPercentage = useMemo(() => {
        if (!activityForForm || !activityForForm.totalQty) return 0;
        const currentTotal = Number(cumulativeQty) || 0;
        return (currentTotal / activityForForm.totalQty) * 100;
    }, [activityForForm, cumulativeQty]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activityForForm) {
            showError("No Activity Selected", "An activity must be selected to log progress.");
            return;
        }
        if (cumulativeQty === '' || isNaN(Number(cumulativeQty))) {
            showError("Invalid Quantity", "Cumulative quantity must be a number.");
            return;
        }
        const newCumulativeQty = Number(cumulativeQty);
        if (newCumulativeQty < previousCumulativeQty) {
            showError("Invalid Quantity", `Cumulative quantity (${newCumulativeQty.toLocaleString()}) cannot be less than the previous recorded cumulative of ${previousCumulativeQty.toLocaleString()}.`);
            return;
        }
        const plannedQty = activityForForm.totalQty;
        if (plannedQty !== undefined && plannedQty > 0 && newCumulativeQty > plannedQty) {
            showError("Quantity Exceeded", `This entry of ${newCumulativeQty.toLocaleString()} would exceed the total planned quantity of ${plannedQty.toLocaleString()}.\n\nPlease adjust the cumulative quantity or update the planned BOQ quantity in Settings > Projects.`);
            return;
        }
        const mapping = activityGroupMappings.find(m => m.activityId === activityForForm.id);
        if (!mapping) {
            showError("Activity Not Mapped", "This activity has not been mapped to an Activity Group. Please configure it in Settings.");
            return;
        }
        const recordData = { date, qty: newCumulativeQty, shift, activityId: activityForForm.id, activityGroupId: mapping.activityGroupId };
        if (recordToEdit) {
            onUpdateProgress({ ...recordData, id: recordToEdit.id });
        } else {
            onAddProgress(recordData);
        }
        setRecordToEdit(null);
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        showConfirmation('Delete Record', 'Are you sure you want to delete this progress record?', () => onDeleteProgress(id));
    };
    
    const getPathString = useCallback((activityId: string): string => {
        const path: string[] = [];
        let current = projectMap.get(activityId);
        while (current) {
            path.unshift(current.name);
            current = current.parentId ? projectMap.get(current.parentId) : undefined;
        }
        return path.slice(1).join(' / ');
    }, [projectMap]);

    const filteredRecords = useMemo(() => {
        let deepestSelectedId: string | null = null;
        for (let i = HIERARCHY.length - 1; i >= 0; i--) {
            if (selectedHierarchy[HIERARCHY[i]]) {
                deepestSelectedId = selectedHierarchy[HIERARCHY[i]];
                break;
            }
        }
        if (!deepestSelectedId) return [];
        const descendantIds = getDescendantIds(deepestSelectedId, projects);
        const activityIds = new Set(projects.filter(p => p.type === 'Activity' && descendantIds.includes(p.id)).map(p => p.id));
        return progressRecords.filter(r => activityIds.has(r.activityId));
    }, [selectedHierarchy, projects, progressRecords]);

    const enhancedRecords = useMemo(() => {
        const recordsByActivity = new Map<string, ProgressRecordType[]>();
        filteredRecords.forEach(rec => {
            if (!recordsByActivity.has(rec.activityId)) recordsByActivity.set(rec.activityId, []);
            recordsByActivity.get(rec.activityId)!.push(rec);
        });
        const result: SortableProgressRecord[] = [];
        recordsByActivity.forEach((records) => {
            records.sort((a, b) => {
                const dateComp = new Date(a.date).getTime() - new Date(b.date).getTime();
                if (dateComp !== 0) return dateComp;
                if (a.shift === Shift.DAY && b.shift === Shift.NIGHT) return -1;
                if (a.shift === Shift.NIGHT && b.shift === Shift.DAY) return 1;
                return 0;
            });
            let lastCumulativeQty = 0;
            records.forEach(rec => {
                const dailyQty = rec.qty - lastCumulativeQty;
                result.push({ 
                    ...rec, 
                    dailyQty: dailyQty < 0 ? rec.qty : dailyQty,
                    activityPath: getPathString(rec.activityId) 
                });
                lastCumulativeQty = rec.qty;
            });
        });
        return result;
    }, [filteredRecords, getPathString]);

    const { items: sortedRecords, requestSort, sortConfig } = useSortableData(enhancedRecords, { key: 'activityPath', direction: 'ascending' });

    const handleExport = () => {
        const dataToExport = sortedRecords.map(r => {
            const activity = projectMap.get(r.activityId);
            return {
                Date: r.date,
                Shift: r.shift,
                Activity: r.activityPath,
                'Unit of Measure': activity?.uom || 'N/A',
                'Daily Quantity': r.dailyQty,
                'Cumulative Quantity': r.qty,
                'Planned Quantity': activity?.totalQty ?? 'N/A'
            };
        });
        exportToExcel(dataToExport, "Progress_Report");
    };

    const renderHierarchySelectors = () => {
        let parentId: string | null = null;
        return HIERARCHY.map((level, index) => {
            if (index > 0 && !parentId) return null;
            const options = projects
                .filter(p => p.type === level && p.parentId === parentId)
                .map(p => ({ value: p.id, label: p.name }));

            if (index > 0 && options.length === 0) return null;

            const selectedValue = selectedHierarchy[level];
            parentId = selectedValue;

            return (
                <div key={level}>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{hierarchyLabels[level]}</label>
                    <SearchableSelect
                        options={options}
                        value={selectedValue}
                        onChange={(val) => handleHierarchyChange(level, val)}
                        placeholder={`Select ${hierarchyLabels[level]}...`}
                        disabled={options.length === 0 && index > 0}
                    />
                </div>
            );
        });
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Progress Records" subtitle="Log and view daily progress for project activities." />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-sm">
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Filters</h3>
                        <div className="space-y-4">{renderHierarchySelectors()}</div>
                        {selectedHierarchy.Activity && canModify && (
                            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                                <button 
                                    onClick={handleOpenAddModal} 
                                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#28a745] hover:bg-green-700"
                                >
                                    <PlusIcon className="h-5 w-5 mr-2" />
                                    Add Progress for Selected Activity
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white">Progress Log</h3>
                        <button onClick={handleExport} disabled={sortedRecords.length === 0} className="flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md shadow-sm disabled:opacity-50">
                           <ExportIcon className="h-5 w-5 mr-2" /> Export
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                         <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                             <thead className="bg-slate-50 dark:bg-slate-700">
                                <tr>
                                    <SortableHeader sortKey="activityPath" title="Activity" requestSort={requestSort} sortConfig={sortConfig} />
                                    <SortableHeader sortKey="date" title="Date" requestSort={requestSort} sortConfig={sortConfig} />
                                    <SortableHeader sortKey="dailyQty" title="Daily Qty" requestSort={requestSort} sortConfig={sortConfig} />
                                    <SortableHeader sortKey="qty" title="Cumulative" requestSort={requestSort} sortConfig={sortConfig} />
                                    {canModify && <th className="relative px-4 py-3"><span className="sr-only">Actions</span></th>}
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {sortedRecords.map(rec => (
                                    <tr key={rec.id}>
                                        <td className="px-4 py-3 text-sm" title={rec.activityPath}>{rec.activityPath}</td>
                                        <td className="px-4 py-3 text-sm">{rec.date}</td>
                                        <td className="px-4 py-3 text-sm">{rec.dailyQty.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-sm font-semibold">{rec.qty.toLocaleString()}</td>
                                        {canModify && (
                                            <td className="px-4 py-3 text-right text-sm space-x-4">
                                                <button onClick={() => handleOpenEditModal(rec)} className="text-[#28a745]"><PencilIcon className="h-5 w-5"/></button>
                                                <button onClick={() => handleDelete(rec.id)} className="text-red-600"><TrashIcon className="h-5 w-5"/></button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                             </tbody>
                         </table>
                    </div>
                 </div>
            </div>

            {isModalOpen && activityForForm && (
                <Modal title={recordToEdit ? `Edit Progress for ${activityForForm.name}` : `Add Progress for ${activityForForm.name}`} onClose={() => setIsModalOpen(false)}>
                    <form onSubmit={handleSubmit}>
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div>
                                <label className="block text-sm font-medium">Date</label>
                                <input type="date" value={date} onChange={e => setDate(e.target.value)} required max={new Date().toISOString().split('T')[0]} className="w-full mt-1 block border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-slate-700"/>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="qty-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Cumulative Qty ({activityForForm.uom || 'N/A'})
                                    </label>
                                    <input id="qty-input" type="number" value={cumulativeQty} onChange={e => setCumulativeQty(e.target.value === '' ? '' : parseFloat(e.target.value))} required className="w-full mt-1 block border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-slate-700" step="any" min="0"/>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Daily qty for this entry: <span className="font-semibold">{dailyQtyForEntry.toLocaleString()}</span></p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium">Shift</label>
                                    <select value={shift} onChange={e => setShift(e.target.value as Shift)} className="w-full mt-1 block border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-slate-700">
                                        {Object.values(Shift).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            {activityForForm.totalQty !== undefined && activityForForm.totalQty > 0 && (
                                <div className="mt-2 space-y-1">
                                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                                        <span>Overall Progress</span>
                                        <span>{progressPercentage.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2">
                                        <div className="bg-green-500 h-2 rounded-full transition-all duration-300" style={{ width: `${Math.min(progressPercentage, 100)}%` }}></div>
                                    </div>
                                     <p className="text-xs text-slate-500 dark:text-slate-400 text-right">
                                        {(Number(cumulativeQty) || 0).toLocaleString()} / {activityForForm.totalQty.toLocaleString()}
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 text-right space-x-3">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="inline-flex justify-center py-2 px-4 border border-slate-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700">
                                Cancel
                            </button>
                            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#28a745] hover:bg-green-700">
                                {recordToEdit ? 'Save Changes' : 'Add Record'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default ProgressRecordPage;