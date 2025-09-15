import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ActivityGroup } from '../types';

interface ActivityGroupMultiSelectFilterProps {
    activityGroups: ActivityGroup[];
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
}

export const ActivityGroupMultiSelectFilter: React.FC<ActivityGroupMultiSelectFilterProps> = ({ activityGroups, selectedIds, onSelectionChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    const filteredGroups = useMemo(() => {
        if (!searchTerm) return activityGroups;
        return activityGroups.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [activityGroups, searchTerm]);

    const handleSelectionChange = (groupId: string, isSelected: boolean) => {
        let newSelectedIds: string[];
        if (isSelected) {
            newSelectedIds = [...new Set([...selectedIds, groupId])];
        } else {
            newSelectedIds = selectedIds.filter(id => id !== groupId);
        }
        onSelectionChange(newSelectedIds);
    };
    
    const handleSelectAll = (select: boolean) => {
        onSelectionChange(select ? activityGroups.map(g => g.id) : []);
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

    const summaryText = useMemo(() => {
        if (selectedIds.length === 0) return "All Activity Groups";
        if (selectedIds.length === activityGroups.length) return "All Activity Groups";
        if (selectedIds.length === 1) {
            return activityGroups.find(g => g.id === selectedIds[0])?.name || "1 Group Selected";
        }
        return `${selectedIds.length} groups selected`;
    }, [selectedIds, activityGroups]);

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
                            placeholder="Search groups..."
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
                    <ul className="max-h-60 overflow-y-auto p-1">
                        {filteredGroups.map(group => (
                            <li key={group.id}>
                                <label className="flex items-center space-x-2 py-1 px-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-slate-300 text-[#28a745] focus:ring-[#28a745]"
                                        checked={selectedIds.includes(group.id)}
                                        onChange={(e) => handleSelectionChange(group.id, e.target.checked)}
                                    />
                                    <span className="truncate flex-1">{group.name}</span>
                                </label>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};