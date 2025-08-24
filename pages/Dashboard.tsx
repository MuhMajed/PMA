import React, { useMemo, useState } from 'react';
import { useStore } from '../store/appStore';
import { useManpowerRecordsForCurrentUser, useProjectsForCurrentUser, useProgressRecordsForCurrentUser } from '../hooks/useData';
import DashboardMetrics, { CrossFilters } from '../components/DashboardMetrics';
import ProductivityDashboard from '../components/ProductivityDashboard';
import PageHeader from '../components/ui/PageHeader';
import { ProjectMultiSelectFilter } from '../components/ProjectMultiSelectFilter';
import { Project } from '../types';
import { useQuery } from '@tanstack/react-query';
import * as api from '../utils/api';
import { PrinterIcon } from '../components/icons/PrinterIcon';

const getDescendantIds = (projectId: string, projects: Project[]): string[] => {
  let descendants: string[] = [];
  const children = projects.filter(p => p.parentId === projectId);
  children.forEach(child => {
    descendants.push(child.id);
    descendants = [...descendants, ...getDescendantIds(child.id, projects)];
  });
  return descendants;
};

const getProjectName = (projects: Project[], selectedIds: string[]): string => {
    if (selectedIds.length === 0) return "No projects selected";
    
    const rootProjectIds = projects.filter(p => p.parentId === null).map(p => p.id);
    if (selectedIds.length === rootProjectIds.length && selectedIds.every(id => rootProjectIds.includes(id))) {
        return "All Projects";
    }

    const selectedIdSet = new Set(selectedIds);
    const topLevelSelected = selectedIds.filter(id => {
        const project = projects.find(p => p.id === id);
        return !project?.parentId || !selectedIdSet.has(project.parentId);
    }).map(id => projects.find(p => p.id === id)?.name).filter(Boolean);

    if (topLevelSelected.length === 0 && selectedIds.length > 0) return "a sub-item";
    if (topLevelSelected.length === 0) return "No projects selected";
    return topLevelSelected.join(', ');
};

type DateRangePreset = 'today' | '7d' | '30d' | 'month' | 'custom';
type Subpage = 'manpower' | 'productivity';

const getInitialDateRange = (range: DateRangePreset) => {
    const endDate = new Date();
    const startDate = new Date();
    if (range === 'today') {
        // startDate is today
    } else if (range === '7d') {
        startDate.setDate(endDate.getDate() - 6);
    } else if (range === '30d') {
        startDate.setDate(endDate.getDate() - 29);
    } else if (range === 'month') {
        startDate.setDate(1);
    }
    return {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
    };
};

