import React, { useMemo, useState } from 'react';
import { useStore } from '../store/appStore';
import { useManpowerRecordsForCurrentUser, useProjectsForCurrentUser, useProgressRecordsForCurrentUser, useSafetyViolationsForCurrentUser, useEquipmentRecordsForCurrentUser } from '../hooks/useData';
import DashboardMetrics from '../components/DashboardMetrics';
import ProductivityDashboard from '../components/ProductivityDashboard';
import SafetyDashboard from '../components/SafetyDashboard';
import EquipmentDashboard from '../components/EquipmentDashboard';
import PageHeader from '../components/ui/PageHeader';
import { ProjectMultiSelectFilter } from '../components/ProjectMultiSelectFilter';
import { ActivityGroupMultiSelectFilter } from '../components/ActivityGroupMultiSelectFilter';
import { Project, Shift, EmployeeType, ViolationType, EquipmentStatus } from '../types';
import { useQuery } from '@tanstack/react-query';
import * as api from '../utils/api';
import { PrinterIcon } from '../components/icons/PrinterIcon';
import { XCircleIcon } from '../components/icons/XCircleIcon';


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
type Subpage = 'manpower' | 'productivity' | 'equipment' | 'safety';

export type CrossFilters = {
    subcontractor?: string | null;
    shift?: Shift | null;
    type?: EmployeeType | 'Unknown' | null;
    violationType?: ViolationType | null;
    equipmentStatus?: EquipmentStatus | null;
    equipmentId?: string | null;
    date?: string | null;
    projectName?: string | null; 
};

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

const FilterBadge: React.FC<{ label: string; value: string; onClear: () => void }> = ({ label, value, onClear }) => (
    <span className="inline-flex items-center gap-x-1.5 rounded-md bg-green-100 dark:bg-slate-700 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-300">
        <strong>{label}:</strong> {value}
        <button type="button" onClick={onClear} className="group relative -mr-1 h-3.5 w-3.5 rounded-sm hover:bg-green-500/20">
            <span className="sr-only">Remove</span>
            <XCircleIcon className="h-3.5 w-3.5 text-green-600 dark:text-green-400 group-hover:text-green-700 dark:group-hover:text-green-200" />
        </button>
    </span>
);


