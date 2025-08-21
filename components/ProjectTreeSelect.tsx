import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Project, ProjectNodeType } from '../types';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

interface ProjectTreeSelectProps {
    projects: Project[];
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    placeholder?: string;
    selectableNodeTypes?: ProjectNodeType[];
    className?: string;
}

const getProjectPath = (projectId: string | null, projects: Project[]): string => {
    if (!projectId) return '';
    const path: string[] = [];
    let current = projects.find(p => p.id === projectId);
    while (current) {
        path.unshift(current.name);
        current = projects.find(p => p.id === current.parentId);
    }
    return path.join(' / ');
};


export const ProjectTreeSelect: React.FC<ProjectTreeSelectProps> = ({ projects, selectedId, onSelect, placeholder = "Select...", selectableNodeTypes, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
    const wrapperRef = useRef<HTMLDivElement>(null);
    
    const projectTree = useMemo(() => projects.filter(p => p.parentId === null), [projects]);

    // Auto-expand path to selected node
    useEffect(() => {
        if (selectedId && projects.length > 0) {
            const newExpanded: Record<string, boolean> = {};
            let current = projects.find(p => p.id === selectedId);
            while (current && current.parentId) {
                newExpanded[current.parentId] = true;
                current = projects.find(p => p.id === current.parentId);
            }
            setExpandedIds(newExpanded);
        }
    }, [selectedId, projects]);

    const handleToggleNode = (id: string) => {
        setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleSelect = (project: Project) => {
        if (selectableNodeTypes && !selectableNodeTypes.includes(project.type)) {
            return;
        }
        onSelect(project.id);
        setIsOpen(false);
    };
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const renderNode = (project: Project) => {
        const children = projects.filter(p => p.parentId === project.id);
        const hasChildren = children.length > 0;
        const isExpanded = expandedIds[project.id];
        const isSelected = selectedId === project.id;
        const isSelectable = !selectableNodeTypes || selectableNodeTypes.includes(project.type);

        return (
            <div key={project.id}>
                <div className={`flex items-center space-x-1 py-1 px-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-600 ${isSelected ? 'bg-green-100 dark:bg-slate-700' : ''}`}>
                    {hasChildren && (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleToggleNode(project.id); }}
                            className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 flex-shrink-0"
                        >
                            <ChevronRightIcon className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : 'rotate-0'}`} />
                        </button>
                    )}
                    <div 
                        onClick={() => handleSelect(project)}
                        className={`flex-grow text-left ${isSelectable ? 'cursor-pointer' : 'cursor-not-allowed text-slate-400 dark:text-slate-500'} ${!hasChildren ? 'ml-6' : ''}`}
                    >
                         <span className={`truncate ${isSelected ? 'font-bold text-[#28a745] dark:text-white' : ''}`}>{project.name}</span>
                    </div>
                </div>
                {isExpanded && hasChildren && (
                    <div className="pl-5 border-l border-slate-200 dark:border-slate-700 ml-3">
                        {children.map(renderNode)}
                    </div>
                )}
            </div>
        )
    };
    
    const summaryText = useMemo(() => {
        return getProjectPath(selectedId, projects) || placeholder;
    }, [selectedId, projects, placeholder]);

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm pl-3 pr-10 py-2 text-left focus:outline-none focus:ring-1 focus:ring-[#28a745] focus:border-[#28a745] sm:text-sm"
            >
                <span className="block truncate">{summaryText}</span>
                <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                     <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M10 3a.75.75 0 01.53.22l3.5 3.5a.75.75 0 01-1.06 1.06L10 4.81 7.03 7.78a.75.75 0 01-1.06-1.06l3.5-3.5A.75.75 0 0110 3zm-3.72 9.53a.75.75 0 011.06 0L10 15.19l2.97-2.97a.75.75 0 111.06 1.06l-3.5 3.5a.75.75 0 01-1.06 0l-3.5-3.5a.75.75 0 010-1.06z" clipRule="evenodd" /></svg>
                </span>
            </button>

            {isOpen && (
                <div className="absolute z-20 mt-1 w-full bg-white dark:bg-slate-800 shadow-lg rounded-md border border-slate-300 dark:border-slate-600 p-2">
                    <div className="max-h-60 overflow-y-auto">
                         {projectTree.map(renderNode)}
                    </div>
                </div>
            )}
        </div>
    );
};