const Dashboard: React.FC = () => {
    const { theme, sharedFilters, setSharedFilters } = useStore();
    const { selectedProjects, dateRange } = sharedFilters;

    const { data: subcontractors = [] } = useQuery({ queryKey: ['subcontractors'], queryFn: api.fetchSubcontractors });
    const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: api.fetchEmployees });
    
    const { records: allRecords } = useManpowerRecordsForCurrentUser();
    const { projects: allProjects } = useProjectsForCurrentUser();
    const { progressRecords: allProgressRecords } = useProgressRecordsForCurrentUser();

    const [activeRange, setActiveRange] = useState<DateRangePreset>('30d');
    const [activeSubpage, setActiveSubpage] = useState<Subpage>('manpower');
    const [crossFilters, setCrossFilters] = useState<CrossFilters>({ subcontractor: null, shift: null, type: null });
    const [showEmptyDays, setShowEmptyDays] = useState(true);
    
    const setSelectedProjects = (newSelected: string[]) => {
        setSharedFilters({ selectedProjects: newSelected });
        setCrossFilters({ subcontractor: null, shift: null, type: null });
    };

    const setDateRange = (newDateRange: { start: string, end: string }) => {
        setSharedFilters({ dateRange: newDateRange });
        setCrossFilters({ subcontractor: null, shift: null, type: null });
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setActiveRange('custom');
        setDateRange({ ...dateRange, [name]: value });
    };

    const handlePresetClick = (presetId: DateRangePreset) => {
        setDateRange(getInitialDateRange(presetId));
        setActiveRange(presetId);
    };

    const projectIdsToFilter = useMemo(() => {
        const allIds = new Set<string>();
        selectedProjects.forEach(id => {
            allIds.add(id);
            const descendants = getDescendantIds(id, allProjects);
            descendants.forEach(descId => allIds.add(descId));
        });
        return Array.from(allIds);
    }, [selectedProjects, allProjects]);


    const filteredRecords = useMemo(() => {
        if (projectIdsToFilter.length === 0 || !dateRange.start || !dateRange.end) return [];
        
        const start = dateRange.start;
        const end = dateRange.end;

        return allRecords.filter(record => 
            projectIdsToFilter.includes(record.project) &&
            record.date >= start &&
            record.date <= end
        );
    }, [allRecords, projectIdsToFilter, dateRange]);
    
    const totalEmployees = useMemo(() => new Set(filteredRecords.map(r => r.empId)).size, [filteredRecords]);
    
    const todaysHeadcount = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return allRecords.filter(r => 
            r.date === today && projectIdsToFilter.includes(r.project)
        ).length;
    }, [allRecords, projectIdsToFilter]);

    const avgDailyManpower = useMemo(() => {
        if (!filteredRecords.length || !dateRange.start || !dateRange.end) return 0;
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return filteredRecords.length / diffDays;
    }, [filteredRecords, dateRange]);


    const projectName = getProjectName(allProjects, selectedProjects);

    const rangePresets: { id: DateRangePreset, label: string }[] = [
        { id: 'today', label: 'Today' },
        { id: '7d', label: 'Last 7 Days' },
        { id: '30d', label: 'Last 30 Days' },
        { id: 'month', label: 'This Month' },
    ];
    
    const subpageTabs: { id: Subpage, label: string }[] = [
        { id: 'manpower', label: 'Manpower' },
        { id: 'productivity', label: 'Productivity' },
    ];
    
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Dashboard"
                subtitle={`Overview for ${projectName}`}
            >
                <button
                    onClick={() => window.print()}
                    className="no-print flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                    <PrinterIcon className="h-5 w-5 mr-2" />
                    Print Report
                </button>
            </PageHeader>
            
            <div className="print-only mb-6 border-b border-black pb-4">
                <h1 className="text-3xl font-bold text-black">{`Dashboard Report: ${projectName}`}</h1>
                <p className="mt-1 text-lg text-slate-800">{`Date Range: ${dateRange.start} to ${dateRange.end}`}</p>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-sm no-print">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    <div className="lg:col-span-1">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Project
                        </label>
                        <ProjectMultiSelectFilter 
                            projects={allProjects}
                            selectedIds={selectedProjects}
                            onSelectionChange={setSelectedProjects}
                        />
                    </div>
                    <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Date Range
                        </label>
                        <div className="flex flex-col sm:flex-row gap-4 items-start flex-wrap">
                            <div className="isolate inline-flex rounded-md shadow-sm">
                                {rangePresets.map((preset, idx) => (
                                    <button
                                        key={preset.id}
                                        type="button"
                                        onClick={() => handlePresetClick(preset.id)}
                                        className={`relative inline-flex items-center px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-slate-300 dark:ring-slate-600 focus:z-10
                                        ${activeRange === preset.id 
                                            ? 'bg-[#28a745] text-white ring-transparent' 
                                            : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600'
                                        }
                                        ${idx === 0 ? 'rounded-l-md' : '-ml-px'}
                                        ${idx === rangePresets.length - 1 ? 'rounded-r-md' : ''}
                                        `}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    name="start"
                                    className="block w-full pl-3 pr-2 py-2 text-base border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-[#28a745] focus:border-[#28a745] sm:text-sm rounded-md"
                                    value={dateRange.start}
                                    onChange={handleDateChange}
                                    max={dateRange.end || today}
                                />
                                <span className="text-slate-500 dark:text-slate-400">to</span>
                                <input
                                    type="date"
                                    name="end"
                                    className="block w-full pl-3 pr-2 py-2 text-base border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-[#28a745] focus:border-[#28a745] sm:text-sm rounded-md"
                                    value={dateRange.end}
                                    onChange={handleDateChange}
                                    min={dateRange.start}
                                    max={today}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="no-print">
                <div className="border-b border-slate-200 dark:border-slate-700">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                         {subpageTabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveSubpage(tab.id)}
                                className={`${
                                tab.id === activeSubpage
                                    ? 'border-[#28a745] text-[#28a745]'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:border-slate-600'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                {tab.label}
                            </button>
                         ))}
                    </nav>
                </div>
            </div>
            
            {activeSubpage === 'manpower' && (
                <div className="flex items-center justify-end no-print">
                    <label className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
                        <input type="checkbox" checked={showEmptyDays} onChange={() => setShowEmptyDays(s => !s)} className="rounded text-[#28a745] focus:ring-[#28a745] dark:bg-slate-600 dark:border-slate-500" />
                        <span>Show Empty Days & Weekends</span>
                    </label>
                </div>
            )}


            <div className="mt-6">
                {activeSubpage === 'manpower' && (
                     <DashboardMetrics 
                        records={filteredRecords} 
                        subcontractors={subcontractors} 
                        projects={allProjects}
                        employees={employees}
                        selectedProjects={selectedProjects}
                        theme={theme}
                        totalEmployees={totalEmployees}
                        todaysHeadcount={todaysHeadcount}
                        avgDailyManpower={avgDailyManpower}
                        crossFilters={crossFilters}
                        setCrossFilters={setCrossFilters}
                        dateRange={dateRange}
                        showEmptyDays={showEmptyDays}
                    />
                )}
                {activeSubpage === 'productivity' && (
                    <ProductivityDashboard
                        records={filteredRecords}
                        projects={allProjects}
                        progressRecords={allProgressRecords}
                        projectIdsToFilter={projectIdsToFilter}
                        theme={theme}
                    />
                )}
            </div>
        </div>
    );
};

export default Dashboard;