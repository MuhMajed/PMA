import React, { useState } from 'react';
import { ManpowerRecord, User } from '../types';
import PageHeader from '../components/ui/PageHeader';
import Modal from '../components/ui/Modal';
import { PlusIcon } from '../components/icons/PlusIcon';
import { PencilIcon } from '../components/icons/PencilIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { ImportIcon } from '../components/icons/ImportIcon';
import { ExportIcon } from '../components/icons/ExportIcon';
import { exportToExcel, importFromExcel, downloadProfessionsTemplate } from '../utils/excel';
import { useConfirmation } from '../components/ConfirmationProvider';
import Tooltip from '../components/ui/Tooltip';
import { DownloadIcon } from '../components/icons/DownloadIcon';

interface SettingsProfessionsProps {
    professions: string[];
    records: ManpowerRecord[];
    onAdd: (name: string) => void;
    onEdit: (oldName: string, newName: string) => void;
    onDelete: (name: string) => void;
    onSetProfessions: (professions: string[]) => void;
    currentUser: User;
}

const SettingsProfessions: React.FC<SettingsProfessionsProps> = ({ professions, records, onAdd, onEdit, onDelete, onSetProfessions, currentUser }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProfession, setCurrentProfession] = useState<string | null>(null);
    const [professionName, setProfessionName] = useState('');
    const { showConfirmation } = useConfirmation();
    
    const isReadOnly = currentUser.role !== 'Admin';

    const openModal = (profession: string | null) => {
        if (isReadOnly) return;
        setCurrentProfession(profession);
        setProfessionName(profession || '');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentProfession(null);
        setProfessionName('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isReadOnly) return;
        if (professionName.trim() === '' || professions.includes(professionName.trim())) {
            alert("Profession name cannot be empty or a duplicate.");
            return;
        }

        if (currentProfession) {
            onEdit(currentProfession, professionName.trim());
        } else {
            onAdd(professionName.trim());
        }
        closeModal();
    };
    
    const handleDelete = (profession: string) => {
        if (isReadOnly) return;
        showConfirmation(
            'Delete Profession',
            `Are you sure you want to delete the profession "${profession}"?\nThis action cannot be undone.`,
            () => onDelete(profession)
        );
    };

    const isProfessionInUse = (name: string) => {
        return records.some(record => record.profession === name);
    };

    const handleExport = () => {
        const dataToExport = professions.map(p => ({ professionName: p }));
        exportToExcel(dataToExport, "Professions");
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || isReadOnly) return;

        try {
            const data = await importFromExcel(file);
            const newProfessions = data.map((row: any) => row.professionName).filter(Boolean);
            const updatedProfessions = [...professions];
            newProfessions.forEach(newProf => {
                if (!updatedProfessions.includes(newProf)) {
                    updatedProfessions.push(newProf);
                }
            });
            onSetProfessions(updatedProfessions.sort());
             alert('Professions imported successfully!');
        } catch (error) {
            console.error("Error importing professions:", error);
            alert('Failed to import professions. Check file format (should have a "professionName" column).');
        }
        event.target.value = '';
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Settings: Professions"
                subtitle="Add, edit, or delete job titles and professions."
            >
                {!isReadOnly && <div className="flex space-x-3">
                     <button onClick={downloadProfessionsTemplate} className="flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700">
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
                        Add Profession
                    </button>
                </div>}
            </PageHeader>

            <div className="bg-white dark:bg-slate-800 shadow-sm rounded-lg">
                <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                    {professions.map((profession) => (
                        <li key={profession} className="p-4 flex items-center justify-between">
                            <span className="text-slate-800 dark:text-slate-200">{profession}</span>
                            {!isReadOnly && <div className="flex items-center space-x-4">
                                <button onClick={() => openModal(profession)} className="text-[#28a745] hover:text-green-700">
                                    <PencilIcon className="h-5 w-5 pointer-events-none" />
                                </button>
                                <Tooltip content={isProfessionInUse(profession) ? "Cannot delete: profession is in use" : ''}>
                                    <button
                                        onClick={() => handleDelete(profession)}
                                        disabled={isProfessionInUse(profession)}
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
                    <span>Showing {professions.length} professions</span>
                </div>
            </div>

            {isModalOpen && (
                <Modal title={currentProfession ? 'Edit Profession' : 'Add Profession'} onClose={closeModal}>
                    <form onSubmit={handleSubmit}>
                        <div className="p-6">
                            <label htmlFor="professionName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Profession Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                id="professionName"
                                value={professionName}
                                onChange={(e) => setProfessionName(e.target.value)}
                                required
                                className="mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#28a745] focus:border-[#28a745] sm:text-sm bg-white dark:bg-slate-700"
                            />
                        </div>
                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 text-right space-x-3">
                            <button type="button" onClick={closeModal} className="inline-flex justify-center py-2 px-4 border border-slate-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700">
                                Cancel
                            </button>
                            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#28a745] hover:bg-green-700">
                                {currentProfession ? 'Save Changes' : 'Add Profession'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default SettingsProfessions;