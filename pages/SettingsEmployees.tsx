import React, { useState, useMemo } from 'react';
import { Employee, Subcontractor, User } from '../types';
import PageHeader from '../components/ui/PageHeader';
import AddEmployeeModal from '../components/AddEmployeeModal';
import { PlusIcon } from '../components/icons/PlusIcon';
import { PencilIcon } from '../components/icons/PencilIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { ImportIcon } from '../components/icons/ImportIcon';
import { ExportIcon } from '../components/icons/ExportIcon';
import { downloadEmployeeTemplate, importFromExcel, exportToExcel } from '../utils/excel';
import { useMessage } from '../components/ConfirmationProvider';
import { ChevronUpDownIcon } from '../components/icons/ChevronUpDownIcon';
import { DownloadIcon } from '../components/icons/DownloadIcon';

type SortDirection = 'ascending' | 'descending';

interface SortConfig {
  key: keyof Employee;
  direction: SortDirection;
}

const useSortableData = (items: Employee[], config: SortConfig | null = null) => {
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

  const requestSort = (key: keyof Employee) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  return { items: sortedItems, requestSort, sortConfig };
};

const SortableHeader: React.FC<{
    sortKey: keyof Employee,
    title: string,
    requestSort: (key: any) => void,
    sortConfig: SortConfig | null,
    className?: string,
}> = ({ sortKey, title, requestSort, sortConfig, className }) => {
    const isSorted = sortConfig?.key === sortKey;
    return (
        <th scope="col" className={`px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider cursor-pointer ${className}`} onClick={() => requestSort(sortKey)}>
            <div className="flex items-center">
                <span>{title}</span>
                <ChevronUpDownIcon className={`h-4 w-4 ml-1.5 ${isSorted ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`} />
            </div>
        </th>
    );
};

interface SettingsEmployeesProps {
    employees: Employee[];
    professions: string[];
    subcontractors: Subcontractor[];
    departments: string[];
    onAdd: (employee: Omit<Employee, 'id'>) => void;
    onUpdate: (employee: Employee) => void;
    onDelete: (id: string) => void;
    onSetEmployees: (employees: Employee[]) => void;
    currentUser: User;
}

