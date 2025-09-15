import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Project } from '../types';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

interface ProjectMultiSelectFilterProps {
    projects: Project[];
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
}

const getDescendantIds = (projectId: string, projects: Project[]): string[] => {
    let descendants: string[] = [];
    const children = projects.filter(p => p.parentId === projectId);
    children.forEach(child => {
        descendants.push(child.id);
        descendants = [...descendants, ...getDescendantIds(child.id, projects)];
    });
    return descendants;
};

export const ProjectMultiSelectFilter: React.FC<ProjectMultiSelectFilterProps> = ({ projects, selectedIds, onSelectionChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);
    
    const projectMap = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);

    const trulyFilteredProjects = useMemo(() => {
        if (!searchTerm) return projects;
        const lowercasedFilter = searchTerm.toLowerCase();
        return projects.filter(project => project.name.toLowerCase().includes(lowercasedFilter));
    }, [searchTerm, projects]);

    const filteredProjects = useMemo(() => {
        if (!searchTerm) return projects;
        
        const filteredIds = new Set<string>();

        // Use the truly filtered projects to build the visible tree
        trulyFilteredProjects.forEach(project => {
            filteredIds.add(project.id);
            // Add all ancestors to ensure the path is visible
            let current = project;
            while (current.parentId) {
                filteredIds.add(current.parentId);
                current = projectMap.get(current.parentId)!;
                if (!current) break;
            }
        });
        
        return projects.filter(p => filteredIds.has(p.id));
    }, [searchTerm, projects, projectMap, trulyFilteredProjects]);

    const projectTree = useMemo(() => filteredProjects.filter(p => p.parentId === null), [filteredProjects]);

    // Auto-expand all nodes when searching
    useEffect(() => {
        if (searchTerm) {
            const allIds: Record<string, boolean> = {};
            filteredProjects.forEach(p => { allIds[p.id] = true; });
            setExpandedIds(allIds);
        } else {
            setExpandedIds({});
        }
    }, [searchTerm, filteredProjects]);

    const handleToggleNode = (id: string) => {
        setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleSelectionChange = (projectId: string, isSelected: boolean) => {
        const descendants = getDescendantIds(projectId, projects);
        const allAffectedIds = [projectId, ...descendants];
        
        let newSelectedIds: string[];
        if (isSelected) {
            newSelectedIds = [...new Set([...selectedIds, ...allAffectedIds])];
        } else {
            const idSetToRemove = new Set(allAffectedIds);
            newSelectedIds = selectedIds.filter(id => !idSetToRemove.has(id));
        }
        onSelectionChange(newSelectedIds);
    };

    const handleSelectAll = (select: boolean) => {
        // If no search, "Select All" applies to all projects.
        // If search, it applies only to projects whose names match the search term.
        const targetProjects = searchTerm ? trulyFilteredProjects : projects;
        
        // Get all IDs from the target projects and all their descendants.
        const allIdsToChange = new Set<string>();
        targetProjects.forEach(p => {
            allIdsToChange.add(p.id);
            getDescendantIds(p.id, projects).forEach(descId => allIdsToChange.add(descId));
        });

        if (select) {
            onSelectionChange([...new Set([...selectedIds, ...Array.from(allIdsToChange)])]);
        } else {
            const idsToRemove = allIdsToChange;
            onSelectionChange(selectedIds.filter(id => !idsToRemove.has(id)));
        }
    };
    
    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const renderNode = useCallback((project: Project) => {
        const children = filteredProjects.filter(p => p.parentId === project.id);
        const hasChildren = children.length > 0;
        const isExpanded = expandedIds[project.id];
        
        const isSelected = selectedIds.includes(project.id);

        return (
            <div key={project.id}>
                <div className="flex items-center space-x-2 py-1 px-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-600">
                    {hasChildren && (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleToggleNode(project.id); }}
                            className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 flex-shrink-0"
                        >
                            <ChevronRightIcon className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : 'rotate-0'}`} />
                        </button>
                    )}
                    <label className={`flex items-center space-x-2 flex-grow cursor-pointer ${!hasChildren ? 'ml-6' : ''}`}>
                        <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 text-[#28a745] focus:ring-[#28a745]"
                            checked={isSelected}
                            onChange={(e) => handleSelectionChange(project.id, e.target.checked)}
                        />
                        <span className="truncate flex-1">{project.name}</span>
                    </label>
                </div>
                {isExpanded && hasChildren && (
                    <div className="pl-6">
                        {children.map(renderNode)}
                    </div>
                )}
            </div>
        )
    }, [filteredProjects, expandedIds, selectedIds, handleSelectionChange, projects]);
    
    const summaryText = useMemo(() => {
        if (selectedIds.length === 0) return "Select Projects";
        const allProjectIds = projects.map(p => p.id);
        if (selectedIds.length === allProjectIds.length && selectedIds.every(id => allProjectIds.includes(id))) {
            return "All Projects";
        }
    
        const selectedIdSet = new Set(selectedIds);
        const topLevelSelected = selectedIds.filter(id => {
            const project = projects.find(p => p.id === id);
            return !project?.parentId || !selectedIdSet.has(project.parentId);
        });
    
        if (topLevelSelected.length === 1) {
            const project = projects.find(p => p.id === topLevelSelected[0]);
            return project ? project.name : "1 Project Selected";
        }
        return `${topLevelSelected.length || selectedIds.length} items selected`;
    }, [selectedIds, projects]);

    return (
        <div className="relative" ref={wrapperRef}>
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
                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-800 shadow-lg rounded-md border border-slate-300 dark:border-slate-600">
                    <div className="p-2 border-b border-slate-200 dark:border-slate-700">
                         <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-2 py-1 text-sm border-slate-300 rounded-md dark:bg-slate-700 dark:border-slate-600"
                            autoFocus
                        />
                    </div>
                    <div className="flex justify-between items-center p-2 border-b border-slate-200 dark:border-slate-700">
                        <button onClick={() => handleSelectAll(true)} className="text-sm text-[#28a745] hover:underline">Select All</button>
                        <button onClick={() => handleSelectAll(false)} className="text-sm text-red-500 hover:underline">Deselect All</button>
                    </div>
                    <div className="max-h-60 overflow-y-auto p-2">
                         {projectTree.length > 0 ? projectTree.map(renderNode) : <div className="text-sm text-slate-500 text-center py-2">No projects found.</div>}
                    </div>
                </div>
            )}
        </div>
    );
};