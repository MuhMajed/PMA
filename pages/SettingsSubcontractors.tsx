import React, { useState, useMemo } from 'react';
import { Subcontractor, ManpowerRecord, User } from '../types';
import PageHeader from '../components/ui/PageHeader';
import AddSubcontractorModal from '../components/AddSubcontractorModal';
import { PlusIcon } from '../components/icons/PlusIcon';
import { PencilIcon } from '../components/icons/PencilIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { ImportIcon } from '../components/icons/ImportIcon';
import { ExportIcon } from '../components/icons/ExportIcon';
import { exportToExcel, importFromExcel, downloadSubcontractorTemplate } from '../utils/excel';
import { NATIONALITIES } from '../constants';
import { useMessage } from '../components/ConfirmationProvider';
import Tooltip from '../components/ui/Tooltip';
import { DownloadIcon } from '../components/icons/DownloadIcon';
import { ChevronUpDownIcon } from '../components/icons/ChevronUpDownIcon';

type SortDirection = 'ascending' | 'descending';
type SortableSubcontractor = Subcontractor & { mainContractorName?: string };
interface SortConfig {
  key: keyof SortableSubcontractor;
  direction: SortDirection;
}

const useSortableData = (items: SortableSubcontractor[], config: SortConfig | null = null) => {
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
  const requestSort = (key: keyof SortableSubcontractor) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
    setSortConfig({ key, direction });
  };
  return { items: sortedItems, requestSort, sortConfig };
};

const SortableHeader: React.FC<{ sortKey: keyof SortableSubcontractor, title: string, requestSort: (key: any) => void, sortConfig: SortConfig | null }> = ({ sortKey, title, requestSort, sortConfig }) => {
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
    const [filters, setFilters] = useState({ name: '', contactPerson: '', nationality: '', scope: '', mainContractorId: '' });
    const { showConfirmation, showMessage, showError } = useMessage();
    const isReadOnly = currentUser.role !== 'Admin';

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({...prev, [e.target.name]: e.target.value}));
    };

    const subsWithMainContractorName = useMemo(() => {
        const subMap = new Map(subcontractors.map(s => [s.id, s.name]));
        return subcontractors.map(s => ({
            ...s,
            mainContractorName: s.mainContractorId ? subMap.get(s.mainContractorId) || 'N/A' : 'N/A'
        }));
    }, [subcontractors]);

    const filteredSubcontractors = useMemo(() => subsWithMainContractorName.filter(sub => (
        sub.name.toLowerCase().includes(filters.name.toLowerCase()) &&
        sub.contactPerson.toLowerCase().includes(filters.contactPerson.toLowerCase()) &&
        (filters.nationality === '' || sub.nationality === filters.nationality) &&
        (filters.scope === '' || sub.scope === filters.scope) &&
        (filters.mainContractorId === '' || sub.mainContractorId === filters.mainContractorId)
    )), [subsWithMainContractorName, filters]);
    
    const { items: sortedSubcontractors, requestSort, sortConfig } = useSortableData(filteredSubcontractors, { key: 'name', direction: 'ascending' });

    const openModal = (sub: Subcontractor | null) => { if (!isReadOnly) { setSubToEdit(sub); setIsModalOpen(true); }};
    const closeModal = () => { setIsModalOpen(false); setSubToEdit(null); };
    
    const handleDelete = (sub: Subcontractor) => {
        if (isReadOnly) return;
        showConfirmation('Delete Subcontractor', `Are you sure you want to delete "${sub.name}"?`, () => onDelete(sub.id));
    };

    const isSubInUse = (name: string) => records.some(record => record.subcontractor === name);

    const handleExport = () => exportToExcel(subcontractors.map(({id, ...rest}) => rest), "Subcontractors");

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || isReadOnly) return;
        try {
            const data = await importFromExcel(file);
            const newSubs: Omit<Subcontractor, 'id'>[] = data.map((row: any) => ({
                name: String(row.name),
                contactPerson: String(row.contactPerson), email: String(row.email), website: String(row.website),
                nationality: String(row.nationality), scope: String(row.scope), mainContractorId: String(row.mainContractorId || ''),
            }));
            const updatedSubs = [...subcontractors];
            newSubs.forEach(newSub => {
                if (newSub.name && !updatedSubs.some(s => s.name === newSub.name)) {
                    updatedSubs.push({ ...newSub, id: `sub-import-${Date.now()}-${Math.random()}`});
                }
            });
            onSetSubcontractors(updatedSubs);
            showMessage('Import Successful', 'Subcontractors imported successfully!');
        } catch (error) {
            console.error("Error importing subcontractors:", error);
            showError('Import Failed', 'Failed to import subcontractors. Please check the file format.');
        }
        event.target.value = '';
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Settings: Subcontractors" subtitle="Manage all subcontractor company details.">
                {!isReadOnly && <div className="flex flex-wrap gap-3">
                    <button onClick={downloadSubcontractorTemplate} className="flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700">
                        <DownloadIcon className="h-5 w-5 mr-2" /> Download Template
                    </button>
                    <label className="flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer">
                        <ImportIcon className="h-5 w-5 mr-2" /> Import
                        <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleImport} />
                    </label>
                    <button onClick={handleExport} className="flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700">
                        <ExportIcon className="h-5 w-5 mr-2" /> Export
                    </button>
                    <button onClick={() => openModal(null)} className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#28a745] hover:bg-green-700">
                        <PlusIcon className="h-5 w-5 mr-2" /> Add Subcontractor
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
                                <SortableHeader sortKey="name" title="Name" requestSort={requestSort} sortConfig={sortConfig} />
                                <SortableHeader sortKey="mainContractorName" title="Main Contractor" requestSort={requestSort} sortConfig={sortConfig} />
                                <SortableHeader sortKey="contactPerson" title="Contact Person" requestSort={requestSort} sortConfig={sortConfig} />
                                <SortableHeader sortKey="email" title="Email" requestSort={requestSort} sortConfig={sortConfig} />
                                <SortableHeader sortKey="scope" title="Scope" requestSort={requestSort} sortConfig={sortConfig} />
                                {!isReadOnly && <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                            {sortedSubcontractors.map((sub) => (
                                <tr key={sub.id}>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{sub.name}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{sub.mainContractorName}</td>
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
                 <div className="flex items-center justify-between p-4 text-sm text-slate-500 dark:text-slate-400">
                     <span>Showing {sortedSubcontractors.length} of {subcontractors.length} subcontractors</span>
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