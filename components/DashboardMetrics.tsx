import React, { useMemo, useRef, useEffect } from 'react';
import { ManpowerRecord, Subcontractor, Project, Employee, Shift, EmployeeType, Theme } from '../types';
import { Pie, Bar, getElementAtEvent } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, Title, PointElement, LineElement, BarElement, Filler, ChartOptions } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { UsersIcon } from './icons/UsersIcon';
import { ClockIcon } from './icons/ClockIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { UsersGroupIcon } from './icons/UsersGroupIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { XCircleIcon } from './icons/XCircleIcon';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, Title, PointElement, LineElement, BarElement, Filler, ChartDataLabels);

export type CrossFilters = {
    subcontractor: string | null;
    shift: Shift | null;
    type: EmployeeType | 'Unknown' | null;
};

interface DashboardMetricsProps {
    records: ManpowerRecord[];
    subcontractors: Subcontractor[];
    projects: Project[];
    employees: Employee[];
    selectedProjects: string[];
    theme: Theme;
    totalEmployees: number;
    todaysHeadcount: number;
    avgDailyManpower: number;
    crossFilters: CrossFilters;
    setCrossFilters: React.Dispatch<React.SetStateAction<CrossFilters>>;
    dateRange: { start: string; end: string };
    showEmptyDays: boolean;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm flex items-center space-x-4">
        <div className="bg-green-100 dark:bg-slate-700 text-[#28a745] dark:text-green-400 rounded-full p-3 flex-shrink-0">
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{title}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
        </div>
    </div>
);

// Material 3 inspired flat colors
const materialChartColors = [
    '#4285F4', // Blue
    '#DB4437', // Red
    '#F4B400', // Yellow
    '#0F9D58', // Green
    '#AB47BC', // Purple
    '#00ACC1', // Cyan
    '#FF7043', // Orange
    '#78909C', // Blue Grey
    '#5C6BC0', // Indigo
    '#EC407A', // Pink
    '#26A69A', // Teal
    '#FFCA28', // Amber
];

const FilterBadge: React.FC<{ label: string; value: string; onClear: () => void }> = ({ label, value, onClear }) => (
    <span className="inline-flex items-center gap-x-1.5 rounded-md bg-green-100 dark:bg-slate-700 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-300">
        <strong>{label}:</strong> {value}
        <button type="button" onClick={onClear} className="group relative -mr-1 h-3.5 w-3.5 rounded-sm hover:bg-green-500/20">
            <span className="sr-only">Remove</span>
            <XCircleIcon className="h-3.5 w-3.5 text-green-600 dark:text-green-400 group-hover:text-green-700 dark:group-hover:text-green-200" />
        </button>
    </span>
);


