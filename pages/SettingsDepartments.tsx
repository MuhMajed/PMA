import React, { useState } from 'react';
import { Employee, User } from '../types';
import PageHeader from '../components/ui/PageHeader';
import Modal from '../components/ui/Modal';
import { PlusIcon } from '../components/icons/PlusIcon';
import { PencilIcon } from '../components/icons/PencilIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { ImportIcon } from '../components/icons/ImportIcon';
import { ExportIcon } from '../components/icons/ExportIcon';
import { exportToExcel, importFromExcel, downloadDepartmentsTemplate } from '../utils/excel';
import { useConfirmation } from '../components/ConfirmationProvider';
import Tooltip from '../components/ui/Tooltip';
import { DownloadIcon } from '../components/icons/DownloadIcon';

interface SettingsDepartmentsProps {
    departments: string[];
    employees: Employee[];
    onAdd: (name: string) => void;
    onEdit: (oldName: string, newName: string) => void;
    onDelete: (name: string) => void;
    onSetDepartments: (departments: string[]) => void;
    currentUser: User;
}

const SettingsDepartments: React.FC<SettingsDepartmentsProps> = ({ departments, employees, onAdd, onEdit, onDelete, onSetDepartments, currentUser }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentDepartment, setCurrentDepartment] = useState<string | null>(null);
    const [departmentName, setDepartmentName] = useState('');
    const { showConfirmation } = useConfirmation();
    
    const isReadOnly = currentUser.role !== 'Admin';

    const openModal = (department: string | null) => {
        if (isReadOnly) return;
        setCurrentDepartment(department);
        setDepartmentName(department || '');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentDepartment(null);
        setDepartmentName('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isReadOnly) return;
        if (departmentName.trim() === '' || departments.includes(departmentName.trim())) {
            alert("Department name cannot be empty or a duplicate.");
            return;
        }

        if (currentDepartment) {
            onEdit(currentDepartment, departmentName.trim());
        } else {
            onAdd(departmentName.trim());
        }
        closeModal();
    };
    
    const handleDelete = (department: string) => {
        if (isReadOnly) return;
        showConfirmation(
            'Delete Department',
            `Are you sure you want to delete the department "${department}"?\nThis action cannot be undone.`,
            () => onDelete(department)
        );
    };

    const isDepartmentInUse = (name: string) => {
        return employees.some(emp => emp.department === name);
    };

    const handleExport = () => {
        const dataToExport = departments.map(d => ({ departmentName: d }));
        exportToExcel(dataToExport, "Departments");
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || isReadOnly) return;

        try {
            const data = await importFromExcel(file);
            const newDepartments = data.map((row: any) => row.departmentName).filter(Boolean);
            const updatedDepartments = [...departments];
            newDepartments.forEach(newDept => {
                if (!updatedDepartments.includes(newDept)) {
                    updatedDepartments.push(newDept);
                }
            });
            onSetDepartments(updatedDepartments.sort());
             alert('Departments imported successfully!');
        } catch (error) {
            console.error("Error importing departments:", error);
            alert('Failed to import departments. Check file format (should have a "departmentName" column).');
        }
        event.target.value = '';
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Settings: Departments"
                subtitle="Add, edit, or delete company departments."
            >
                {!isReadOnly && <div className="flex space-x-3">
                     <button onClick={downloadDepartmentsTemplate} className="flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700">
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
                        Add Department
                    </button>
                </div>}
            </PageHeader>

            <div className="bg-white dark:bg-slate-800 shadow-sm rounded-lg">
                <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                    {departments.map((department) => (
                        <li key={department} className="p-4 flex items-center justify-between">
                            <span className="text-slate-800 dark:text-slate-200">{department}</span>
                            {!isReadOnly && <div className="flex items-center space-x-4">
                                <button onClick={() => openModal(department)} className="text-[#28a745] hover:text-green-700">
                                    <PencilIcon className="h-5 w-5 pointer-events-none" />
                                </button>
                                <Tooltip content={isDepartmentInUse(department) ? "Cannot delete: department is in use by an employee" : ''}>
                                    <button
                                        onClick={() => handleDelete(department)}
                                        disabled={isDepartmentInUse(department)}
                                        className="text-red-600 disabled:text-slate-300 dark:disabled:text-slate-600 disabled:cursor-not-allowed hover:text-red-900"
                                    >
                                        <TrashIcon className="h-5 w-5 pointer-events-none" />
                                    </button>
                                </Tooltip>
                            </div>}
                        </li>
                    ))}
                </ul>
                 <div className="flex items-center justify-between p-4 text-sm text-slate-500 dark:text-slate-400">
                    <span>Showing {departments.length} departments</span>
                </div>
            </div>

            {isModalOpen && (
                <Modal title={currentDepartment ? 'Edit Department' : 'Add Department'} onClose={closeModal}>
                    <form onSubmit={handleSubmit}>
                        <div className="p-6">
                            <label htmlFor="departmentName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Department Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="departmentName"
                                value={departmentName}
                                onChange={(e) => setDepartmentName(e.target.value)}
                                required
                                autoFocus
                                className="mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#28a745] focus:border-[#28a745] sm:text-sm bg-white dark:bg-slate-700"
                            />
                        </div>
                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 text-right space-x-3">
                            <button type="button" onClick={closeModal} className="inline-flex justify-center py-2 px-4 border border-slate-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700">
                                Cancel
                            </button>
                            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#28a745] hover:bg-green-700">
                                {currentDepartment ? 'Save Changes' : 'Add Department'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};
export default SettingsDepartments;