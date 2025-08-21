import React from 'react';
import { Project, ProjectNodeType } from '../types';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

interface ProjectColumnProps {
    title: ProjectNodeType;
    items: Project[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onEdit: (project: Project) => void;
    onDelete: (id: string) => void;
    isDeletable: (id: string) => boolean;
}

const ProjectColumn: React.FC<ProjectColumnProps> = ({ title, items, selectedId, onSelect, onEdit, onDelete, isDeletable }) => {
    return (
        <div className="flex-shrink-0 w-64 border-r border-slate-200 dark:border-slate-700 h-full flex flex-col">
            <h3 className="p-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 sticky top-0">
                {title}
            </h3>
            <div className="flex-1 overflow-y-auto">
                {items.length > 0 ? (
                    <ul>
                        {items.map(item => {
                            const canDelete = isDeletable(item.id);
                            return (
                                <li key={item.id} className="group">
                                    <button
                                        onClick={() => onSelect(item.id)}
                                        className={`w-full text-left flex justify-between items-center p-2 text-sm rounded-md
                                            ${selectedId === item.id 
                                                ? 'bg-[#28a745] text-white' 
                                                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                                            }
                                        `}
                                    >
                                        <span className="truncate">{item.name}</span>
                                        <div className="flex items-center space-x-2 pl-2">
                                            <div className={`hidden ${selectedId === item.id ? 'sm:flex' : 'sm:group-hover:flex'} items-center space-x-2`}>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onEdit(item); }} 
                                                    className={`${selectedId === item.id ? 'text-white hover:bg-white/20' : 'text-slate-400 hover:text-[#28a745]'} p-1 rounded`}
                                                    title="Edit"
                                                >
                                                    <PencilIcon className="h-4 w-4" />
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                                                    disabled={!canDelete}
                                                    className={`${selectedId === item.id ? 'text-white hover:bg-white/20' : 'text-slate-400 hover:text-red-500'} p-1 rounded disabled:text-slate-300 dark:disabled:text-slate-600 disabled:cursor-not-allowed`}
                                                    title={canDelete ? "Delete" : "Cannot delete: item is in use or has children"}
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                            {item.type !== 'Activity' && <ChevronRightIcon className="h-4 w-4 flex-shrink-0 text-slate-400" />}
                                        </div>
                                    </button>
                                </li>
                            )
                        })}
                    </ul>
                ) : (
                    <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                        No items.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectColumn;