const DashboardMetrics: React.FC<DashboardMetricsProps> = ({
    records, subcontractors, projects, employees, selectedProjects, theme,
    totalEmployees, todaysHeadcount, avgDailyManpower, crossFilters, setCrossFilters,
    dateRange, showEmptyDays
}) => {
    const subcontractorChartRef = useRef<ChartJS<'bar'>>(null);
    const shiftChartRef = useRef<ChartJS<'pie'>>(null);
    const typeChartRef = useRef<ChartJS<'pie'>>(null);
    
    const employeeTypeMap = useMemo(() => new Map(employees.map(e => [e.empId, e.type])), [employees]);

    const crossFilteredRecords = useMemo(() => {
        return records.filter(r => {
            const type = employeeTypeMap.get(r.empId) || 'Unknown';
            if (crossFilters.subcontractor && r.subcontractor !== crossFilters.subcontractor) return false;
            if (crossFilters.shift && r.shift !== crossFilters.shift) return false;
            if (crossFilters.type && type !== crossFilters.type) return false;
            return true;
        });
    }, [records, crossFilters, employeeTypeMap]);


    const cumulativeHeadcount = crossFilteredRecords.length;
    const totalHours = crossFilteredRecords.reduce((sum, record) => sum + (record.hoursWorked || 0), 0);
    
    const manpowerByDateAndProject = useMemo(() => {
        const projectMapCache = new Map<string, Project | null>();
        const getTopLevelProject = (projectId: string, allProjects: Project[]): Project | null => {
            if (projectMapCache.has(projectId)) return projectMapCache.get(projectId)!;
            let current = allProjects.find(p => p.id === projectId);
            if (!current) { projectMapCache.set(projectId, null); return null; }
            const path = [current];
            while (current.parentId) {
                const parent = allProjects.find(p => p.id === current.parentId);
                if (!parent) break;
                current = parent;
                path.push(current);
            }
            path.forEach(node => projectMapCache.set(node.id, current));
            return current;
        };

        return crossFilteredRecords.reduce((acc, record) => {
            const date = record.date;
            const topLevelProject = getTopLevelProject(record.project, projects);
            if (!topLevelProject) return acc;
            const projectName = topLevelProject.name;
            if (!acc[date]) acc[date] = {};
            acc[date][projectName] = (acc[date][projectName] || 0) + 1;
            return acc;
        }, {} as { [date: string]: { [projectName: string]: number } });
    }, [crossFilteredRecords, projects]);

    const trendChartData = useMemo(() => {
        const { start, end } = dateRange;
        if (!start || !end) return { labels: [], datasets: [] };

        const allDatesInRange: string[] = [];
        let currentDate = new Date(start);
        const endDate = new Date(end);
        currentDate.setUTCHours(12, 0, 0, 0); // Avoid timezone issues
        endDate.setUTCHours(12, 0, 0, 0);

        while (currentDate <= endDate) {
            allDatesInRange.push(currentDate.toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
        }

        const dateDataMap = new Map(allDatesInRange.map(date => {
            const dayOfWeek = new Date(date + 'T12:00:00Z').getUTCDay();
            const total = Object.values(manpowerByDateAndProject[date] || {}).reduce((s, c) => s + c, 0);
            return [date, { total, isWeekend: dayOfWeek === 5 || dayOfWeek === 4 }]; // Friday or Saturday weekend
        }));
        
        const finalDates = showEmptyDays ? allDatesInRange : allDatesInRange.filter(date => (dateDataMap.get(date)?.total || 0) > 0);

        if(finalDates.length === 0) return { labels: [], datasets: [] };

        const allProjectNamesInSelection = Array.from(new Set(Object.values(manpowerByDateAndProject).flatMap(Object.keys))).sort();

        const datasets = allProjectNamesInSelection.map((projectName, index) => ({
            label: projectName,
            data: finalDates.map(date => manpowerByDateAndProject[date]?.[projectName] || 0),
            backgroundColor: materialChartColors[index % materialChartColors.length],
        }));

        return {
            labels: finalDates,
            datasets,
        };
    }, [manpowerByDateAndProject, dateRange, showEmptyDays]);


    // Subcontractor Distribution Data (Bar Chart)
    const manpowerBySubcontractor = crossFilteredRecords.reduce((acc, record) => {
        const subName = record.subcontractor || 'Unknown';
        acc[subName] = (acc[subName] || 0) + 1;
        return acc;
    }, {} as { [key: string]: number });

    const subcontractorChartData = {
        labels: Object.keys(manpowerBySubcontractor),
        datasets: [{
            label: 'Manpower Count',
            data: Object.values(manpowerBySubcontractor),
            backgroundColor: '#4285F4', // Material Blue
            borderColor: '#4285F4',
            borderWidth: 1,
        }],
    };

    // Manpower by Shift (Pie Chart)
    const manpowerByShift = crossFilteredRecords.reduce((acc, record) => {
        acc[record.shift] = (acc[record.shift] || 0) + 1;
        return acc;
    }, {} as Record<Shift, number>);

    const shiftLabels = Object.keys(manpowerByShift) as Shift[];
    const shiftChartData = {
        labels: shiftLabels,
        datasets: [{
            data: shiftLabels.map(label => manpowerByShift[label]),
            backgroundColor: shiftLabels.map(label => label === Shift.DAY ? '#F4B400' : '#5C6BC0'), // Yellow for Day, Indigo for Night
            borderColor: theme === 'dark' ? '#1e293b' : '#fff',
            borderWidth: 2,
        }],
    };

    // Manpower by Type (Pie Chart)
    const manpowerByType = crossFilteredRecords.reduce((acc, record) => {
        const type = employeeTypeMap.get(record.empId) || 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {} as Record<EmployeeType | 'Unknown', number>);

    const typeLabels = Object.keys(manpowerByType);
    const typeColorMap: Record<string, string> = {
        'Direct': '#00ACC1',   // Cyan
        'Indirect': '#AB47BC', // Purple
        'Unknown': '#78909C',  // Blue Grey
    };
    const typeChartData = {
        labels: typeLabels,
        datasets: [{
            data: typeLabels.map(label => manpowerByType[label]),
            backgroundColor: typeLabels.map(label => typeColorMap[label] || '#BDBDBD'), // fallback to a neutral grey
            borderColor: theme === 'dark' ? '#1e293b' : '#fff',
            borderWidth: 2,
        }],
    };
    
    const clearAllFilters = () => {
        setCrossFilters({ subcontractor: null, shift: null, type: null });
    };

    const hasActiveFilters = Object.values(crossFilters).some(f => f !== null);

    // Memoized Chart Options
    const legendColor = theme === 'dark' ? '#cbd5e1' : '#475569';
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0';
    const weekendGridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9';

    const barDataLabelsConfig = {
        color: theme === 'dark' ? '#fff' : '#334155',
        anchor: 'end' as const,
        align: 'end' as const,
        offset: -4,
        font: {
            weight: 'bold' as const,
        },
        formatter: (value: number) => value > 0 ? value : '',
    };

    const trendChartOptions: ChartOptions<'bar'> = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: true, position: 'bottom' as const, labels: { color: legendColor } },
            title: { display: true, text: 'Manpower Histogram', color: legendColor, font: { size: 16 } },
            datalabels: { 
                display: false,
                ...barDataLabelsConfig 
            },
        },
        scales: {
            x: { 
                ticks: { color: legendColor }, 
                grid: { 
                    color: (context: any) => {
                        if (context.tick && trendChartData.labels) {
                            const dateStr = trendChartData.labels[context.tick.value];
                            if(dateStr) {
                                const dayOfWeek = new Date(dateStr + 'T12:00:00Z').getUTCDay();
                                return (dayOfWeek === 4 || dayOfWeek === 5) ? weekendGridColor : gridColor;
                            }
                        }
                        return gridColor;
                    }
                 }, 
                stacked: true 
            },
            y: { ticks: { color: legendColor }, grid: { color: gridColor }, beginAtZero: true, stacked: true }
        },
    }), [theme, legendColor, gridColor, trendChartData.labels, weekendGridColor]);

    const subcontractorChartOptions: ChartOptions<'bar'> = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Subcontractor Distribution', color: legendColor, font: { size: 16 } },
            datalabels: { 
                display: false,
                ...barDataLabelsConfig
             },
        },
        scales: {
            x: { ticks: { color: legendColor }, grid: { color: gridColor } },
            y: { ticks: { color: legendColor }, grid: { color: gridColor }, beginAtZero: true }
        },
    }), [theme, legendColor, gridColor]);
    
    const pieChartDatalabelsConfig = useMemo(() => ({
        display: false,
        color: '#fff',
        font: { weight: 'bold' as const, size: 12 },
        formatter: (value: number, context: any) => {
            const total = context.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
            if (total === 0) return '0%';
            const percentage = (value / total * 100);
            return percentage > 5 ? percentage.toFixed(0) + '%' : '';
        },
    }), []);

    const shiftChartOptions: ChartOptions<'pie'> = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: true, position: 'bottom' as const, labels: { color: legendColor } },
            title: { display: true, text: 'Shift Distribution', color: legendColor, font: { size: 16 } },
            datalabels: pieChartDatalabelsConfig,
        },
    }), [theme, legendColor, pieChartDatalabelsConfig]);

    const typeChartOptions: ChartOptions<'pie'> = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: true, position: 'bottom' as const, labels: { color: legendColor } },
            title: { display: true, text: 'Manpower Type Distribution', color: legendColor, font: { size: 16 } },
            datalabels: pieChartDatalabelsConfig,
        },
    }), [theme, legendColor, pieChartDatalabelsConfig]);

    const handleSubcontractorClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
        if (!subcontractorChartRef.current) return;
        const elements = getElementAtEvent(subcontractorChartRef.current, event);
        if (elements.length > 0) {
            const { index } = elements[0];
            const label = subcontractorChartData.labels?.[index] as string;
            if (label) {
                setCrossFilters(prev => ({
                    ...prev,
                    subcontractor: prev.subcontractor === label ? null : label,
                }));
            }
        }
    };

    const handleShiftClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
        if (!shiftChartRef.current) return;
        const elements = getElementAtEvent(shiftChartRef.current, event);
        if (elements.length > 0) {
            const { index } = elements[0];
            const label = shiftChartData.labels?.[index] as Shift;
            if (label) {
                setCrossFilters(prev => ({
                    ...prev,
                    shift: prev.shift === label ? null : label,
                }));
            }
        }
    };

    const handleTypeClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
        if (!typeChartRef.current) return;
        const elements = getElementAtEvent(typeChartRef.current, event);
        if (elements.length > 0) {
            const { index } = elements[0];
            const label = typeChartData.labels?.[index] as EmployeeType | 'Unknown';
            if (label) {
                setCrossFilters(prev => ({
                    ...prev,
                    type: prev.type === label ? null : label,
                }));
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 print:grid-cols-5 gap-6">
                <StatCard title="No. of Employees" value={totalEmployees} icon={<UsersIcon className="h-6 w-6" />} />
                <StatCard title="Today's Headcount" value={todaysHeadcount} icon={<UserCircleIcon className="h-6 w-6" />} />
                <StatCard title="Cumulative Headcount" value={cumulativeHeadcount} icon={<UsersGroupIcon className="h-6 w-6" />} />
                <StatCard title="Avg. Daily Manpower" value={avgDailyManpower.toFixed(1)} icon={<ChartBarIcon className="h-6 w-6" />} />
                <StatCard title="Total Hours Worked" value={totalHours.toFixed(1)} icon={<ClockIcon className="h-6 w-6" />} />
            </div>

            {records.length > 0 ? (
                <div className="space-y-6">
                     {hasActiveFilters && (
                        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm flex items-center justify-between flex-wrap gap-2 no-print">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filters:</span>
                                {crossFilters.subcontractor && <FilterBadge label="Subcontractor" value={crossFilters.subcontractor} onClear={() => setCrossFilters(p => ({ ...p, subcontractor: null }))} />}
                                {crossFilters.shift && <FilterBadge label="Shift" value={crossFilters.shift} onClear={() => setCrossFilters(p => ({ ...p, shift: null }))} />}
                                {crossFilters.type && <FilterBadge label="Type" value={crossFilters.type} onClear={() => setCrossFilters(p => ({ ...p, type: null }))} />}
                            </div>
                            <button onClick={clearAllFilters} className="text-sm font-semibold text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                                Clear All
                            </button>
                        </div>
                    )}
                    <div className="grid grid-cols-1 lg:grid-cols-2 print:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm h-96 print-break-inside-avoid">
                            <Bar data={trendChartData} options={trendChartOptions} />
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm h-96 print-break-inside-avoid">
                            <Bar 
                                ref={subcontractorChartRef}
                                onClick={handleSubcontractorClick}
                                data={subcontractorChartData} 
                                options={subcontractorChartOptions}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm h-80 print-break-inside-avoid">
                            <Pie 
                                ref={shiftChartRef}
                                onClick={handleShiftClick}
                                data={shiftChartData} 
                                options={shiftChartOptions}
                            />
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm h-80 print-break-inside-avoid">
                           <Pie
                                ref={typeChartRef}
                                onClick={handleTypeClick}
                                data={typeChartData}
                                options={typeChartOptions}
                            />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm text-center">
                    <p className="text-slate-500 dark:text-slate-400">No data available for the selected project and date range.</p>
                </div>
            )}
        </div>
    );
};

export default DashboardMetrics;