const Dashboard: React.FC = () => {
    const { theme, sharedFilters, setSharedFilters, currentUser } = useStore();
    const { selectedProjects, dateRange, selectedActivityGroups } = sharedFilters;

    const { data: subcontractors = [] } = useQuery({ queryKey: ['subcontractors'], queryFn: api.fetchSubcontractors });
    const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: api.fetchEmployees });
    const { data: allEquipment = [] } = useQuery({ queryKey: ['equipment'], queryFn: api.fetchEquipment });
    const { data: allActivityGroups = [] } = useQuery({ queryKey: ['activityGroups'], queryFn: api.fetchActivityGroups });
    const { data: allActivityGroupMappings = [] } = useQuery({ queryKey: ['activityGroupMappings'], queryFn: api.fetchActivityGroupMappings });
    
    const { records: allRecords } = useManpowerRecordsForCurrentUser();
    const { projects: allProjects } = useProjectsForCurrentUser();
    const { progressRecords: allProgressRecords } = useProgressRecordsForCurrentUser();
    const { violations: allSafetyViolations } = useSafetyViolationsForCurrentUser();
    const { equipmentRecords: allEquipmentRecords } = useEquipmentRecordsForCurrentUser();

    const [activeRange, setActiveRange] = useState<DateRangePreset>('30d');
    const [activeSubpage, setActiveSubpage] = useState<Subpage>(currentUser?.role === 'Safety' ? 'safety' : 'manpower');
    const [crossFilters, setCrossFilters] = useState<CrossFilters>({});
    const [showEmptyDays, setShowEmptyDays] = useState(true);
    
    const clearCrossFilters = () => setCrossFilters({});

    const setSelectedProjects = (newSelected: string[]) => {
        setSharedFilters({ selectedProjects: newSelected });
        clearCrossFilters();
    };

    const setSelectedActivityGroups = (newSelected: string[]) => {
        setSharedFilters({ selectedActivityGroups: newSelected });
        clearCrossFilters();
    };

    const setDateRange = (newDateRange: { start: string, end: string }) => {
        setSharedFilters({ dateRange: newDateRange });
        clearCrossFilters();
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

    const activityIdsForGroupFilter = useMemo(() => {
        if (!selectedActivityGroups || selectedActivityGroups.length === 0) {
            return null; // No group filter active
        }
        const activityIds = new Set<string>();
        allActivityGroupMappings.forEach(mapping => {
            if (selectedActivityGroups.includes(mapping.activityGroupId)) {
                activityIds.add(mapping.activityId);
            }
        });
        return Array.from(activityIds);
    }, [selectedActivityGroups, allActivityGroupMappings]);

    const filterRecords = (records: any[], projectKey: string) => {
        if (projectIdsToFilter.length === 0 || !dateRange.start || !dateRange.end || !records) return [];
        
        let finalRecords = records.filter(record => 
            projectIdsToFilter.includes(record[projectKey]) &&
            record.date >= dateRange.start &&
            record.date <= dateRange.end
        );

        if (activityIdsForGroupFilter) {
            finalRecords = finalRecords.filter(record => activityIdsForGroupFilter.includes(record[projectKey]));
        }

        return finalRecords;
    };

    const filteredManpower = useMemo(() => filterRecords(allRecords, 'project'), [allRecords, projectIdsToFilter, dateRange, activityIdsForGroupFilter]);
    const filteredProgressRecords = useMemo(() => filterRecords(allProgressRecords, 'activityId'), [allProgressRecords, projectIdsToFilter, dateRange, activityIdsForGroupFilter]);
    const filteredViolations = useMemo(() => filterRecords(allSafetyViolations, 'projectId'), [allSafetyViolations, projectIdsToFilter, dateRange, activityIdsForGroupFilter]);
    const filteredEquipmentRecords = useMemo(() => filterRecords(allEquipmentRecords, 'project'), [allEquipmentRecords, projectIdsToFilter, dateRange, activityIdsForGroupFilter]);
    
    const crossFilteredData = useMemo(() => {
        let mp = filteredManpower;
        let pr = filteredProgressRecords;
        let eq = filteredEquipmentRecords;
        let sv = filteredViolations;
        
        const employeeTypeMap = new Map(employees.map(e => [e.empId, e.type]));

        const linkFilters = {
            dates: new Set<string>(),
            subcontractors: new Set<string>(),
            projectIds: new Set<string>(),
        };

        let isDateFilteredDirectly = !!crossFilters.date;

        if (crossFilters.date) linkFilters.dates.add(crossFilters.date);
        if (crossFilters.subcontractor) linkFilters.subcontractors.add(crossFilters.subcontractor);
        
        if (crossFilters.equipmentStatus) {
            eq = eq.filter(r => r.status === crossFilters.equipmentStatus);
            if (!isDateFilteredDirectly) eq.forEach(r => linkFilters.dates.add(r.date));
        }
        if (crossFilters.equipmentId) {
            eq = eq.filter(r => r.equipmentId === crossFilters.equipmentId);
            if (!isDateFilteredDirectly) eq.forEach(r => linkFilters.dates.add(r.date));
        }
        if (crossFilters.violationType) {
            sv = sv.filter(r => r.violationType === crossFilters.violationType);
            if (!isDateFilteredDirectly) sv.forEach(r => linkFilters.dates.add(r.date));
            if (!crossFilters.subcontractor) sv.forEach(r => linkFilters.subcontractors.add(r.subcontractor));
        }
        if (crossFilters.shift) {
            mp = mp.filter(r => r.shift === crossFilters.shift);
            pr = pr.filter(r => r.shift === crossFilters.shift);
        }
        if (crossFilters.type) {
            mp = mp.filter(r => (employeeTypeMap.get(r.empId) || 'Unknown') === crossFilters.type);
        }
        if (crossFilters.projectName) {
            const rootProject = allProjects.find(p => p.parentId === null && p.name === crossFilters.projectName);
            if (rootProject) {
                const descendantIds = getDescendantIds(rootProject.id, allProjects);
                const allIds = new Set([rootProject.id, ...descendantIds]);
                mp.filter(r => allIds.has(r.project)).forEach(r => linkFilters.dates.add(r.date));
                pr.filter(r => allIds.has(r.activityId)).forEach(r => linkFilters.dates.add(r.date));
                allIds.forEach(id => linkFilters.projectIds.add(id));
            }
        }

        if (linkFilters.dates.size > 0) {
            mp = mp.filter(r => linkFilters.dates.has(r.date));
            pr = pr.filter(r => linkFilters.dates.has(r.date));
            eq = eq.filter(r => linkFilters.dates.has(r.date));
            sv = sv.filter(r => linkFilters.dates.has(r.date));
        }
        if (linkFilters.subcontractors.size > 0) {
            mp = mp.filter(r => linkFilters.subcontractors.has(r.subcontractor));
            sv = sv.filter(v => linkFilters.subcontractors.has(v.subcontractor));
        }
        if(linkFilters.projectIds.size > 0) {
            mp = mp.filter(r => linkFilters.projectIds.has(r.project));
            pr = pr.filter(r => linkFilters.projectIds.has(r.activityId));
            eq = eq.filter(r => linkFilters.projectIds.has(r.project));
            sv = sv.filter(r => linkFilters.projectIds.has(r.projectId));
        }

        return { manpower: mp, equipment: eq, violations: sv, progress: pr };
    }, [filteredManpower, filteredProgressRecords, filteredEquipmentRecords, filteredViolations, crossFilters, employees, allProjects]);


    const todaysHeadcount = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return allRecords.filter(r => r.date === today && projectIdsToFilter.includes(r.project)).length;
    }, [allRecords, projectIdsToFilter]);

    const avgDailyManpower = useMemo(() => {
        if (!filteredManpower.length || !dateRange.start || !dateRange.end) return 0;
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        
        const recordsByDay = filteredManpower.reduce((acc, r) => {
            acc.add(r.date);
            return acc;
        }, new Set<string>());

        return filteredManpower.length / (showEmptyDays ? diffDays : recordsByDay.size || 1);
    }, [filteredManpower, dateRange, showEmptyDays]);

    const projectName = getProjectName(allProjects, selectedProjects);
    const hasActiveFilters = Object.values(crossFilters).some(f => f !== null && f !== undefined);

    const rangePresets: { id: DateRangePreset, label: string }[] = [
        { id: 'today', label: 'Today' },
        { id: '7d', label: 'Last 7 Days' },
        { id: '30d', label: 'Last 30 Days' },
        { id: 'month', label: 'This Month' },
    ];
    
     const subpageTabs = useMemo(() => {
        const allTabs: { id: Subpage, label: string }[] = [
            { id: 'manpower', label: 'Manpower' },
            { id: 'productivity', label: 'Productivity' },
            { id: 'equipment', label: 'Equipment' },
            { id: 'safety', label: 'Safety' },
        ];
        if (currentUser?.role === 'Safety') {
            return allTabs.filter(t => t.id === 'safety');
        }
        return allTabs;
    }, [currentUser]);
    
    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="space-y-6">
            <div className="print-only mb-4">
                <h1 className="text-3xl font-bold text-center">Manpower & Productivity Dashboard</h1>
                <p className="text-xl text-center text-slate-600">{projectName}</p>
                <p className="text-lg text-center text-slate-500">{dateRange.start} to {dateRange.end}</p>
            </div>
            
            <PageHeader
                title="Dashboard"
                subtitle={`Overview for ${projectName}`}
            >
                <button onClick={() => window.print()} className="flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 no-print">
                    <PrinterIcon className="h-5 w-5 mr-2" />
                    Print
                </button>
            </PageHeader>
            
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-sm no-print">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-5 gap-6 items-start">
                    <div className="xl:col-span-1">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Project
                        </label>
                        <ProjectMultiSelectFilter 
                            projects={allProjects}
                            selectedIds={selectedProjects}
                            onSelectionChange={setSelectedProjects}
                        />
                    </div>
                    <div className="xl:col-span-1">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Activity Group
                        </label>
                        <ActivityGroupMultiSelectFilter 
                            activityGroups={allActivityGroups}
                            selectedIds={selectedActivityGroups}
                            onSelectionChange={setSelectedActivityGroups}
                        />
                    </div>
                    <div className="lg:col-span-2 xl:col-span-3">
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

            {hasActiveFilters && (
                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm flex items-center justify-between flex-wrap gap-2 no-print">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filters:</span>
                        {crossFilters.subcontractor && <FilterBadge label="Subcontractor" value={crossFilters.subcontractor} onClear={() => setCrossFilters(p => ({ ...p, subcontractor: null }))} />}
                        {crossFilters.shift && <FilterBadge label="Shift" value={crossFilters.shift} onClear={() => setCrossFilters(p => ({ ...p, shift: null }))} />}
                        {crossFilters.type && <FilterBadge label="Type" value={crossFilters.type} onClear={() => setCrossFilters(p => ({ ...p, type: null }))} />}
                        {crossFilters.violationType && <FilterBadge label="Violation" value={crossFilters.violationType} onClear={() => setCrossFilters(p => ({ ...p, violationType: null }))} />}
                        {crossFilters.equipmentStatus && <FilterBadge label="Eq. Status" value={crossFilters.equipmentStatus} onClear={() => setCrossFilters(p => ({ ...p, equipmentStatus: null }))} />}
                        {crossFilters.equipmentId && <FilterBadge label="Equipment" value={allEquipment.find(e => e.id === crossFilters.equipmentId)?.name || ''} onClear={() => setCrossFilters(p => ({ ...p, equipmentId: null }))} />}
                        {crossFilters.date && <FilterBadge label="Date" value={crossFilters.date} onClear={() => setCrossFilters(p => ({ ...p, date: null }))} />}
                        {crossFilters.projectName && <FilterBadge label="Project" value={crossFilters.projectName} onClear={() => setCrossFilters(p => ({ ...p, projectName: null }))} />}
                    </div>
                    <button onClick={clearCrossFilters} className="text-sm font-semibold text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                        Clear All
                    </button>
                </div>
            )}
            
            {(activeSubpage === 'manpower' || activeSubpage === 'productivity') && (
                <div className="flex items-center justify-end no-print -my-4">
                    <label className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
                        <input type="checkbox" checked={showEmptyDays} onChange={() => setShowEmptyDays(s => !s)} className="rounded text-[#28a745] focus:ring-[#28a745] dark:bg-slate-600 dark:border-slate-500" />
                        <span>Show Empty Days & Weekends</span>
                    </label>
                </div>
            )}

            <div className="mt-6">
                {activeSubpage === 'manpower' && (
                     <DashboardMetrics 
                        records={crossFilteredData.manpower} 
                        allRecordsForStats={filteredManpower}
                        subcontractors={subcontractors} 
                        projects={allProjects}
                        employees={employees}
                        theme={theme}
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
                        records={crossFilteredData.manpower}
                        projects={allProjects}
                        progressRecords={crossFilteredData.progress}
                        activityGroups={allActivityGroups}
                        projectIdsToFilter={projectIdsToFilter}
                        theme={theme}
                        crossFilters={crossFilters}
                        setCrossFilters={setCrossFilters}
                        selectedActivityGroups={selectedActivityGroups}
                        dateRange={dateRange}
                        showEmptyDays={showEmptyDays}
                    />
                )}
                {activeSubpage === 'equipment' && (
                    <EquipmentDashboard
                        equipmentRecords={crossFilteredData.equipment}
                        equipment={allEquipment}
                        theme={theme}
                        crossFilters={crossFilters}
                        setCrossFilters={setCrossFilters}
                    />
                )}
                {activeSubpage === 'safety' && (
                    <SafetyDashboard
                        violations={crossFilteredData.violations}
                        subcontractors={subcontractors}
                        theme={theme}
                        crossFilters={crossFilters}
                        setCrossFilters={setCrossFilters}
                    />
                )}
            </div>
        </div>
    );
};

export default Dashboard;