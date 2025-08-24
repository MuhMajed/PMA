import React, { useState, useMemo } from 'react';
import { Subcontractor, ManpowerRecord, User } from '../types';
import PageHeader from '../components/ui/PageHeader';
import AddSubcontractorModal from '../components/AddSubcontractorModal';
import { PlusIcon } from '../components/icons/PlusIcon';
import { PencilIcon } from '../components/icons/PencilIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { ImportIcon } from '../components/icons/ImportIcon';
import { ExportIcon } from '../components/icons/ExportIcon';
import { exportToExcel, importFromExcel } from '../utils/excel';
import { NATIONALITIES } from '../constants';
import { useConfirmation } from '../components/ConfirmationProvider';
import Tooltip from '../components/ui/Tooltip';

interface SettingsSubcontractorsProps {
    subcontractors: Subcontractor[];
    records: ManpowerRecord[];
    scopes: string[];
    onAdd: (sub: Omit<Subcontractor, 'id'>) => void;
    onUpdate: (sub: Subcontractor) => void;
    onDelete: (id: string) => void;
    onSetSubcontractors: (subs: Subcontractor[]) => void;
    currentUser: User;
}

const SettingsSubcontractors: React.FC<SettingsSubcontractorsProps> = ({ 
    subcontractors, records, scopes, onAdd, onUpdate, onDelete, onSetSubcontractors, currentUser
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [subToEdit, setSubToEdit] = useState<Subcontractor | null>(null);
    const [filters, setFilters] = useState({
        name: '',
        contactPerson: '',
        nationality: '',
        scope: '',
        mainContractorId: ''
    });
    const { showConfirmation } = useConfirmation();

    const isReadOnly = currentUser.role !== 'Admin';

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({...prev, [name]: value}));
    };

    const filteredSubcontractors = useMemo(() => subcontractors.filter(sub => {
        return (
            sub.name.toLowerCase().includes(filters.name.toLowerCase()) &&
            sub.contactPerson.toLowerCase().includes(filters.contactPerson.toLowerCase()) &&
            (filters.nationality === '' || sub.nationality === filters.nationality) &&
            (filters.scope === '' || sub.scope === filters.scope) &&
            (filters.mainContractorId === '' || sub.mainContractorId === filters.mainContractorId)
        );
    }), [subcontractors, filters]);


    const openModal = (sub: Subcontractor | null) => {
        if (isReadOnly) return;
        setSubToEdit(sub);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSubToEdit(null);
    };
    
    const handleDelete = (sub: Subcontractor) => {
        if (isReadOnly) return;
        showConfirmation(
            'Delete Subcontractor',
            `Are you sure you want to delete the subcontractor "${sub.name}"?\nThis action cannot be undone.`,
            () => onDelete(sub.id)
        );
    };

    const isSubInUse = (name: string) => {
        return records.some(record => record.subcontractor === name);
    };

    const handleExport = () => {
        exportToExcel(subcontractors.map(({id, ...rest}) => rest), "Subcontractors");
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || isReadOnly) return;

        try {
            const data = await importFromExcel(file);
            const newSubs: Omit<Subcontractor, 'id'>[] = data.map((row: any) => ({
                name: String(row.name),
                contactPerson: String(row.contactPerson),
                email: String(row.email),
                website: String(row.website),
                nationality: String(row.nationality),
                scope: String(row.scope),
                mainContractorId: String(row.mainContractorId || ''),
            }));

            const updatedSubs = [...subcontractors];
            newSubs.forEach(newSub => {
                if (newSub.name && !updatedSubs.some(s => s.name === newSub.name)) {
                    updatedSubs.push({ ...newSub, id: `sub-import-${Date.now()}-${Math.random()}`});
                }
            });
            onSetSubcontractors(updatedSubs);
            alert('Subcontractors imported successfully!');
        } catch (error) {
            console.error("Error importing subcontractors:", error);
            alert('Failed to import subcontractors. Please check the file format.');
        }
        event.target.value = '';
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Settings: Subcontractors"
                subtitle="Manage all subcontractor company details."
            >
                {!isReadOnly && <div className="flex space-x-3">
                    <label className="flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer">
                        <ImportIcon className="h-5 w-5 mr-2" />
                        Import
                        <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleImport} />
                    </label>
                    <button onClick={handleExport} className="flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700">
                        <ExportIcon className="h-5 w-5 mr-2" />
                        Export
                    </button>
                    <button onClick={() => openModal(null)} className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#28a745] hover:bg-green-700">
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Add Subcontractor
                    </button>
                </div>}
            </PageHeader>
            
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    <input type="text" name="name" placeholder="Filter by Name..." value={filters.name} onChange={handleFilterChange} className="block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-700 focus:ring-[#28a745] focus:border-[#28a745] sm:text-sm" />
                    <input type="text" name="contactPerson" placeholder="Filter by Contact..." value={filters.contactPerson} onChange={handleFilterChange} className="block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-700 focus:ring-[#28a745] focus:border-[#28a745] sm:text-sm" />
                    <select name="nationality" value={filters.nationality} onChange={handleFilterChange} className="block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-700 focus:ring-[#28a745] focus:border-[#28a745] sm:text-sm">
                        <option value="">All Nationalities</option>
                        {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <select name="scope" value={filters.scope} onChange={handleFilterChange} className="block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-700 focus:ring-[#28a745] focus:border-[#28a745] sm:text-sm">
                        <option value="">All Scopes</option>
                        {scopes.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select name="mainContractorId" value={filters.mainContractorId} onChange={handleFilterChange} className="block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-700 focus:ring-[#28a745] focus:border-[#28a745] sm:text-sm">
                        <option value="">All Main Contractors</option>
                        {subcontractors.filter(s => !s.mainContractorId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
            </div>


            <div className="bg-white dark:bg-slate-800 shadow-sm rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Main Contractor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Contact Person</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Scope</th>
                                {!isReadOnly && <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredSubcontractors.map((sub) => (
                                <tr key={sub.id}>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{sub.name}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{subcontractors.find(s => s.id === sub.mainContractorId)?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{sub.contactPerson}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{sub.email}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{sub.scope}</td>
                                    {!isReadOnly && <td className="px-6 py-4 text-right text-sm font-medium space-x-4">
                                        <button onClick={() => openModal(sub)} className="text-[#28a745] hover:text-green-700"><PencilIcon className="h-5 w-5 pointer-events-none" /></button>
                                        <Tooltip content={isSubInUse(sub.name) ? "Cannot delete: subcontractor is in use" : ''}>
                                            <button 
                                                onClick={() => handleDelete(sub)}
                                                disabled={isSubInUse(sub.name)}
                                                className="text-red-600 hover:text-red-900 disabled:text-slate-300 dark:disabled:text-slate-600 disabled:cursor-not-allowed"
                                            >
                                                <TrashIcon className="h-5 w-5 pointer-events-none" />
                                            </button>
                                        </Tooltip>
                                    </td>}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 <div className="flex items-center justify-end p-4 text-sm text-slate-500 dark:text-slate-400">
                     <span>Showing {filteredSubcontractors.length} of {subcontractors.length} subcontractors</span>
                </div>
            </div>

            {isModalOpen && (
                <AddSubcontractorModal
                    onClose={closeModal}
                    onAdd={onAdd}
                    onEdit={onUpdate}
                    subcontractorToEdit={subToEdit}
                    allSubcontractors={subcontractors}
                    scopes={scopes}
                />
            )}
        </div>
    );
};

export default SettingsSubcontractors;