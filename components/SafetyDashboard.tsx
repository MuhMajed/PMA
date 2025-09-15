import React, { useMemo, useRef } from 'react';
import { SafetyViolation, Subcontractor, Theme, ViolationType } from '../types';
import { Pie, Bar, getElementAtEvent } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, Title, BarElement, ChartOptions } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { ShieldExclamationIcon } from './icons/ShieldExclamationIcon';
import { CrossFilters } from '../pages/Dashboard';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, Title, BarElement, ChartDataLabels);

interface SafetyDashboardProps {
    violations: SafetyViolation[];
    subcontractors: Subcontractor[];
    theme: Theme;
    crossFilters: CrossFilters;
    setCrossFilters: React.Dispatch<React.SetStateAction<CrossFilters>>;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm flex items-center space-x-4">
        <div className="bg-red-100 dark:bg-slate-700 text-red-600 dark:text-red-400 rounded-full p-3 flex-shrink-0">
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{title}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
        </div>
    </div>
);

const materialChartColors = [
    '#DB4437', '#F4B400', '#FF7043', '#EC407A', '#AB47BC', '#78909C', '#5C6BC0', 
];

const SafetyDashboard: React.FC<SafetyDashboardProps> = ({ violations, subcontractors, theme, crossFilters, setCrossFilters }) => {
    const byDateRef = useRef<ChartJS<'bar'>>(null);
    const bySubRef = useRef<ChartJS<'bar'>>(null);
    const byTypeRef = useRef<ChartJS<'pie'>>(null);

    const violationsBySub = useMemo(() => {
        return violations.reduce((acc, v) => {
            acc[v.subcontractor] = (acc[v.subcontractor] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [violations]);

    const violationsByType = useMemo(() => {
        return violations.reduce((acc, v) => {
            acc[v.violationType] = (acc[v.violationType] || 0) + 1;
            return acc;
        }, {} as Record<ViolationType, number>);
    }, [violations]);

    const violationsByDate = useMemo(() => {
        return violations.reduce((acc, v) => {
            acc[v.date] = (acc[v.date] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [violations]);

    const sortedDates = useMemo(() => Object.keys(violationsByDate).sort(), [violationsByDate]);

    // Chart Data
    const bySubData = {
        labels: Object.keys(violationsBySub),
        datasets: [{ 
            label: 'Violations', 
            data: Object.values(violationsBySub), 
            backgroundColor: Object.keys(violationsBySub).map((sub, i) => 
                !crossFilters.subcontractor || crossFilters.subcontractor === sub ? materialChartColors[i % materialChartColors.length] : `${materialChartColors[i % materialChartColors.length]}55`
            )
        }],
    };
    const byTypeData = {
        labels: Object.keys(violationsByType),
        datasets: [{ 
            data: Object.values(violationsByType), 
            backgroundColor: Object.keys(violationsByType).map((type, i) => 
                !crossFilters.violationType || crossFilters.violationType === type ? materialChartColors[i % materialChartColors.length] : `${materialChartColors[i % materialChartColors.length]}55`
            )
        }],
    };
    const byDateData = {
        labels: sortedDates,
        datasets: [{ 
            label: 'Violations', 
            data: sortedDates.map(date => violationsByDate[date]), 
            backgroundColor: sortedDates.map(date => 
                !crossFilters.date || crossFilters.date === date ? '#DB4437' : '#DB443755'
            )
        }],
    };

    const legendColor = theme === 'dark' ? '#cbd5e1' : '#475569';
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0';

    const barChartOptions: ChartOptions<'bar'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, title: { display: true, color: legendColor, font: { size: 16 } }, datalabels: { display: false } },
        scales: { x: { ticks: { color: legendColor }, grid: { color: gridColor } }, y: { ticks: { color: legendColor }, grid: { color: gridColor }, beginAtZero: true } },
    };
    
    const pieChartOptions: ChartOptions<'pie'> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { color: legendColor } }, title: { display: true, color: legendColor, font: { size: 16 } }, datalabels: { display: false } },
    };

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Filtered Violations" value={violations.length} icon={<ShieldExclamationIcon className="h-6 w-6" />} />
            </div>

            {violations.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 print:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm h-96 print-break-inside-avoid print-chart-container">
                        <Bar ref={byDateRef} data={byDateData} options={{ ...barChartOptions, plugins: { ...barChartOptions.plugins, title: { ...barChartOptions.plugins?.title, text: 'Violations Over Time' } } }} onClick={(e) => handleChartClick(e, byDateRef, byDateData, 'date')}/>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm h-96 print-break-inside-avoid print-chart-container">
                        <Bar ref={bySubRef} data={bySubData} options={{ ...barChartOptions, plugins: { ...barChartOptions.plugins, title: { ...barChartOptions.plugins?.title, text: 'Violations by Subcontractor' } } }} onClick={(e) => handleChartClick(e, bySubRef, bySubData, 'subcontractor')} />
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm h-80 lg:col-span-2 print-break-inside-avoid print-chart-container">
                        <Pie ref={byTypeRef} data={byTypeData} options={{ ...pieChartOptions, plugins: { ...pieChartOptions.plugins, title: { ...pieChartOptions.plugins?.title, text: 'Violations by Type' } } }} onClick={(e) => handleChartClick(e, byTypeRef, byTypeData, 'violationType')} />
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm text-center">
                    <p className="text-slate-500 dark:text-slate-400">No safety violations recorded for the selected filters.</p>
                </div>
            )}
        </div>
    );
};

export default SafetyDashboard;