const SettingsEmployees: React.FC<SettingsEmployeesProps> = ({ employees, professions, subcontractors, departments, onAdd, onUpdate, onDelete, onSetEmployees, currentUser }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
    const [filters, setFilters] = useState({
        name: '',
        empId: '',
        idIqama: '',
        department: '',
        profession: ''
    });
    const { showConfirmation, showError, showMessage } = useMessage();

    const isReadOnly = currentUser.role !== 'Admin';

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({...prev, [name]: value}));
    };

    const openModal = (employee: Employee | null) => {
        if (isReadOnly) return;
        setEmployeeToEdit(employee);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEmployeeToEdit(null);
    };
    
    const handleDelete = (employee: Employee) => {
        if (isReadOnly) return;
        showConfirmation(
            'Delete Employee',
            `Are you sure you want to delete the employee ${employee.name} (ID: ${employee.empId})?\nThis action cannot be undone.`,
            () => onDelete(employee.id)
        );
    };

    const filteredEmployees = useMemo(() => employees.filter(emp => {
        return (
            emp.name.toLowerCase().includes(filters.name.toLowerCase()) &&
            emp.empId.toLowerCase().includes(filters.empId.toLowerCase()) &&
            emp.idIqama.toLowerCase().includes(filters.idIqama.toLowerCase()) &&
            emp.department.toLowerCase().includes(filters.department.toLowerCase()) &&
            (filters.profession === '' || emp.profession === filters.profession)
        );
    }), [employees, filters]);
    
    const { items: sortedEmployees, requestSort, sortConfig } = useSortableData(filteredEmployees, { key: 'name', direction: 'ascending' });
    
    const handleExport = () => {
        exportToExcel(employees.map(({id, ...rest}) => rest), "Employees");
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const data = await importFromExcel(file) as any[];
            const requiredHeaders = ['empId', 'name', 'idIqama', 'profession', 'department', 'phone', 'nationality', 'type', 'subcontractor'];
            if(!data[0] || !requiredHeaders.every(h => h in data[0])) {
                showError('Invalid File Format',`Invalid file format. Required headers are: ${requiredHeaders.join(', ')}. Optional headers are: email, joiningDate.`);
                return;
            }
            
            const importedEmployees: Employee[] = data.map((row: any, index) => ({
                id: `e-import-${Date.now()}-${index}`,
                empId: String(row.empId),
                name: String(row.name),
                idIqama: String(row.idIqama),
                profession: String(row.profession),
                department: String(row.department),
                email: row.email ? String(row.email) : undefined,
                phone: String(row.phone),
                nationality: String(row.nationality),
                type: row.type === 'Direct' ? 'Direct' : 'Indirect',
                subcontractor: String(row.subcontractor),
                joiningDate: row.joiningDate ? String(row.joiningDate) : undefined,
                createdBy: 'Imported',
                modifiedBy: 'Imported',
                modifiedDate: new Date().toISOString().split('T')[0]
            }));

            const existingEmpIds = new Set(employees.map(e => e.empId));
            const newUniqueEmployees = importedEmployees.filter(e => e.empId && !existingEmpIds.has(e.empId));

            if(newUniqueEmployees.length > 0) {
                 onSetEmployees([...employees, ...newUniqueEmployees]);
                showMessage('Import Successful', `${newUniqueEmployees.length} new employees imported successfully!`);
            } else {
                showMessage('Import Information', 'No new employees found to import. All employee IDs in the file already exist.');
            }
        } catch (error) {
            console.error("Error importing employees:", error);
            showError('Import Failed', 'Failed to import employees. Please check the file format and content.');
        }
        event.target.value = '';
    };


    return (
        <div className="space-y-6">
            <PageHeader
                title="Settings: Employees"
                subtitle="Manage your master list of all employees."
            >
                 <div className="flex flex-wrap gap-3">
                    {!isReadOnly && (
                        <>
                             <button onClick={downloadEmployeeTemplate} className="flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700">
                                <DownloadIcon className="h-5 w-5 mr-2" />
                                Download Template
                            </button>
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
                                Add Employee
                            </button>
                        </>
                    )}
                </div>
            </PageHeader>

             <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    <input type="text" name="name" placeholder="Filter by Name..." value={filters.name} onChange={handleFilterChange} className="block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-700 focus:ring-[#28a745] focus:border-[#28a745] sm:text-sm" />
                    <input type="text" name="empId" placeholder="Filter by Employee ID..." value={filters.empId} onChange={handleFilterChange} className="block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-700 focus:ring-[#28a745] focus:border-[#28a745] sm:text-sm" />
                    <input type="text" name="idIqama" placeholder="Filter by ID/Iqama..." value={filters.idIqama} onChange={handleFilterChange} className="block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-700 focus:ring-[#28a745] focus:border-[#28a745] sm:text-sm" />
                    <input type="text" name="department" placeholder="Filter by Department..." value={filters.department} onChange={handleFilterChange} className="block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-700 focus:ring-[#28a745] focus:border-[#28a745] sm:text-sm" />
                    <select name="profession" value={filters.profession} onChange={handleFilterChange} className="block w-full border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-700 focus:ring-[#28a745] focus:border-[#28a745] sm:text-sm">
                        <option value="">All Professions</option>
                        {professions.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 shadow-sm rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                         <thead className="bg-slate-50 dark:bg-slate-700">
                            <tr>
                                <SortableHeader sortKey="empId" title="Emp ID" requestSort={requestSort} sortConfig={sortConfig} />
                                <SortableHeader sortKey="name" title="Name" requestSort={requestSort} sortConfig={sortConfig} />
                                <SortableHeader sortKey="idIqama" title="ID/Iqama" requestSort={requestSort} sortConfig={sortConfig} />
                                <SortableHeader sortKey="profession" title="Profession" requestSort={requestSort} sortConfig={sortConfig} />
                                <SortableHeader sortKey="department" title="Department" requestSort={requestSort} sortConfig={sortConfig} />
                                <SortableHeader sortKey="subcontractor" title="Subcontractor" requestSort={requestSort} sortConfig={sortConfig} />
                                <SortableHeader sortKey="type" title="Type" requestSort={requestSort} sortConfig={sortConfig} />
                                {!isReadOnly && <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                            {sortedEmployees.map(emp => (
                                <tr key={emp.id}>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{emp.empId}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{emp.name}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{emp.idIqama}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{emp.profession}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{emp.department}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{emp.subcontractor}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{emp.type}</td>
                                    {!isReadOnly && <td className="px-6 py-4 text-right text-sm font-medium space-x-4">
                                        <button onClick={() => openModal(emp)} className="text-[#28a745] hover:text-green-700"><PencilIcon className="h-5 w-5 pointer-events-none" /></button>
                                        <button onClick={() => handleDelete(emp)} className="text-red-600 hover:text-red-900"><TrashIcon className="h-5 w-5 pointer-events-none" /></button>
                                    </td>}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 <div className="flex items-center justify-between p-4 text-sm text-slate-500 dark:text-slate-400">
                    <span>Showing {sortedEmployees.length} of {employees.length} employees</span>
                </div>
            </div>

            {isModalOpen && (
                <AddEmployeeModal
                    onClose={closeModal}
                    onAdd={onAdd}
                    onEdit={onUpdate}
                    employeeToEdit={employeeToEdit}
                    professions={professions}
                    subcontractors={subcontractors}
                    departments={departments}
                />
            )}
        </div>
    );
};

export default SettingsEmployees;