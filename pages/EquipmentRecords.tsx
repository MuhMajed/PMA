import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Equipment, EquipmentRecord, Project, Employee, User, Shift, EquipmentStatus } from '../types';
import PageHeader from '../components/ui/PageHeader';
import { useMessage } from '../components/ConfirmationProvider';
import SearchableSelect from '../components/ui/SearchableSelect';
import { ProjectTreeSelect } from '../components/ProjectTreeSelect';
import { PencilIcon } from '../components/icons/PencilIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { PlusIcon } from '../components/icons/PlusIcon';

interface EquipmentRecordsPageProps {
    equipment: Equipment[];
    equipmentRecords: EquipmentRecord[];
    projects: Project[];
    employees: Employee[];
    onAdd: (record: Omit<EquipmentRecord, 'id'>) => void;
    onUpdate: (record: EquipmentRecord) => void;
    onDelete: (id: string) => void;
    currentUser: User;
}

const EquipmentRecordsPage: React.FC<EquipmentRecordsPageProps> = ({ 
    equipment, equipmentRecords, projects, employees, onAdd, onUpdate, onDelete, currentUser 
}) => {
    const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [recordToEdit, setRecordToEdit] = useState<EquipmentRecord | null>(null);

    // Form state
    const [projectId, setProjectId] = useState<string | null>(null);
    const [status, setStatus] = useState<EquipmentStatus>(EquipmentStatus.WORKING);
    const [hoursWorked, setHoursWorked] = useState<number | ''>('');
    const [shift, setShift] = useState<Shift>(Shift.DAY);
    const [remarks, setRemarks] = useState('');
    const [operatorId, setOperatorId] = useState<string | undefined>('');
    
    const { showError, showConfirmation } = useMessage();
    const canModify = currentUser.role === 'Admin' || currentUser.role === 'Data Entry';

    const selectedEquipment = useMemo(() => equipment.find(e => e.id === selectedEquipmentId), [equipment, selectedEquipmentId]);
    const employeeMap = useMemo(() => new Map(employees.map(e => [e.empId, e.name])), [employees]);

    const recordsForSelection = useMemo(() => 
        equipmentRecords.filter(r => r.equipmentId === selectedEquipmentId && r.date === selectedDate),
    [equipmentRecords, selectedEquipmentId, selectedDate]);
    
    const resetForm = useCallback(() => {
        setRecordToEdit(null);
        setProjectId(null);
        setStatus(EquipmentStatus.WORKING);
        setHoursWorked('');
        setShift(Shift.DAY);
        setRemarks('');
        setOperatorId(selectedEquipment?.operatorId || '');
    }, [selectedEquipment]);

    useEffect(() => {
        // When equipment selection changes, reset the form and prepopulate operator
        resetForm();
    }, [selectedEquipmentId, selectedDate, resetForm]);
    
    useEffect(() => {
        if(recordToEdit) {
            setProjectId(recordToEdit.project);
            setStatus(recordToEdit.status);
            setHoursWorked(recordToEdit.hoursWorked ?? '');
            setShift(recordToEdit.shift);
            setRemarks(recordToEdit.remarks || '');
            setOperatorId(recordToEdit.operatorId || selectedEquipment?.operatorId);
        }
    }, [recordToEdit, selectedEquipment]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectId) {
            showError('Missing Information', 'Please select a project/activity.');
            return;
        }

        const hours = status === EquipmentStatus.WORKING ? Number(hoursWorked) : 0;
        if (status === EquipmentStatus.WORKING) {
            if (hoursWorked === '' || isNaN(Number(hoursWorked)) || Number(hoursWorked) <= 0) {
                showError('Invalid Input', 'Hours worked is mandatory and must be a positive number for "Working" status.');
                return;
            }
        }
        
        const recordData = {
            equipmentId: selectedEquipmentId!,
            date: selectedDate,
            project: projectId,
            status,
            hoursWorked: hours,
            shift,
            remarks: remarks || undefined,
            operatorId: operatorId || undefined,
            createdBy: currentUser.id,
        };

        if (recordToEdit) {
            onUpdate({ ...recordData, id: recordToEdit.id });
        } else {
            onAdd(recordData);
        }
        resetForm();
    };

    const handleDelete = (id: string) => {
        showConfirmation('Delete Record', 'Are you sure you want to delete this record?', () => onDelete(id));
    };

    const equipmentOptions = useMemo(() => equipment.map(e => ({ value: e.id, label: `${e.name} (${e.plateNo})`})), [equipment]);

    return (
        <div className="space-y-6">
            <PageHeader title="Equipment Records" subtitle="Log daily activities for equipment and vehicles." />
            
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Select Equipment</label>
                        <SearchableSelect options={equipmentOptions} value={selectedEquipmentId} onChange={setSelectedEquipmentId} placeholder="Search for equipment..." />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                         <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                            className="block w-full pl-3 pr-2 py-2 text-base border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-[#28a745] focus:border-[#28a745] sm:text-sm rounded-md"
                            max={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                </div>
            </div>

            {selectedEquipment && (
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {canModify && (
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-sm">
                                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">{recordToEdit ? 'Edit Record' : 'Add New Record'}</h3>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Project / Activity</label>
                                        <ProjectTreeSelect projects={projects} selectedId={projectId} onSelect={setProjectId} />
                                    </div>
                                     <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                                        <select value={status} onChange={e => setStatus(e.target.value as EquipmentStatus)} className="w-full mt-1 block border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-slate-700">
                                            {Object.values(EquipmentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    {status === EquipmentStatus.WORKING && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Hours Worked</label>
                                            <input type="number" value={hoursWorked} onChange={e => setHoursWorked(e.target.value === '' ? '' : parseFloat(e.target.value))} className="w-full mt-1 block border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-slate-700" step="0.5" min="0.5" />
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Shift</label>
                                        <select value={shift} onChange={e => setShift(e.target.value as Shift)} className="w-full mt-1 block border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-slate-700">
                                            {Object.values(Shift).map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                     <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Daily Operator (optional)</label>
                                        <input type="text" value={operatorId} onChange={e => setOperatorId(e.target.value)} className="w-full mt-1 block border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-slate-700" list="employee-ids" placeholder={`Default: ${selectedEquipment.operatorId}`} />
                                        <datalist id="employee-ids">
                                            {employees.map(e => <option key={e.id} value={e.empId}>{e.name}</option>)}
                                        </datalist>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Remarks</label>
                                        <textarea value={remarks} onChange={e => setRemarks(e.target.value)} className="w-full mt-1 block border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-slate-700" rows={3}></textarea>
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
                    <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-sm">
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Records for {selectedDate}</h3>
                        {recordsForSelection.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                    <thead className="bg-slate-50 dark:bg-slate-700">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase">Project</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase">Status</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase">Hours</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase">Operator</th>
                                            {canModify && <th className="relative px-4 py-3"><span className="sr-only">Actions</span></th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                        {recordsForSelection.map(rec => (
                                            <tr key={rec.id}>
                                                <td className="px-4 py-3 text-sm">{projects.find(p => p.id === rec.project)?.name || 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm">{rec.status}</td>
                                                <td className="px-4 py-3 text-sm">{rec.hoursWorked}</td>
                                                <td className="px-4 py-3 text-sm">{employeeMap.get(rec.operatorId || selectedEquipment.operatorId) || 'N/A'}</td>
                                                {canModify && (
                                                    <td className="px-4 py-3 text-right text-sm space-x-4">
                                                        <button onClick={() => setRecordToEdit(rec)} className="text-[#28a745]"><PencilIcon className="h-5 w-5" /></button>
                                                        <button onClick={() => handleDelete(rec.id)} className="text-red-600"><TrashIcon className="h-5 w-5" /></button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-center text-sm text-slate-500 py-8">No records found for this equipment on the selected date.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EquipmentRecordsPage;