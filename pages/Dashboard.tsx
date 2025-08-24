import React, { useMemo, useState } from 'react';
import { useStore } from '../store/appStore';
import { useManpowerRecordsForCurrentUser, useProjectsForCurrentUser, useProgressRecordsForCurrentUser } from '../hooks/useData';
import DashboardMetrics, { CrossFilters } from '../components/DashboardMetrics';
import ProductivityDashboard from '../components/ProductivityDashboard';
import PageHeader from '../components/ui/PageHeader';
import { ProjectMultiSelectFilter } from '../components/ProjectMultiSelectFilter';
import { Project, ManpowerRecord, ProgressRecord } from '../types';
import { useQuery } from '@tanstack/react-query';
import * as api from '../utils/api';
import { PrinterIcon } from '../components/icons/PrinterIcon';
import { GoogleGenAI } from "@google/genai";

const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.572L16.5 21.75l-.398-1.178a3.375 3.375 0 00-2.3-2.3L12.75 18l1.178-.398a3.375 3.375 0 002.3-2.3L16.5 14.25l.398 1.178a3.375 3.375 0 002.3 2.3l1.178.398-1.178.398a3.375 3.375 0 00-2.3 2.3z" />
  </svg>
);

const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
    const createMarkup = () => {
        const html = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/^\s*[\*-]\s+(.*)/gm, '<li class="ml-4 list-disc">$1</li>')
            .replace(/(\<\/li\>)(?!\<li\>)/g, '</li></ul>')
            .replace(/(\<li class="ml-4 list-disc"\>)/g, '<ul><li class="ml-4 list-disc">')
            .replace(/\n/g, '<br />');
        return { __html: html };
    };
    return <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-300" dangerouslySetInnerHTML={createMarkup()} />;
};


interface GeminiInsightsProps {
    records: ManpowerRecord[];
    progressRecords: ProgressRecord[];
    projects: Project[];
    projectIdsToFilter: string[];
    dateRange: { start: string; end: string };
    projectName: string;
}

const GeminiInsights: React.FC<GeminiInsightsProps> = ({ records, progressRecords, projects, projectIdsToFilter, dateRange, projectName }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [insights, setInsights] = useState('');
    const [error, setError] = useState('');

    const generateInsights = async () => {
        setIsLoading(true);
        setInsights('');
        setError('');

        try {
            if (!process.env.API_KEY) {
                // For this demo environment, we can show a specific message.
                setError("API_KEY is not configured. This feature requires a valid Gemini API key.");
                setIsLoading(false);
                return;
            }
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const activities = projects.filter(p => p.type === 'Activity' && projectIdsToFilter.includes(p.id));

            let productivitySummary = 'No productivity data available for the selected activities.';
            if (activities.length > 0 && progressRecords.length > 0 && records.length > 0) {
                const activityInsights = activities.slice(0, 3).map(activity => {
                    const relevantProgress = progressRecords.filter(pr => pr.activityId === activity.id);
                    const relevantManpower = records.filter(mr => mr.project === activity.id);

                    const totalQty = relevantProgress.reduce((sum, r) => sum + r.qty, 0);
                    const totalHours = relevantManpower.reduce((sum, r) => sum + (r.hoursWorked || 0), 0);
                    
                    if (totalHours > 0 && totalQty > 0) {
                        const actualProductivity = totalQty / totalHours;
                        let insight = `For activity "${activity.name}", the actual productivity was ${actualProductivity.toFixed(2)} ${activity.uom}/Man-hour.`;
                        if(activity.companyNorm) {
                            insight += ` The company norm is ${activity.companyNorm} ${activity.uom}/Man-hour.`;
                            const variance = ((actualProductivity - activity.companyNorm) / activity.companyNorm) * 100;
                            insight += ` This is a variance of ${variance.toFixed(1)}%.`;
                        }
                        return insight;
                    }
                    return null;
                }).filter(Boolean);

                if (activityInsights.length > 0) {
                    productivitySummary = activityInsights.join('\n');
                }
            }

            const prompt = `
                You are a construction project analyst. Based on the following data for the project "${projectName}" from ${dateRange.start} to ${dateRange.end}, provide a concise analysis in 3-4 bullet points.
                Focus on manpower trends and productivity performance. Be direct and insightful.

                Data Summary:
                - Total manpower records in this period: ${records.length}
                - Total man-hours worked: ${records.reduce((sum, r) => sum + (r.hoursWorked || 0), 0).toFixed(1)}
                - Number of unique employees: ${new Set(records.map(r => r.empId)).size}

                Productivity Details:
                ${productivitySummary}

                Your analysis:
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            
            setInsights(response.text);

        } catch (e) {
            console.error(e);
            setError('Failed to generate insights. Please check the console for details.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-sm no-print">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white flex items-center">
                    <SparklesIcon className="h-6 w-6 text-yellow-400 mr-2" />
                    AI-Powered Insights
                </h3>
                <button
                    onClick={generateInsights}
                    disabled={isLoading}
                    className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#28a745] hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#28a745] disabled:bg-green-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Generating...' : 'Generate Analysis'}
                </button>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 min-h-[8rem] flex items-center justify-center">
                {isLoading && (
                    <div className="flex flex-col items-center text-center">
                         <svg className="animate-spin h-6 w-6 text-[#28a745] mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-slate-500 dark:text-slate-400">Analyzing data with Gemini...</p>
                    </div>
                )}
                {error && <p className="text-sm text-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/50 rounded-md py-3 px-4">{error}</p>}
                {insights && <SimpleMarkdown text={insights} />}
                {!isLoading && !insights && !error && (
                    <div className="text-center text-slate-500 dark:text-slate-400">
                        <p>Click "Generate Analysis" to get AI-powered insights on your selected data.</p>
                    </div>
                )}
            </div>
        </div>
    );
};


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
            
            <GeminiInsights 
                records={filteredRecords}
                progressRecords={allProgressRecords}
                projects={allProjects}
                projectIdsToFilter={projectIdsToFilter}
                dateRange={dateRange}
                projectName={projectName}
            />

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