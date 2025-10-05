import React, { useMemo, useRef, useEffect } from 'react';
import { ManpowerRecord, Subcontractor, Project, Employee, Shift, EmployeeType, Theme } from '../types';
import { Pie, Bar, getElementAtEvent } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, Title, PointElement, LineElement, BarElement, Filler, ChartOptions } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { ClockIcon } from './icons/ClockIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { CrossFilters } from '../pages/Dashboard';
import { CalendarIcon } from './icons/CalendarIcon';
import { CalculatorIcon } from './icons/CalculatorIcon';
import { FilterIcon } from './icons/FilterIcon';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, Title, PointElement, LineElement, BarElement, Filler, ChartDataLabels);

interface DashboardMetricsProps {
    records: ManpowerRecord[];
    allRecordsForStats: ManpowerRecord[]; // Unfiltered records for top-level stats
    subcontractors: Subcontractor[];
    projects: Project[];
    employees: Employee[];
    theme: Theme;
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
    '#4285F4', '#DB4437', '#F4B400', '#0F9D58', '#AB47BC', '#00ACC1',
    '#FF7043', '#78909C', '#5C6BC0', '#EC407A', '#26A69A', '#FFCA28',
];


const DashboardMetrics: React.FC<DashboardMetricsProps> = ({
    records, allRecordsForStats, subcontractors, projects, employees, theme,
    todaysHeadcount, avgDailyManpower, crossFilters, setCrossFilters,
    dateRange, showEmptyDays
}) => {
    const trendChartRef = useRef<ChartJS<'bar'>>(null);
    const subcontractorChartRef = useRef<ChartJS<'bar'>>(null);
    const shiftChartRef = useRef<ChartJS<'pie'>>(null);
    const typeChartRef = useRef<ChartJS<'pie'>>(null);
    
    const employeeTypeMap = useMemo(() => new Map(employees.map(e => [e.empId, e.type])), [employees]);

    const totalEmployees = useMemo(() => new Set(allRecordsForStats.map(r => r.empId)).size, [allRecordsForStats]);
    const cumulativeHeadcount = records.length;
    const totalHours = records.reduce((sum, record) => sum + (record.hoursWorked || 0), 0);
    
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

        // FIX: Explicitly type accumulator `acc` and value `record` to fix type inference issues downstream.
        return records.reduce((acc: { [date: string]: { [projectName: string]: number } }, record: ManpowerRecord) => {
            const date = record.date;
            const topLevelProject = getTopLevelProject(record.project, projects);
            if (!topLevelProject) return acc;
            const projectName = topLevelProject.name;
            if (!acc[date]) acc[date] = {};
            acc[date][projectName] = (acc[date][projectName] || 0) + 1;
            return acc;
        }, {} as { [date: string]: { [projectName: string]: number } });
    }, [records, projects]);

    const trendChartData = useMemo(() => {
        const { start, end } = dateRange;
        if (!start || !end) return { labels: [], datasets: [] };

        const allDatesInRange: string[] = [];
        let currentDate = new Date(start);
        const endDate = new Date(end);
        currentDate.setUTCHours(12, 0, 0, 0); 
        endDate.setUTCHours(12, 0, 0, 0);

        while (currentDate <= endDate) {
            allDatesInRange.push(currentDate.toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
        }

        const dateDataMap = new Map(allDatesInRange.map(date => {
            // FIX: Explicitly type accumulator and current value in reduce to prevent type inference issues.
            const total = Object.values(manpowerByDateAndProject[date] || {}).reduce((s: number, c) => s + (c as number), 0);
            return [date, { total }];
        }));
        
        const finalDates = showEmptyDays ? allDatesInRange : allDatesInRange.filter(date => (dateDataMap.get(date)?.total || 0) > 0);

        if(finalDates.length === 0) return { labels: [], datasets: [] };

        const allProjectNamesInSelection = Array.from(new Set(Object.values(manpowerByDateAndProject).flatMap(Object.keys))).sort();

        const datasets = allProjectNamesInSelection.map((projectName, index) => ({
            label: projectName,
            data: finalDates.map(date => manpowerByDateAndProject[date]?.[projectName] || 0),
            backgroundColor: materialChartColors[index % materialChartColors.length],
            borderWidth: crossFilters.projectName === projectName ? 3 : 1,
            borderColor: theme === 'dark' ? '#1e1e2d' : '#ffffff',
        }));

        return {
            labels: finalDates,
            datasets,
        };
    }, [manpowerByDateAndProject, dateRange, showEmptyDays, crossFilters, theme]);

    const manpowerBySubcontractor = records.reduce((acc, record) => {
        const subName = record.subcontractor || 'Unknown';
        acc[subName] = (acc[subName] || 0) + 1;
        return acc;
    }, {} as { [key: string]: number });

    const subcontractorChartData = {
        labels: Object.keys(manpowerBySubcontractor),
        datasets: [{
            label: 'Manpower Count',
            data: Object.values(manpowerBySubcontractor),
            backgroundColor: Object.keys(manpowerBySubcontractor).map((sub, i) =>
                 !crossFilters.subcontractor || crossFilters.subcontractor === sub
                    ? materialChartColors[i % materialChartColors.length]
                    : `${materialChartColors[i % materialChartColors.length]}55` // 33% opacity
            ),
        }],
    };

    const manpowerByShift = records.reduce((acc, record) => {
        acc[record.shift] = (acc[record.shift] || 0) + 1;
        return acc;
    }, {} as Record<Shift, number>);

    const shiftLabels = Object.keys(manpowerByShift) as Shift[];
    const shiftChartData = {
        labels: shiftLabels,
        datasets: [{
            data: shiftLabels.map(label => manpowerByShift[label]),
            backgroundColor: shiftLabels.map(label => {
                const color = label === Shift.DAY ? '#F4B400' : '#5C6BC0';
                return !crossFilters.shift || crossFilters.shift === label ? color : `${color}55`;
            }),
        }],
    };

    const manpowerByType = records.reduce((acc, record) => {
        const type = employeeTypeMap.get(record.empId) || 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {} as Record<EmployeeType | 'Unknown', number>);

    const typeLabels = Object.keys(manpowerByType);
    const typeColorMap: Record<string, string> = { 'Direct': '#00ACC1', 'Indirect': '#AB47BC', 'Unknown': '#78909C' };
    const typeChartData = {
        labels: typeLabels,
        datasets: [{
            data: typeLabels.map(label => manpowerByType[label]),
            backgroundColor: typeLabels.map(label => {
                const color = typeColorMap[label] || '#BDBDBD';
                return !crossFilters.type || crossFilters.type === label ? color : `${color}55`;
            }),
        }],
    };
    
    const legendColor = theme === 'dark' ? '#cbd5e1' : '#475569';
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0';
    const weekendGridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9';

    // FIX: Cast the returned options object to ChartOptions<T> to resolve generic type inference issues between bar and pie charts.
    const createChartOptions = <T extends 'bar' | 'pie'>(title: string, additionalOptions: Partial<ChartOptions<T>> = {}): ChartOptions<T> => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: true, position: 'bottom' as const, labels: { color: legendColor } },
            title: { display: true, text: title, color: legendColor, font: { size: 16 } },
            datalabels: { display: false },
        },
        ...additionalOptions,
    }) as ChartOptions<T>;
    
    const trendChartOptions: ChartOptions<'bar'> = createChartOptions('Manpower Histogram', {
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
        onClick: (event, elements, chart) => {
            if (elements.length > 0) {
                const { index, datasetIndex } = elements[0];
                const date = trendChartData.labels?.[index];
                const projectName = chart.data.datasets[datasetIndex].label;

                setCrossFilters(prev => ({
                    ...prev,
                    date: prev.date === date ? null : date,
                    projectName: prev.projectName === projectName ? null : projectName
                }));
            } else {
                setCrossFilters(prev => ({ ...prev, date: null, projectName: null }));
            }
        }
    });

    const subcontractorChartOptions: ChartOptions<'bar'> = createChartOptions('Subcontractor Distribution', {
        plugins: { legend: { display: false }, title: { display: true, text: 'Subcontractor Distribution', color: legendColor, font: { size: 16 } }, datalabels: { display: false } },
        scales: { x: { ticks: { color: legendColor }, grid: { color: gridColor } }, y: { ticks: { color: legendColor }, grid: { color: gridColor }, beginAtZero: true } },
    });

    // FIX: Explicitly specify the chart type generic for createChartOptions to prevent
    // type inference issues where bar chart options were being assigned to pie charts.
    const shiftChartOptions: ChartOptions<'pie'> = createChartOptions<'pie'>('Shift Distribution');
    const typeChartOptions: ChartOptions<'pie'> = createChartOptions<'pie'>('Manpower Type Distribution');
    
    const handleChartClick = (
        event: React.MouseEvent<HTMLCanvasElement>,
        ref: React.RefObject<ChartJS<any>>,
        data: any,
        filterKey: keyof CrossFilters
    ) => {
        if (!ref.current) return;
        const elements = getElementAtEvent(ref.current, event);
        if (elements.length > 0) {
            const { index } = elements[0];
            const label = data.labels?.[index] as string;
            if (label) {
                 setCrossFilters(prev => ({ ...prev, [filterKey]: prev[filterKey] === label ? null : label }));
            }
        } else {
            setCrossFilters(prev => ({ ...prev, [filterKey]: null }));
        }
    };


    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 no-print">
                <StatCard title="Today's Headcount" value={todaysHeadcount} icon={<CalendarIcon className="h-6 w-6" />} />
                <StatCard title="Avg. Daily Manpower" value={avgDailyManpower.toFixed(1)} icon={<CalculatorIcon className="h-6 w-6" />} />
                <StatCard title="Filtered Headcount" value={cumulativeHeadcount} icon={<FilterIcon className="h-6 w-6" />} />
                <StatCard title="Filtered Hours" value={totalHours.toFixed(1)} icon={<ClockIcon className="h-6 w-6" />} />
                <StatCard title="Total Employees" value={totalEmployees} icon={<UserCircleIcon className="h-6 w-6" />} />
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm h-[60vh] print-break-inside-avoid print-chart-container">
                <Bar ref={trendChartRef} data={trendChartData} options={trendChartOptions} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 print:grid-cols-3 gap-6">
                 <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm h-96 print-break-inside-avoid print-chart-container">
                    <Bar ref={subcontractorChartRef} data={subcontractorChartData} options={subcontractorChartOptions} onClick={(e) => handleChartClick(e, subcontractorChartRef, subcontractorChartData, 'subcontractor')}/>
                </div>
                 <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm h-96 print-break-inside-avoid print-chart-container">
                    <Pie ref={shiftChartRef} data={shiftChartData} options={shiftChartOptions} onClick={(e) => handleChartClick(e, shiftChartRef, shiftChartData, 'shift')} />
                </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm h-80 print-break-inside-avoid print-chart-container">
                 <Pie ref={typeChartRef} data={typeChartData} options={typeChartOptions} onClick={(e) => handleChartClick(e, typeChartRef, typeChartData, 'type')} />
            </div>
        </div>
    );
};

export default DashboardMetrics;