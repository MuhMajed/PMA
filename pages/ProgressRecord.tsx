

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Project, ProgressRecord as ProgressRecordType, User, Shift } from '../types';
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

interface ProgressRecordPageProps {
    projects: Project[];
    progressRecords: ProgressRecordType[];
    onAddProgress: (record: Omit<ProgressRecordType, 'id'>) => void;
    onUpdateProgress: (record: ProgressRecordType) => void;
    onDeleteProgress: (id: string) => void;
    currentUser: User;
}

type SortDirection = 'ascending' | 'descending';
type SortableProgressRecord = ProgressRecordType & { cumulativeQty: number };

interface SortConfig {
  key: keyof SortableProgressRecord;
  direction: SortDirection;
}

const useSortableData = (items: SortableProgressRecord[], config: SortConfig | null = null) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(config);

  const sortedItems = useMemo(() => {
    let sortableItems = [...items];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key: keyof SortableProgressRecord) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  return { items: sortedItems, requestSort, sortConfig };
};

const SortableHeader: React.FC<{
    sortKey: any,
    title: string,
    requestSort: (key: any) => void,
    sortConfig: SortConfig | null
}> = ({ sortKey, title, requestSort, sortConfig }) => {
    const isSorted = sortConfig?.key === sortKey;
    return (
        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort(sortKey)}>
            <div className="flex items-center">
                <span>{title}</span>
                <ChevronUpDownIcon className={`h-4 w-4 ml-1.5 ${isSorted ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`} />
            </div>
        </th>
    );
};


