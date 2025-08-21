import React, { useState, useMemo, useEffect } from 'react';
import { Project, ProgressRecord as ProgressRecordType, User } from '../types';
import PageHeader from '../components/ui/PageHeader';
import { PlusIcon } from '../components/icons/PlusIcon';
import Modal from '../components/ui/Modal';
import { ProjectTreeSelect } from '../components/ProjectTreeSelect';
import { PencilIcon } from '../components/icons/PencilIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { useConfirmation } from '../components/ConfirmationProvider';

interface ProgressRecordPageProps {
    projects: Project[];
    progressRecords: ProgressRecordType[];
    onAddProgress: (record: Omit<ProgressRecordType, 'id'>) => void;
    onUpdateProgress: (record: ProgressRecordType) => void;
    onDeleteProgress: (id: string) => void;
    currentUser: User;
}

const ProgressRecordPage: React.FC<ProgressRecordPageProps> = ({ projects, progressRecords, onAddProgress, onUpdateProgress, onDeleteProgress, currentUser }) => {
    const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
    const [recordToEdit, setRecordToEdit] = useState<ProgressRecordType | null>(null);

    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [quantity, setQuantity] = useState<number | ''>(''); // Represents cumulative for add, daily for edit
    const [manualPercentage, setManualPercentage] = useState<number | ''>('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const { showConfirmation } = useConfirmation();

    const selectedActivity = useMemo(() => projects.find(p => p.id === selectedActivityId), [projects, selectedActivityId]);
    
    // Effect to reset form when activity changes or when finishing an edit
    useEffect(() => {
        if (!recordToEdit) {
            setSelectedDate(new Date().toISOString().split('T')[0]);
            setQuantity('');
            setManualPercentage('');
        }
    }, [selectedActivityId, recordToEdit]);
    
    // Effect to populate form for editing
    useEffect(() => {
        if (recordToEdit) {
            if (selectedActivityId !== recordToEdit.activityId) {
                setSelectedActivityId(recordToEdit.activityId);
            }
            setSelectedDate(recordToEdit.date);
            setQuantity(recordToEdit.qty);
            setManualPercentage(recordToEdit.manualPercentage ?? '');
        }
    }, [recordToEdit, selectedActivityId]);


    const handleActivitySelect = (id: string | null) => {
        setSelectedActivityId(id);
        if (recordToEdit) {
            setRecordToEdit(null); // Cancel edit if activity changes
        }
    };

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

    const getCumulativeBeforeDate = (date: string) => {
         return recordsForActivity
            .filter(r => r.date < date)
            .reduce((sum, record) => sum + record.qty, 0);
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (!selectedActivityId) {
            setErrorMessage("Please select an activity.");
            return;
        }

        if (quantity === '' || isNaN(Number(quantity))) {
            setErrorMessage("Please enter a valid quantity.");
            return;
        }

        // --- EDIT LOGIC ---
        if (recordToEdit) {
            const updatedRecord: ProgressRecordType = {
                ...recordToEdit,
                date: selectedDate,
                qty: Number(quantity),
                manualPercentage: manualPercentage !== '' ? Number(manualPercentage) : undefined,
            };
            onUpdateProgress(updatedRecord);
            setRecordToEdit(null);
            return;
        }

        // --- ADD LOGIC ---
        const cumulativeQty = Number(quantity);
        const existingRecordOnDate = recordsForActivity.find(r => r.date === selectedDate);
        if (existingRecordOnDate) {
            setErrorMessage(`A record for ${selectedDate} already exists. Please edit the existing record or choose a different date.`);
            return;
        }

        const currentCumulativeQty = getCumulativeBeforeDate(selectedDate);
        if (cumulativeQty < currentCumulativeQty) {
            setErrorMessage(`Cumulative quantity (${cumulativeQty}) cannot be less than the previous recorded quantity of ${currentCumulativeQty}.`);
            return;
        }

        const nextRecord = recordsForActivity.find(r => r.date > selectedDate);
        if (nextRecord) {
            const nextCumulativeEntry = cumulativeData.find(cd => cd.id === nextRecord.id);
            if (nextCumulativeEntry && cumulativeQty > nextCumulativeEntry.cumulativeQty) {
                setErrorMessage(`The cumulative quantity (${cumulativeQty}) cannot be greater than the quantity recorded on the next available date (${nextRecord.date}), which is ${nextCumulativeEntry.cumulativeQty}.`);
                return;
            }
        }

        const dailyQty = cumulativeQty - currentCumulativeQty;
        const newRecord: Omit<ProgressRecordType, 'id'> = {
            activityId: selectedActivityId,
            date: selectedDate,
            qty: dailyQty,
            manualPercentage: (!selectedActivity?.totalQty && manualPercentage !== '') ? Number(manualPercentage) : undefined,
        };
        
        onAddProgress(newRecord);
        setQuantity('');
        setManualPercentage('');
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
    
    const currentCumulativeQtyForDisplay = getCumulativeBeforeDate(selectedDate);
    const canDelete = currentUser.role !== 'Data Entry';

    return (
        <div className="space-y-6">
            <PageHeader
                title="Progress Record"
                subtitle="Select an activity to record or view daily progress."
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-sm">
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">{recordToEdit ? `Editing Record for ${recordToEdit.date}` : 'Record Progress'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className={recordToEdit ? 'pointer-events-none opacity-60' : ''}>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Activity</label>
                                <ProjectTreeSelect
                                    projects={projects}
                                    selectedId={selectedActivityId}
                                    onSelect={handleActivitySelect}
                                    placeholder="Select an activity..."
                                    selectableNodeTypes={['Activity']}
                                />
                            </div>
                            
                            {selectedActivityId && (
                                <>
                                    <hr className="border-slate-200 dark:border-slate-700"/>
                                    <div>
                                        <label htmlFor="date-picker" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                                        <div className="flex">
                                            <input type="date" id="date-picker" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                                                className="block w-full pl-3 pr-2 py-2 text-base border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-[#28a745] focus:border-[#28a745] sm:text-sm rounded-l-md"
                                                max={new Date().toISOString().split('T')[0]}
                                                disabled={!!recordToEdit}
                                            />
                                             {!recordToEdit && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                                                    className="relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 focus:border-[#28a745] focus:outline-none focus:ring-1 focus:ring-[#28a745]"
                                                >
                                                    Today
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="quantity" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            {recordToEdit ? 'Daily Quantity Executed' : 'Cumulative Quantity Executed'}
                                        </label>
                                        <div className="relative">
                                            <input type="number" id="quantity" value={quantity} onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                                                className="block w-full pl-3 pr-12 py-2 text-base border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-[#28a745] focus:border-[#28a745] sm:text-sm rounded-md"
                                                placeholder={recordToEdit ? '' : `Current is ${currentCumulativeQtyForDisplay.toFixed(2)}`}
                                                step="any" min={recordToEdit ? 0 : currentCumulativeQtyForDisplay}
                                            />
                                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                <span className="text-slate-500 sm:text-sm">{selectedActivity?.uom}</span>
                                            </div>
                                        </div>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            {recordToEdit ? 'Enter the quantity executed only for this day.' : 'Enter the total quantity completed up to the selected date.'}
                                        </p>
                                    </div>
                                    {!selectedActivity.totalQty && (
                                        <div>
                                            <label htmlFor="manualPercentage" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                {recordToEdit ? 'Manual Progress % (Optional)' : 'Cumulative Progress % (Optional)'}
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

                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-sm">
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
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Date</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Daily Qty</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Cumulative Qty</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Progress %</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                                    {cumulativeData.map(rec => {
                                        const percentage = selectedActivity.totalQty ? (rec.cumulativeQty / selectedActivity.totalQty) * 100 : rec.manualPercentage ?? null;
                                        return (
                                        <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{rec.date}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 text-right">{rec.qty.toFixed(2)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white text-right">{rec.cumulativeQty.toFixed(2)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400 text-right">
                                                {percentage !== null ? `${Math.min(percentage, 100).toFixed(2)}%` : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                                <button onClick={() => setRecordToEdit(rec)} className="text-[#28a745] hover:text-green-700"><PencilIcon className="h-5 w-5 pointer-events-none" /></button>
                                                {canDelete && <button 
                                                   onClick={() => handleDelete(rec)}
                                                   className="text-red-600 hover:text-red-900"><TrashIcon className="h-5 w-5 pointer-events-none" /></button>}
                                            </td>
                                        </tr>
                                    )})}
                                </tbody>
                            </table>
                            {cumulativeData.length === 0 && (
                                <p className="text-center text-slate-500 dark:text-slate-400 py-8">No progress records for this activity.</p>
                            )}
                        </div>
                    </>
                   ) : (
                        <p className="text-center text-slate-500 dark:text-slate-400 py-8">Please select an activity to view progress.</p>
                   )}
                </div>
            </div>
            {errorMessage && (
                <Modal title="Validation Error" onClose={() => setErrorMessage(null)}>
                    <div className="p-6">
                        <p className="text-slate-700 dark:text-slate-300">{errorMessage}</p>
                    </div>
                    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 text-right">
                        <button
                            type="button"
                            onClick={() => setErrorMessage(null)}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#28a745] hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#28a745]"
                        >
                            OK
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default ProgressRecordPage;