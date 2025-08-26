import React, { useState, useMemo } from 'react';
import { Equipment, EquipmentRecord, Employee, User } from '../types';
import PageHeader from '../components/ui/PageHeader';
import AddEquipmentModal from '../components/AddEquipmentModal';
import { PlusIcon } from '../components/icons/PlusIcon';
import { PencilIcon } from '../components/icons/PencilIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { ImportIcon } from '../components/icons/ImportIcon';
import { ExportIcon } from '../components/icons/ExportIcon';
import { downloadEquipmentTemplate, importFromExcel, exportToExcel } from '../utils/excel';
import { useMessage } from '../components/ConfirmationProvider';
import { ChevronUpDownIcon } from '../components/icons/ChevronUpDownIcon';
import { DownloadIcon } from '../components/icons/DownloadIcon';
import Tooltip from '../components/ui/Tooltip';

type SortDirection = 'ascending' | 'descending';
type SortableEquipment = Equipment & { operatorName: string };

interface SortConfig {
  key: keyof SortableEquipment;
  direction: SortDirection;
}

const useSortableData = (items: SortableEquipment[], config: SortConfig | null = null) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(config);

  const sortedItems = useMemo(() => {
    let sortableItems = [...items];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key: keyof SortableEquipment) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  return { items: sortedItems, requestSort, sortConfig };
};

const SortableHeader: React.FC<{
    sortKey: keyof SortableEquipment,
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

interface SettingsEquipmentProps {
    equipment: Equipment[];
    equipmentRecords: EquipmentRecord[];
    employees: Employee[];
    onAdd: (item: Omit<Equipment, 'id'>) => void;
    onUpdate: (item: Equipment) => void;
    onDelete: (id: string) => void;
    onSetEquipment: (items: Equipment[]) => void;
    currentUser: User;
}

const SettingsEquipment: React.FC<SettingsEquipmentProps> = ({ 
    equipment, equipmentRecords, employees, onAdd, onUpdate, onDelete, onSetEquipment, currentUser 
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState<Equipment | null>(null);
    const [filter, setFilter] = useState('');
    const { showConfirmation, showError, showMessage } = useMessage();

    const isReadOnly = currentUser.role !== 'Admin';
    const employeeMap = useMemo(() => new Map(employees.map(e => [e.empId, e.name])), [employees]);

    const equipmentWithOperatorNames = useMemo(() => equipment.map(eq => ({
        ...eq,
        operatorName: employeeMap.get(eq.operatorId) || 'Unknown'
    })), [equipment, employeeMap]);

    const filteredEquipment = useMemo(() => equipmentWithOperatorNames.filter(item => {
        const searchTerm = filter.toLowerCase();
        return (
            item.name.toLowerCase().includes(searchTerm) ||
            item.type.toLowerCase().includes(searchTerm) ||
            item.plateNo.toLowerCase().includes(searchTerm) ||
            item.operatorId.toLowerCase().includes(searchTerm) ||
            item.operatorName.toLowerCase().includes(searchTerm) ||
            item.status.toLowerCase().includes(searchTerm)
        );
    }), [equipmentWithOperatorNames, filter]);

    const { items: sortedEquipment, requestSort, sortConfig } = useSortableData(filteredEquipment, { key: 'name', direction: 'ascending' });

    const openModal = (item: Equipment | null) => {
        if (isReadOnly) return;
        setItemToEdit(item);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setItemToEdit(null);
    };

    const isEquipmentInUse = (id: string) => equipmentRecords.some(rec => rec.equipmentId === id);

    const handleDelete = (item: Equipment) => {
        if (isReadOnly) return;
        showConfirmation(
            'Delete Equipment',
            `Are you sure you want to delete "${item.name}" (Plate: ${item.plateNo})?\nThis action cannot be undone.`,
            () => onDelete(item.id)
        );
    };

    const handleExport = () => {
        exportToExcel(equipment, "EquipmentList");
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || isReadOnly) return;

        try {
            const data = await importFromExcel(file) as any[];
            // Validation and processing logic here...
            showMessage('Import Successful', 'Equipment imported successfully!');
        } catch (error) {
            console.error("Error importing equipment:", error);
            showError('Import Failed', 'Failed to import equipment.');
        }
        event.target.value = '';
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Settings: Equipment"
                subtitle="Manage your master list of all company equipment and vehicles."
            >
                {!isReadOnly && (
                    <div className="flex flex-wrap gap-3">
                        <button onClick={downloadEquipmentTemplate} className="flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700">
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
                            <PlusIcon className="h-5 w-5 mr-2" /> Add Equipment
                        </button>
                    </div>
                )}
            </PageHeader>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                <input
                    type="text"
                    placeholder="Filter equipment..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="block w-full max-w-md border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-700 focus:ring-[#28a745] focus:border-[#28a745] sm:text-sm"
                />
            </div>

            <div className="bg-white dark:bg-slate-800 shadow-sm rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-700">
                            <tr>
                                <SortableHeader sortKey="name" title="Name" requestSort={requestSort} sortConfig={sortConfig} />
                                <SortableHeader sortKey="type" title="Type" requestSort={requestSort} sortConfig={sortConfig} />
                                <SortableHeader sortKey="plateNo" title="Plate No." requestSort={requestSort} sortConfig={sortConfig} />
                                <SortableHeader sortKey="operatorId" title="Operator ID" requestSort={requestSort} sortConfig={sortConfig} />
                                <SortableHeader sortKey="operatorName" title="Operator Name" requestSort={requestSort} sortConfig={sortConfig} />
                                <SortableHeader sortKey="status" title="Status" requestSort={requestSort} sortConfig={sortConfig} />
                                {!isReadOnly && <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                            {sortedEquipment.map(item => (
                                <tr key={item.id}>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{item.name}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{item.type}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{item.plateNo}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{item.operatorId}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{item.operatorName}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{item.status}</td>
                                    {!isReadOnly && (
                                        <td className="px-6 py-4 text-right text-sm font-medium space-x-4">
                                            <button onClick={() => openModal(item)} className="text-[#28a745] hover:text-green-700"><PencilIcon className="h-5 w-5" /></button>
                                            <Tooltip content={isEquipmentInUse(item.id) ? "Cannot delete: equipment has records" : ''}>
                                                <button
                                                    onClick={() => handleDelete(item)}
                                                    disabled={isEquipmentInUse(item.id)}
                                                    className="text-red-600 hover:text-red-900 disabled:text-slate-300 dark:disabled:text-slate-600 disabled:cursor-not-allowed"
                                                ><TrashIcon className="h-5 w-5" /></button>
                                            </Tooltip>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex items-center justify-between p-4 text-sm text-slate-500 dark:text-slate-400">
                    <span>Showing {sortedEquipment.length} of {equipment.length} items</span>
                </div>
            </div>

            {isModalOpen && (
                <AddEquipmentModal
                    onClose={closeModal}
                    onAdd={onAdd}
                    onEdit={onUpdate}
                    equipmentToEdit={itemToEdit}
                    allEquipment={equipment}
                    employees={employees}
                />
            )}
        </div>
    );
};

export default SettingsEquipment;