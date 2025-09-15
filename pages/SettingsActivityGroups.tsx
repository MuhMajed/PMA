import React, { useState, useMemo, useCallback } from 'react';
import { Project, User, ActivityGroup, ActivityGroupMapping } from '../types';
import PageHeader from '../components/ui/PageHeader';
import Modal from '../components/ui/Modal';
import { PlusIcon } from '../components/icons/PlusIcon';
import { PencilIcon } from '../components/icons/PencilIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { useMessage } from '../components/ConfirmationProvider';
import { ProjectMultiSelectFilter } from '../components/ProjectMultiSelectFilter';

interface SettingsActivityGroupsProps {
    projects: Project[];
    activityGroups: ActivityGroup[];
    activityGroupMappings: ActivityGroupMapping[];
    onAdd: (group: Omit<ActivityGroup, 'id'>) => void;
    onUpdate: (group: ActivityGroup) => void;
    onDelete: (id: string) => void;
    onSetMappings: (groupId: string, activityIds: string[]) => void;
    currentUser: User;
}

const SettingsActivityGroups: React.FC<SettingsActivityGroupsProps> = ({ 
    projects, activityGroups, activityGroupMappings, onAdd, onUpdate, onDelete, onSetMappings, currentUser 
}) => {
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [groupToEdit, setGroupToEdit] = useState<ActivityGroup | null>(null);
    const [formData, setFormData] = useState<Omit<ActivityGroup, 'id'>>({ name: '', uom: '', universalNorm: 0 });
    const { showConfirmation, showError } = useMessage();
    
    const isReadOnly = currentUser.role !== 'Admin';

    const allActivities = useMemo(() => projects.filter(p => p.type === 'Activity'), [projects]);

    const mappedActivityIds = useMemo(() => {
        if (!selectedGroupId) return [];
        return activityGroupMappings
            .filter(m => m.activityGroupId === selectedGroupId)
            .map(m => m.activityId);
    }, [selectedGroupId, activityGroupMappings]);

    const openModal = (group: ActivityGroup | null) => {
        if (isReadOnly) return;
        setGroupToEdit(group);
        setFormData(group || { name: '', uom: '', universalNorm: 0, companyNorm: undefined, rate: undefined });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setGroupToEdit(null);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const isNumeric = ['universalNorm', 'companyNorm', 'rate'].includes(name);
        setFormData(prev => ({
            ...prev,
            [name]: isNumeric ? (value === '' ? undefined : Number(value)) : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.name.trim() === '' || formData.uom.trim() === '' || typeof formData.universalNorm !== 'number') {
            showError('Missing Information', 'Group Name, UOM, and Universal Norm are required.');
            return;
        }

        if (groupToEdit) {
            onUpdate({ ...formData, id: groupToEdit.id });
        } else {
            onAdd(formData);
        }
        closeModal();
    };

    const handleDelete = (group: ActivityGroup) => {
        if (isReadOnly) return;
        showConfirmation(
            'Delete Activity Group',
            `Are you sure you want to delete "${group.name}"? This will unmap it from all activities.`,
            () => {
                onDelete(group.id);
                if (selectedGroupId === group.id) {
                    setSelectedGroupId(null);
                }
            }
        );
    };
    
    const handleMappingChange = (newActivityIds: string[]) => {
        if (selectedGroupId) {
            onSetMappings(selectedGroupId, newActivityIds);
        }
    };
    
    const sortedGroups = useMemo(() => [...activityGroups].sort((a,b) => a.name.localeCompare(b.name)), [activityGroups]);
    const projectsForFilter = useMemo(() => projects.filter(p => p.type !== 'Activity'), [projects]);


    return (
        <div className="space-y-6">
            <PageHeader
                title="Settings: Activity Groups"
                subtitle="Create groups of work types and map them to activities in the project hierarchy."
            >
                {!isReadOnly && (
                    <button onClick={() => openModal(null)} className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#28a745] hover:bg-green-700">
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Add Activity Group
                    </button>
                )}
            </PageHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[75vh]">
                <div className="md:col-span-1 bg-white dark:bg-slate-800 shadow-sm rounded-lg flex flex-col h-full">
                    <h3 className="p-4 text-lg font-medium text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700">Activity Groups</h3>
                    <ul className="divide-y divide-slate-200 dark:divide-slate-700 overflow-y-auto">
                        {sortedGroups.map(group => (
                            <li key={group.id} 
                                className={`p-3 cursor-pointer ${selectedGroupId === group.id ? 'bg-green-100 dark:bg-slate-700' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                                onClick={() => setSelectedGroupId(group.id)}
                            >
                                <div className="flex justify-between items-center">
                                    <div className="flex-1">
                                        <p className="font-semibold text-slate-800 dark:text-slate-200">{group.name}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">UOM: {group.uom}, UN: {group.universalNorm}</p>
                                    </div>
                                    {!isReadOnly && (
                                        <div className="flex items-center space-x-2">
                                            <button onClick={(e) => { e.stopPropagation(); openModal(group); }} className="text-[#28a745] hover:text-green-700 p-1 rounded-full"><PencilIcon className="h-4 w-4" /></button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(group); }} className="text-red-500 hover:text-red-700 p-1 rounded-full"><TrashIcon className="h-4 w-4" /></button>
                                        </div>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="md:col-span-2 bg-white dark:bg-slate-800 shadow-sm rounded-lg h-full p-4">
                    {selectedGroupId ? (
                        <>
                           <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Map Activities to "{activityGroups.find(g => g.id === selectedGroupId)?.name}"</h3>
                            <ProjectMultiSelectFilter
                                projects={projects}
                                selectedIds={mappedActivityIds}
                                onSelectionChange={handleMappingChange}
                            />
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                             <p className="text-slate-500 dark:text-slate-400">Select an activity group to map it to activities.</p>
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <Modal title={groupToEdit ? 'Edit Activity Group' : 'Add Activity Group'} onClose={closeModal}>
                    <form onSubmit={handleSubmit}>
                        <div className="p-6 space-y-4">
                            <input type="text" name="name" value={formData.name} onChange={handleFormChange} placeholder="Group Name" required className="w-full mt-1 block border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 bg-white dark:bg-slate-700"/>
                            <input type="text" name="uom" value={formData.uom} onChange={handleFormChange} placeholder="Unit of Measurement (e.g., m³)" required className="w-full mt-1 block border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 bg-white dark:bg-slate-700"/>
                             <div className="grid grid-cols-2 gap-4">
                                <input type="number" name="universalNorm" value={formData.universalNorm ?? ''} onChange={handleFormChange} placeholder="Universal Norm" required step="any" min="0" className="w-full mt-1 block border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 bg-white dark:bg-slate-700"/>
                                <input type="number" name="companyNorm" value={formData.companyNorm ?? ''} onChange={handleFormChange} placeholder="Company Norm (optional)" step="any" min="0" className="w-full mt-1 block border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 bg-white dark:bg-slate-700"/>
                             </div>
                             <input type="number" name="rate" value={formData.rate ?? ''} onChange={handleFormChange} placeholder="Rate (optional)" step="any" min="0" className="w-full mt-1 block border border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 bg-white dark:bg-slate-700"/>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 text-right space-x-3">
                            <button type="button" onClick={closeModal} className="px-4 py-2 border rounded-md">Cancel</button>
                            <button type="submit" className="px-4 py-2 border rounded-md text-white bg-[#28a745]">Save</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default SettingsActivityGroups;
