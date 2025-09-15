import React, { useState, useMemo } from 'react';
import { Project, ManpowerRecord, ProjectNodeType, User } from '../types';
import PageHeader from '../components/ui/PageHeader';
import Modal from '../components/ui/Modal';
import { PlusIcon } from '../components/icons/PlusIcon';
import { ImportIcon } from '../components/icons/ImportIcon';
import { ExportIcon } from '../components/icons/ExportIcon';
import { exportToExcel, importFromExcel, exportToBoqExcel, downloadProjectsTemplate } from '../utils/excel';
import { ChevronRightIcon } from '../components/icons/ChevronRightIcon';
import { PencilIcon } from '../components/icons/PencilIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { BuildingIcon } from '../components/icons/BuildingIcon';
import { BuildingOfficeIcon } from '../components/icons/BuildingOfficeIcon';
import { MapPinIcon } from '../components/icons/MapPinIcon';
import { ViewfinderCircleIcon } from '../components/icons/ViewfinderCircleIcon';
import { QrCodeIcon } from '../components/icons/QrCodeIcon';
import { ClipboardDocumentListIcon } from '../components/icons/ClipboardDocumentListIcon';
import { Square3Stack3DIcon } from '../components/icons/Square3Stack3DIcon';
import { useMessage } from '../components/ConfirmationProvider';
import Tooltip from '../components/ui/Tooltip';
import { HIERARCHY, DEFAULT_HIERARCHY_LABELS, UOM_OPTIONS, CURRENCY_OPTIONS } from '../constants';
import { TagIcon } from '../components/icons/TagIcon';
import { DownloadIcon } from '../components/icons/DownloadIcon';


interface SettingsProjectsProps {
    projects: Project[];
    records: ManpowerRecord[];
    onAdd: (project: Omit<Project, 'id'>) => void;
    onEdit: (project: Project) => void;
    onDelete: (id: string) => void;
    onSetProjects: (projects: Project[]) => void;
    currentUser: User;
}

interface ProjectFormData {
    name: string;
    type: ProjectNodeType | '';
    totalQty: number | '';
    hierarchyLabels: Partial<Record<ProjectNodeType, string>>;
    uom: string;
    rate: number | '';
    currency: string;
}

const initialFormData: ProjectFormData = {
    name: '',
    type: '',
    totalQty: '',
    hierarchyLabels: {},
    uom: '',
    rate: '',
    currency: 'SAR',
};

const nodeTypeIcons: Record<ProjectNodeType, React.FC<React.SVGProps<SVGSVGElement>>> = {
    Project: BuildingIcon,
    Level1: MapPinIcon,
    Level2: ViewfinderCircleIcon,
    Level3: BuildingOfficeIcon,
    Level4: Square3Stack3DIcon,
    Level5: QrCodeIcon,
    Level6: TagIcon,
    Level7: TagIcon,
    Level8: TagIcon,
    Level9: TagIcon,
    Activity: ClipboardDocumentListIcon,
};

const getNextNodeType = (parentType: ProjectNodeType | undefined): ProjectNodeType | null => {
    if (!parentType) return 'Project';
    const parentIndex = HIERARCHY.indexOf(parentType);
    if (parentIndex === -1 || parentIndex === HIERARCHY.length - 1) {
        return null;
    }
    return HIERARCHY[parentIndex + 1];
};

const getRootProject = (projectId: string | null, projects: Project[]): Project | null => {
    if (!projectId) return null;
    let current = projects.find(p => p.id === projectId);
    if (!current) return null;

    while (current.parentId) {
        const parent = projects.find(p => p.id === current.parentId);
        if (!parent) break;
        current = parent;
    }
    return current;
};