const ProgressRecordPage: React.FC<ProgressRecordPageProps> = ({ projects, progressRecords, onAddProgress, onUpdateProgress, onDeleteProgress, currentUser }) => {
    const [selectedHierarchyIds, setSelectedHierarchyIds] = useState<string[]>([]);
    const [recordToEdit, setRecordToEdit] = useState<ProgressRecordType | null>(null);

    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [quantity, setQuantity] = useState<number | ''>(''); 
    const [manualPercentage, setManualPercentage] = useState<number | ''>('');
    const [shift, setShift] = useState<Shift>(Shift.DAY);
    const { showError, showConfirmation } = useMessage();
    
    const projectsById = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);

    const canModify = currentUser.role === 'Admin' || currentUser.role === 'Data Entry';
    const canDelete = currentUser.role === 'Admin';
    
    const selectedActivityId = useMemo(() => {
        const lastId = selectedHierarchyIds[selectedHierarchyIds.length - 1];
        if (!lastId) return null;
        const node = projectsById.get(lastId);
        return node?.type === 'Activity' ? lastId : null;
    }, [selectedHierarchyIds, projectsById]);

    const selectedActivity = useMemo(() => projects.find(p => p.id === selectedActivityId), [projects, selectedActivityId]);
    
    const recordsForActivity = useMemo(() => 
        progressRecords
            .filter(r => r.activityId === selectedActivityId)
            .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()), 
        [progressRecords, selectedActivityId]
    );
    
    const cumulativeData = useMemo(() => {
        let cumulativeTotal = 0;
        return recordsForActivity.map(record => {
            cumulativeTotal += record.qty;
            return { ...record, cumulativeQty: cumulativeTotal };
        });
    }, [recordsForActivity]);
    
    const { items: sortedCumulativeData, requestSort, sortConfig } = useSortableData(cumulativeData, { key: 'date', direction: 'ascending'});
    
    const getActivityPath = useCallback((activityId: string): Project[] => {
        const path: Project[] = [];
        let current = projectsById.get(activityId);
        while (current) {
            path.unshift(current);
            current = current.parentId ? projectsById.get(current.parentId) : undefined;
        }
        return path;
    }, [projectsById]);

    const resetForm = useCallback(() => {
        setRecordToEdit(null);
        setSelectedDate(new Date().toISOString().split('T')[0]);
        setQuantity('');
        setManualPercentage('');
        setShift(Shift.DAY);
    }, []);

    useEffect(() => {
        if (recordToEdit) {
            const path = getActivityPath(recordToEdit.activityId);
            setSelectedHierarchyIds(path.map(p => p.id));
            setSelectedDate(recordToEdit.date);
            const cumulativeRecord = cumulativeData.find(r => r.id === recordToEdit.id);
            setQuantity(cumulativeRecord?.cumulativeQty ?? '');
            setManualPercentage(recordToEdit.manualPercentage ?? '');
            setShift(recordToEdit.shift || Shift.DAY);
        }
    }, [recordToEdit, cumulativeData, getActivityPath]);
    

    const handleHierarchyChange = (levelIndex: number, value: string | null) => {
        let newHierarchy = [...selectedHierarchyIds.slice(0, levelIndex)];
        if (value) {
            newHierarchy.push(value);
            
            // Auto-select path if there's only one child
            let currentNodeId = value;
            while (true) {
                const children = projects.filter(p => p.parentId === currentNodeId);
                if (children.length === 1) {
                    const child = children[0];
                    newHierarchy.push(child.id);
                    currentNodeId = child.id;
                    if (child.type === 'Activity') {
                        break;
                    }
                } else {
                    break;
                }
            }
        }
        
        setSelectedHierarchyIds(newHierarchy);
        resetForm();
    };
    
    const getCumulativeBeforeDate = (date: string, excludeRecordId?: string) => {
         return recordsForActivity
            .filter(r => r.date < date && r.id !== excludeRecordId)
            .reduce((sum, record) => sum + record.qty, 0);
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedActivityId || !selectedActivity) {
            showError("Selection Missing", "Please select a valid activity from all levels.");
            return;
        }

        if (quantity === '' || isNaN(Number(quantity))) {
            showError("Invalid Input", "Please enter a valid quantity.");
            return;
        }
        
        const cumulativeQtyInput = Number(quantity);

        if (recordToEdit) {
            const prevCumulative = getCumulativeBeforeDate(recordToEdit.date, recordToEdit.id);
            const newDailyQty = cumulativeQtyInput - prevCumulative;

            if (newDailyQty < 0) {
                showError("Invalid Quantity", `Cumulative quantity cannot be less than the previous day's total of ${prevCumulative.toFixed(2)}.`);
                return;
            }

            const totalWithoutOldRecord = (cumulativeData.length > 0 ? cumulativeData[cumulativeData.length-1].cumulativeQty : 0) - recordToEdit.qty;
            const newTotalWithNewDaily = totalWithoutOldRecord + newDailyQty;

            if (selectedActivity.totalQty && newTotalWithNewDaily > selectedActivity.totalQty) {
                showError("Exceeds Planned Quantity", `This update would make the total ${newTotalWithNewDaily.toFixed(2)}, exceeding the planned ${selectedActivity.totalQty}.`);
                return;
            }

            const updatedRecord: ProgressRecordType = {
                ...recordToEdit,
                qty: newDailyQty,
                manualPercentage: manualPercentage !== '' ? Number(manualPercentage) : undefined,
                shift,
            };
            onUpdateProgress(updatedRecord);
        } else {
            if (selectedActivity.totalQty && cumulativeQtyInput > selectedActivity.totalQty) {
                showError("Exceeds Planned Quantity", `Cumulative quantity (${cumulativeQtyInput}) exceeds the total planned quantity (${selectedActivity.totalQty}).`);
                return;
            }

            const existingRecordOnDate = recordsForActivity.find(r => r.date === selectedDate);
            if (existingRecordOnDate) {
                showError("Duplicate Record", `A record for ${selectedDate} already exists. Please edit the existing record.`);
                return;
            }

            const currentCumulativeQty = getCumulativeBeforeDate(selectedDate);
            if (cumulativeQtyInput < currentCumulativeQty) {
                showError("Invalid Quantity", `Cumulative quantity (${cumulativeQtyInput}) cannot be less than the previously recorded cumulative of ${currentCumulativeQty.toFixed(2)}.`);
                return;
            }

            const nextRecord = recordsForActivity.find(r => r.date > selectedDate);
            if (nextRecord) {
                const nextCumulativeEntry = cumulativeData.find(cd => cd.id === nextRecord.id);
                if (nextCumulativeEntry && cumulativeQtyInput > nextCumulativeEntry.cumulativeQty) {
                    showError("Invalid Quantity", `The cumulative quantity (${cumulativeQtyInput}) cannot be greater than the quantity recorded on the next available date (${nextRecord.date}), which is ${nextCumulativeEntry.cumulativeQty.toFixed(2)}.`);
                    return;
                }
            }

            const dailyQty = cumulativeQtyInput - currentCumulativeQty;
            const newRecord: Omit<ProgressRecordType, 'id'> = {
                activityId: selectedActivityId,
                date: selectedDate,
                qty: dailyQty,
                manualPercentage: (!selectedActivity?.totalQty && manualPercentage !== '') ? Number(manualPercentage) : undefined,
                shift,
            };
            onAddProgress(newRecord);
        }
        
        resetForm(); 
        const currentSelection = [...selectedHierarchyIds];
        setSelectedHierarchyIds([]);
        setTimeout(() => setSelectedHierarchyIds(currentSelection), 0);
    };

    const handleDelete = (record: ProgressRecordType) => {
        showConfirmation(
            'Delete Progress Record',
            `Are you sure you want to delete the record for ${record.date}?\nThis action cannot be undone.`,
            () => onDeleteProgress(record.id)
        );
    };
    
    const finalCumulativeQty = cumulativeData.length > 0 ? cumulativeData[cumulativeData.length - 1].cumulativeQty : 0;
    const finalPercentage = selectedActivity?.totalQty ? (finalCumulativeQty / selectedActivity.totalQty) * 100 : 0;
    
    const currentCumulativeQtyForDisplay = recordToEdit ? getCumulativeBeforeDate(recordToEdit.date, recordToEdit.id) : getCumulativeBeforeDate(selectedDate);

    const handleExport = () => {
        if (!selectedActivity) return;
        const dataToExport = sortedCumulativeData.map(rec => {
            const percentage = selectedActivity.totalQty 
                ? (rec.cumulativeQty / selectedActivity.totalQty) * 100 
                : rec.manualPercentage ?? null;
            return {
                Date: rec.date,
                Shift: rec.shift || 'Day',
                'Daily Qty': rec.qty.toFixed(2),
                'Cumulative Qty': rec.cumulativeQty.toFixed(2),
                'Progress %': percentage !== null ? `${Math.min(percentage, 100).toFixed(2)}%` : 'N/A'
            };
        });
        exportToExcel(dataToExport, `Progress_Report_${selectedActivity.name}`);
    };
    
    const renderSlicers = () => {
        const slicers = [];
        
        const rootProjectId = selectedHierarchyIds[0];
        const rootProject = rootProjectId ? projectsById.get(rootProjectId) : null;
        const labels = rootProject?.hierarchyLabels 
            ? { ...DEFAULT_HIERARCHY_LABELS, ...rootProject.hierarchyLabels } 
            : DEFAULT_HIERARCHY_LABELS;

        // Slicer 0: Root Projects
        const rootProjects = projects.filter(p => p.parentId === null);
        slicers.push(
            <div key="level-0">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{labels.Project}</label>
                <SearchableSelect
                    options={rootProjects.map(p => ({ value: p.id, label: p.name }))}
                    value={selectedHierarchyIds[0] || null}
                    onChange={(value) => handleHierarchyChange(0, value)}
                    placeholder={`Select ${labels.Project}...`}
                />
            </div>
        );
    
        let parentId: string | null = selectedHierarchyIds[0];
        for (let i = 0; i < selectedHierarchyIds.length; i++) {
            parentId = selectedHierarchyIds[i];
            const children = projects.filter(p => p.parentId === parentId);
    
            if (children.length > 0) {
                const childType = children[0].type;
                const levelLabel = labels[childType] || childType;
    
                slicers.push(
                    // The key is tied to the parentId to ensure React creates a new
                    // component instance when the parent changes, resetting any internal state.
                    <div key={`slicer-for-${parentId}`}>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{levelLabel}</label>
                        <SearchableSelect
                            options={children.map(p => ({ value: p.id, label: p.name }))}
                            value={selectedHierarchyIds[i + 1] || null}
                            onChange={(value) => handleHierarchyChange(i + 1, value)}
                            placeholder={`Select ${levelLabel}...`}
                        />
                    </div>
                );
            }
        }
    
        return slicers;
    };


    return (
        <div className="space-y-6">
            <PageHeader
                title="Progress Record"
                subtitle="Select an activity to record or view daily progress."
            >
                 <button
                    onClick={handleExport}
                    disabled={!selectedActivity || cumulativeData.length === 0}
                    className="flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:bg-slate-50 disabled:cursor-not-allowed dark:disabled:bg-slate-700"
                >
                    <ExportIcon className="h-5 w-5 mr-2" />
                    Export
                </button>
            </PageHeader>

            <div className={`grid grid-cols-1 ${canModify ? 'lg:grid-cols-3' : ''} gap-6`}>
                {canModify && (
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-sm">
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">{recordToEdit ? `Editing Record for ${recordToEdit.date}` : 'Record Progress'}</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-3">
                                    {renderSlicers()}
                                </div>
                                
                                {selectedActivityId && (
                                    <>
                                        <hr className="border-slate-200 dark:border-slate-700"/>
                                        {!recordToEdit && (
                                            <div>
                                                <label htmlFor="date-picker" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                                                <div className="flex">
                                                    <input type="date" id="date-picker" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                                                        className="block w-full pl-3 pr-2 py-2 text-base border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-[#28a745] focus:border-[#28a745] sm:text-sm rounded-l-md"
                                                        max={new Date().toISOString().split('T')[0]}
                                                    />
                                                    <button type="button" onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])} className="relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600">Today</button>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between pt-1">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Shift</label>
                                            <div className="flex items-center p-1 bg-slate-200 dark:bg-slate-700/50 rounded-lg">
                                                <button type="button" onClick={() => setShift(Shift.DAY)} className={`px-3 py-1 text-sm rounded-md transition-all ${shift === Shift.DAY ? 'bg-white dark:bg-slate-600 shadow' : 'text-slate-600 dark:text-slate-300'}`}>Day</button>
                                                <button type="button" onClick={() => setShift(Shift.NIGHT)} className={`px-3 py-1 text-sm rounded-md transition-all ${shift === Shift.NIGHT ? 'bg-white dark:bg-slate-600 shadow' : 'text-slate-600 dark:text-slate-300'}`}>Night</button>
                                            </div>
                                        </div>
                                        <div>
                                            <label htmlFor="quantity" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Cumulative Quantity Executed
                                            </label>
                                            <div className="relative">
                                                <input type="number" id="quantity" value={quantity} onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                                                    className="block w-full pl-3 pr-12 py-2 text-base border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-[#28a745] focus:border-[#28a745] sm:text-sm rounded-md"
                                                    placeholder={`Current is ${currentCumulativeQtyForDisplay.toFixed(2)}`}
                                                    step="any" min={currentCumulativeQtyForDisplay}
                                                />
                                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                    <span className="text-slate-500 sm:text-sm">{selectedActivity?.uom}</span>
                                                </div>
                                            </div>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                Enter the total quantity completed up to the selected date.
                                            </p>
                                        </div>
                                        {!selectedActivity?.totalQty && (
                                            <div>
                                                <label htmlFor="manualPercentage" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                    Cumulative Progress % (Optional)
                                                </label>
                                                <input type="number" id="manualPercentage" value={manualPercentage} onChange={(e) => setManualPercentage(e.target.value === '' ? '' : Number(e.target.value))}
                                                    className="block w-full pl-3 py-2 text-base border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-[#28a745] focus:border-[#28a745] sm:text-sm rounded-md"
                                                    placeholder="Enter % if no total Qty"
                                                    step="any" min="0" max="100"
                                                />
                                            </div>
                                        )}
                                        <div className="flex space-x-3">
                                            {recordToEdit && (
                                                <button type="button" onClick={() => setRecordToEdit(null)} className="w-full flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700">
                                                    Cancel Edit
                                                </button>
                                            )}
                                            <button type="submit" disabled={!selectedActivityId} className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#28a745] hover:bg-green-700 disabled:bg-green-300">
                                                <PlusIcon className="h-5 w-5 mr-2" /> {recordToEdit ? 'Update Record' : 'Add Record'}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </form>
                        </div>
                    </div>
                )}

                <div className={canModify ? "lg:col-span-2 bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-sm" : "bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-sm"}>
                   {selectedActivity ? (
                    <>
                        <div className="pb-4 border-b border-slate-200 dark:border-slate-700 mb-4">
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white">{selectedActivity.name}</h3>
                            <div className="flex justify-between items-baseline mt-2 text-sm text-slate-600 dark:text-slate-300">
                                <div>
                                    <span className="font-medium">Total Planned:</span> {selectedActivity.totalQty || 'N/A'} {selectedActivity.uom}
                                </div>
                                <div>
                                    <span className="font-medium">Total Executed:</span> {finalCumulativeQty.toFixed(2)} {selectedActivity.uom}
                                </div>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mt-2">
                                <div className="bg-[#28a745] h-2.5 rounded-full" style={{ width: `${Math.min(finalPercentage, 100).toFixed(2)}%` }}></div>
                            </div>
                             <div className="text-right text-lg font-bold text-[#28a745] mt-1">
                                {Math.min(finalPercentage, 100).toFixed(2)}%
                            </div>
                        </div>
                        
                        <div className="overflow-y-auto max-h-[calc(100vh-25rem)]">
                             <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                <thead className="bg-slate-50 dark:bg-slate-700 sticky top-0">
                                    <tr>
                                        <SortableHeader sortKey="date" title="Date" requestSort={requestSort} sortConfig={sortConfig} />
                                        <SortableHeader sortKey="shift" title="Shift" requestSort={requestSort} sortConfig={sortConfig} />
                                        <SortableHeader sortKey="qty" title="Daily Qty" requestSort={requestSort} sortConfig={sortConfig} />
                                        <SortableHeader sortKey="cumulativeQty" title="Cumulative Qty" requestSort={requestSort} sortConfig={sortConfig} />
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Progress %</th>
                                        {canModify && <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>}
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                                    {sortedCumulativeData.map(record => {
                                        const percentage = selectedActivity.totalQty
                                            ? (record.cumulativeQty / selectedActivity.totalQty) * 100
                                            : record.manualPercentage ?? null;

                                        return (
                                            <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{record.date}</td>
                                                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{record.shift || 'Day'}</td>
                                                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{record.qty.toFixed(2)}</td>
                                                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{record.cumulativeQty.toFixed(2)}</td>
                                                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                                    {percentage !== null ? `${Math.min(percentage, 100).toFixed(2)}%` : 'N/A'}
                                                </td>
                                                {canModify && (
                                                    <td className="px-6 py-4 text-right text-sm font-medium space-x-4">
                                                        <button onClick={() => setRecordToEdit(record)} className="text-[#28a745] hover:text-green-700">
                                                            <PencilIcon className="h-5 w-5" />
                                                        </button>
                                                        {canDelete && (
                                                            <button onClick={() => handleDelete(record)} className="text-red-600 hover:text-red-800">
                                                                <TrashIcon className="h-5 w-5" />
                                                            </button>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                   ) : (
                    <div className="text-center py-10 px-4">
                        <h3 className="text-sm font-medium text-slate-900 dark:text-white">No Activity Selected</h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Please select a project and all subsequent levels down to an activity to view and record progress.</p>
                    </div>
                   )}
                </div>
            </div>
        </div>
    );
};

export default ProgressRecordPage;