const SettingsProjects: React.FC<SettingsProjectsProps> = ({ projects, records, onAdd, onEdit, onDelete, onSetProjects, currentUser }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
    const [formData, setFormData] = useState<ProjectFormData>(initialFormData);
    const [currentParentId, setCurrentParentId] = useState<string | null>(null);
    const { showConfirmation, showError, showMessage } = useMessage();
    
    const isReadOnly = currentUser.role !== 'Admin';

    const { breadcrumbs, currentItems, currentParentNode } = useMemo(() => {
        const breadcrumbs: Project[] = [];
        let parentId = currentParentId;
        while (parentId) {
            const parent = projects.find(p => p.id === parentId);
            if (parent) {
                breadcrumbs.unshift(parent);
                parentId = parent.parentId;
            } else {
                break;
            }
        }
        
        const currentItems = projects
            .filter(p => p.parentId === currentParentId)
            .sort((a, b) => a.name.localeCompare(b.name));
            
        const currentParentNode = projects.find(p => p.id === currentParentId) || null;

        return { breadcrumbs, currentItems, currentParentNode };
    }, [currentParentId, projects]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const isNumeric = ['totalQty', 'rate'].includes(name);
        setFormData(prev => ({
            ...prev,
            [name]: isNumeric ? (value === '' ? '' : Number(value)) : value,
        }));
    };

    const handleLabelChange = (level: ProjectNodeType, value: string) => {
        setFormData(prev => ({
            ...prev,
            hierarchyLabels: {
                ...prev.hierarchyLabels,
                [level]: value,
            },
        }));
    };

    const openModal = (project: Project | null) => {
        if (isReadOnly) return;
        setProjectToEdit(project);
        if (project) {
            const labelsToEdit: Partial<Record<ProjectNodeType, string>> = {};
            if (project.parentId === null) {
                HIERARCHY.forEach(level => {
                    labelsToEdit[level] = project.hierarchyLabels?.[level] || DEFAULT_HIERARCHY_LABELS[level];
                });
            }

             setFormData({
                name: project.name,
                type: project.type,
                totalQty: project.totalQty ?? '',
                hierarchyLabels: labelsToEdit,
                uom: project.uom || '',
                rate: project.rate ?? '',
                currency: project.currency || 'SAR',
            });
        } else {
            const nextType = getNextNodeType(currentParentNode?.type);
            setFormData({...initialFormData, type: nextType || '', uom: UOM_OPTIONS[0]});
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setProjectToEdit(null);
        setFormData(initialFormData);
    };
    
    const hierarchyLabels = useMemo(() => {
        const root = getRootProject(currentParentId, projects);
        const labels = root?.hierarchyLabels ? { ...DEFAULT_HIERARCHY_LABELS, ...root.hierarchyLabels } : DEFAULT_HIERARCHY_LABELS;
        return labels;
    }, [currentParentId, projects]);

    const availableNodeTypesForNew = useMemo(() => {
        const parentType = currentParentNode?.type;
        if (currentParentId === null) return HIERARCHY.filter(t => t === 'Project');
        if (!parentType) return [];
        
        const parentIndex = HIERARCHY.indexOf(parentType);
        if (parentIndex === -1 || parentIndex === HIERARCHY.length - 1) return [];
        
        return HIERARCHY.slice(parentIndex + 1);
    }, [currentParentNode, currentParentId]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isReadOnly) return;

        if (formData.name.trim() === '' || !formData.type) {
            showError('Missing Information', 'Name and type cannot be empty.');
            return;
        }
        
        const projectData: Partial<Project> = {
            name: formData.name.trim(),
            type: formData.type as ProjectNodeType,
        };

        if (projectData.type === 'Activity') {
            projectData.totalQty = formData.totalQty !== '' ? Number(formData.totalQty) : undefined;
            projectData.uom = formData.uom;
            projectData.rate = formData.rate !== '' ? Number(formData.rate) : undefined;
            projectData.currency = formData.currency;
        }
        if (projectToEdit?.parentId === null) {
            projectData.hierarchyLabels = formData.hierarchyLabels;
        }

        if (projectToEdit) {
            onEdit({ ...projectToEdit, ...projectData });
        } else {
            onAdd({ ...projectData, parentId: currentParentId } as Omit<Project, 'id'>);
        }
        closeModal();
    };

    const handleDeleteClick = (item: Project) => {
        if (isReadOnly) return;
        showConfirmation(
            `Delete ${item.type}`,
            `Are you sure you want to delete "${item.name}"?\nAll of its sub-items will also be deleted. This action cannot be undone.`,
            () => onDelete(item.id)
        );
    };


    const isProjectInUse = (id: string) => records.some(record => record.project === id);
    const hasChildren = (id: string) => projects.some(p => p.parentId === id);
    
    const handleExport = () => exportToExcel(projects, "ProjectsHierarchy");
    const handleExportBoq = () => exportToBoqExcel(projects, "Project_BOQ");

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || isReadOnly) return;

        try {
            const data = await importFromExcel(file) as Project[];
            if (!data[0] || !('id' in data[0] && 'name' in data[0] && 'parentId' in data[0] && 'type' in data[0])) {
                 showError('Invalid File', 'Invalid Excel file format. Required columns: id, name, parentId, type');
                 return;
            }
            if (data.some(row => !HIERARCHY.includes(row.type))) {
                showError('Invalid File', `Invalid 'type' value in Excel file. Must be one of: ${HIERARCHY.join(', ')}`);
                return;
            }
            onSetProjects(data);
            setCurrentParentId(null);
            showMessage('Import Successful', 'Projects hierarchy imported successfully!');
        } catch (error) {
            console.error("Error importing projects:", error);
            showError('Import Failed', 'Failed to import projects.');
        }
        event.target.value = '';
    };

    const canAddNewNode = availableNodeTypesForNew.length > 0;
    const nextNodeTypeLabel = canAddNewNode ? hierarchyLabels[availableNodeTypesForNew[0]] : 'Cannot Add';
    
    const modalTitle = projectToEdit 
        ? `Edit ${hierarchyLabels[projectToEdit.type]}` 
        : `Add New Item`;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Settings: Projects"
                subtitle="Manage the project structure by drilling down."
            >
                 <div className="flex flex-wrap gap-3">
                    {!isReadOnly && (
                        <>
                            <button onClick={downloadProjectsTemplate} className="flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700">
                                <DownloadIcon className="h-5 w-5 mr-2" />
                                Download Template
                            </button>
                            <label className="flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer">
                                <ImportIcon className="h-5 w-5 mr-2" /> Import
                                <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleImport} />
                            </label>
                            <button onClick={handleExport} className="flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700">
                                <ExportIcon className="h-5 w-5 mr-2" /> Export
                            </button>
                             <button onClick={handleExportBoq} className="flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700">
                                <ExportIcon className="h-5 w-5 mr-2" /> Export BOQ
                            </button>
                            <button onClick={() => openModal(null)} disabled={!canAddNewNode} className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#28a745] hover:bg-green-700 disabled:bg-green-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed">
                                <PlusIcon className="h-5 w-5 mr-2" />
                                {canAddNewNode ? `Add ${nextNodeTypeLabel}` : 'Cannot Add'}
                            </button>
                        </>
                    )}
                </div>
            </PageHeader>
            
            <div className="bg-white dark:bg-slate-800 shadow-sm rounded-lg p-4">
                <nav className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                    <button onClick={() => setCurrentParentId(null)} className="hover:text-[#28a745] dark:hover:text-green-400">
                        Projects
                    </button>
                    {breadcrumbs.map(crumb => (
                        <React.Fragment key={crumb.id}>
                            <ChevronRightIcon className="h-5 w-5 mx-1 flex-shrink-0 text-slate-400" />
                            <button 
                                onClick={() => setCurrentParentId(crumb.id)} 
                                className="hover:text-[#28a745] dark:hover:text-green-400 truncate max-w-[200px]"
                                title={crumb.name}
                            >
                                {crumb.name}
                            </button>
                        </React.Fragment>
                    ))}
                </nav>

                <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 px-3">
                        {currentParentNode ? `Sub-items in "${currentParentNode.name}"` : 'Top-Level Projects'}
                    </h2>
                    {currentItems.length > 0 ? (
                        <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                            {currentItems.map(item => {
                                const canDelete = !isProjectInUse(item.id) && !hasChildren(item.id);
                                const isDrillable = item.type !== 'Activity';
                                const Icon = nodeTypeIcons[item.type] || BuildingIcon;
                                return (
                                    <li key={item.id} className="group flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-md">
                                        <div
                                            onClick={() => isDrillable && setCurrentParentId(item.id)} 
                                            className={`flex-1 text-left flex items-center ${isDrillable ? 'cursor-pointer' : 'cursor-default'}`}
                                        >
                                            <div className="flex-1 flex items-center space-x-3">
                                                <Icon className="h-6 w-6 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                                                <div className="truncate">
                                                    <span className="text-slate-800 dark:text-slate-200">{item.name}</span>
                                                    {item.type === 'Activity' && (
                                                        <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                                                            (Qty: {item.totalQty ?? 'N/A'}{item.uom ? ` ${item.uom}` : ''})
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            {!isReadOnly && <div className="flex items-center space-x-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={(e) => { e.stopPropagation(); openModal(item);}} className="text-[#28a745] hover:text-green-700 p-1 rounded-full hover:bg-green-100 dark:hover:bg-slate-600">
                                                    <PencilIcon className="h-5 w-5 pointer-events-none" />
                                                </button>
                                                <Tooltip content={canDelete ? '' : "Cannot delete: item is in use or has sub-items"}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteClick(item);
                                                        }}
                                                        disabled={!canDelete}
                                                        className="text-red-600 disabled:text-slate-300 dark:disabled:text-slate-600 disabled:cursor-not-allowed hover:text-red-900 p-1 rounded-full hover:bg-red-100 dark:hover:bg-slate-600"
                                                    >
                                                        <TrashIcon className="h-5 w-5 pointer-events-none" />
                                                    </button>
                                                </Tooltip>
                                            </div>}
                                             {isDrillable && <ChevronRightIcon className="h-5 w-5 text-slate-400" />}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <div className="text-center py-10 px-4">
                            <h3 className="text-sm font-medium text-slate-900 dark:text-white">No items found</h3>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">There are no sub-items in this level.</p>
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <Modal title={modalTitle} onClose={closeModal} size="2xl">
                    <form onSubmit={handleSubmit}>
                        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            {!projectToEdit && canAddNewNode && (
                                <div>
                                    <label htmlFor="type" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Type <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        id="type" name="type" value={formData.type} onChange={handleInputChange}
                                        required
                                        className="mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#28a745] focus:border-[#28a745] sm:text-sm bg-white dark:bg-slate-700"
                                    >
                                        {availableNodeTypesForNew.map(type => (
                                            <option key={type} value={type}>{hierarchyLabels[type]}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {formData.type ? hierarchyLabels[formData.type as ProjectNodeType] : 'Name'} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text" id="name" name="name" value={formData.name} onChange={handleInputChange}
                                    required autoFocus
                                    className="mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#28a745] focus:border-[#28a745] sm:text-sm bg-white dark:bg-slate-700"
                                />
                            </div>
                            
                            {formData.type === 'Activity' && (
                                <>
                                    <div>
                                        <label htmlFor="totalQty" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Total Planned Quantity (BOQ)
                                        </label>
                                        <input
                                            type="number" id="totalQty" name="totalQty" value={formData.totalQty} onChange={handleInputChange}
                                            placeholder="e.g., 5000" min="0"
                                            className="mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#28a745] focus:border-[#28a745] sm:text-sm bg-white dark:bg-slate-700"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="uom" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                Unit of Measure (UOM)
                                            </label>
                                            <select
                                                id="uom" name="uom" value={formData.uom} onChange={handleInputChange}
                                                className="mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#28a745] focus:border-[#28a745] sm:text-sm bg-white dark:bg-slate-700"
                                            >
                                                {UOM_OPTIONS.map(uom => <option key={uom} value={uom}>{uom}</option>)}
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 items-end">
                                            <div className="col-span-2">
                                                <label htmlFor="rate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    Unit Cost (Rate)
                                                </label>
                                                <input
                                                    type="number" id="rate" name="rate" value={formData.rate} onChange={handleInputChange}
                                                    placeholder="e.g., 120.50" min="0" step="any"
                                                    className="mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#28a745] focus:border-[#28a745] sm:text-sm bg-white dark:bg-slate-700"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="currency" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    Currency
                                                </label>
                                                <select
                                                    id="currency" name="currency" value={formData.currency} onChange={handleInputChange}
                                                    className="mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#28a745] focus:border-[#28a745] sm:text-sm bg-white dark:bg-slate-700"
                                                >
                                                {CURRENCY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                            {projectToEdit && projectToEdit.parentId === null && (
                                <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
                                    <h4 className="text-md font-medium text-slate-900 dark:text-white mb-2">Hierarchy Level Names</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Customize the display names for each level within this project.</p>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                        {HIERARCHY.map(level => (
                                            <div key={level}>
                                                <label htmlFor={`label-${level}`} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    {DEFAULT_HIERARCHY_LABELS[level]}
                                                </label>
                                                <input
                                                    type="text"
                                                    id={`label-${level}`}
                                                    value={formData.hierarchyLabels[level] || ''}
                                                    onChange={e => handleLabelChange(level, e.target.value)}
                                                    className="mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#28a745] focus:border-[#28a745] sm:text-sm bg-white dark:bg-slate-700"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 text-right space-x-3">
                            <button type="button" onClick={closeModal} className="inline-flex justify-center py-2 px-4 border border-slate-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700">
                                Cancel
                            </button>
                            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#28a745] hover:bg-green-700">
                                {projectToEdit ? 'Save Changes' : 'Add'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default SettingsProjects;