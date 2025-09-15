import React, { useMemo, useState, useEffect, useRef } from 'react';
import { ManpowerRecord, ProgressRecord, Project, Theme, ActivityGroup } from '../types';
import { Line, getElementAtEvent } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, Title, Tooltip, Legend, PointElement, LineElement, Filler, ChartDataset, ChartOptions, ChartEvent, ActiveElement } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { CrossFilters } from '../pages/Dashboard';

ChartJS.register(CategoryScale, LinearScale, Title, Tooltip, Legend, PointElement, LineElement, Filler, ChartDataLabels);

interface ProductivityDashboardProps {
    records: ManpowerRecord[];
    progressRecords: ProgressRecord[];
    projects: Project[];
    activityGroups: ActivityGroup[];
    projectIdsToFilter: string[];
    theme: Theme;
    crossFilters: CrossFilters;
    setCrossFilters: React.Dispatch<React.SetStateAction<CrossFilters>>;
    selectedActivityGroups: string[];
    dateRange: { start: string; end: string };
    showEmptyDays: boolean;
}

const materialChartColors = [
    '#4285F4', '#DB4437', '#F4B400', '#0F9D58', '#AB47BC', '#00ACC1',
    '#FF7043', '#78909C', '#5C6BC0', '#EC407A', '#26A69A', '#FFCA28',
    '#66BB6A', '#9CCC65', '#D4E157', '#FFEE58', '#FFD54F', '#FFB74D'
];

const ProductivityDashboard: React.FC<ProductivityDashboardProps> = ({
    records, progressRecords, projects, activityGroups, projectIdsToFilter, theme, crossFilters, setCrossFilters, selectedActivityGroups, dateRange, showEmptyDays
}) => {
    const [showUniversalNorm, setShowUniversalNorm] = useState(true);
    const [showCompanyNorm, setShowCompanyNorm] = useState(true);
    const chartRef = useRef<ChartJS<'line'>>(null);
    
    const activityGroupMap = useMemo(() => new Map(activityGroups.map(g => [g.id, g])), [activityGroups]);
    
    const productivityChartData = useMemo(() => {
        const { start, end } = dateRange;
        if (!start || !end) return null;

        const allDatesInRange: string[] = [];
        let currentDate = new Date(start);
        const endDate = new Date(end);
        currentDate.setUTCHours(12, 0, 0, 0); 
        endDate.setUTCHours(12, 0, 0, 0);

        while (currentDate <= endDate) {
            allDatesInRange.push(currentDate.toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
        }

        const manHoursByDate = records.reduce((acc, r) => {
            if (!acc[r.project]) acc[r.project] = {};
            acc[r.project][r.date] = (acc[r.project][r.date] || 0) + (r.hoursWorked || 0);
            return acc;
        }, {} as Record<string, Record<string, number>>);

        const progressByDate = progressRecords.reduce((acc, r) => {
            if (!acc[r.activityId]) acc[r.activityId] = {};
            acc[r.activityId][r.date] = (acc[r.activityId][r.date] || 0) + r.qty;
            return acc;
        }, {} as Record<string, Record<string, number>>);
        
        const datasets: ChartDataset<'line'>[] = [];
        const hasDataOnDate = new Set<string>();
        
        let uniqueActivityGroupIds = [...new Set(progressRecords.map(pr => pr.activityGroupId))];
        if (selectedActivityGroups && selectedActivityGroups.length > 0) {
            uniqueActivityGroupIds = uniqueActivityGroupIds.filter(id => selectedActivityGroups.includes(id));
        }


        uniqueActivityGroupIds.forEach((groupId, index) => {
            const group = activityGroupMap.get(groupId);
            if (!group) return;

            const color = materialChartColors[index % materialChartColors.length];
            
            const relevantActivityIds = new Set(progressRecords.filter(pr => pr.activityGroupId === groupId).map(pr => pr.activityId));
            
            const productivityData = allDatesInRange.map(date => {
                let totalQty = 0;
                let totalHours = 0;
                
                relevantActivityIds.forEach(activityId => {
                    const progressForDate = progressByDate[activityId]?.[date];
                    if (progressForDate) {
                        totalQty += progressForDate;
                        totalHours += manHoursByDate[activityId]?.[date] || 0;
                    }
                });
                
                const productivity = totalHours > 0 ? (totalQty / totalHours) : NaN;
                if (!isNaN(productivity)) {
                    hasDataOnDate.add(date);
                }
                return productivity;
            });
            
            if (productivityData.some(p => !isNaN(p))) {
                 datasets.push({
                    label: `${group.name} (Actual)`,
                    data: productivityData,
                    borderColor: color,
                    backgroundColor: `${color}33`,
                    tension: 0.3,
                    yAxisID: 'y',
                });
            }

            if (uniqueActivityGroupIds.length === 1) {
                if (showUniversalNorm && typeof group.universalNorm === 'number') {
                    datasets.push({
                        label: `${group.name} (Universal Norm)`,
                        data: Array(allDatesInRange.length).fill(group.universalNorm),
                        borderColor: '#FF7043',
                        borderDash: [5, 5],
                        pointRadius: 0,
                        yAxisID: 'y',
                        hidden: !showUniversalNorm
                    });
                }
                 if (showCompanyNorm && typeof group.companyNorm === 'number') {
                    datasets.push({
                        label: `${group.name} (Company Norm)`,
                        data: Array(allDatesInRange.length).fill(group.companyNorm),
                        borderColor: '#78909C',
                        borderDash: [10, 10],
                        pointRadius: 0,
                        yAxisID: 'y',
                        hidden: !showCompanyNorm
                    });
                }
            }
        });

        const finalDates = showEmptyDays ? allDatesInRange : allDatesInRange.filter(date => hasDataOnDate.has(date));
        if (finalDates.length === 0) return null;

        const dateToIndexMap = new Map(allDatesInRange.map((date, i) => [date, i]));
        const finalDatasets = datasets.map(ds => ({
            ...ds,
            data: finalDates.map(date => {
                const originalIndex = dateToIndexMap.get(date);
                return originalIndex !== undefined ? (ds.data[originalIndex] as any) : NaN;
            })
        }));


        return {
            labels: finalDates,
            datasets: finalDatasets,
        };

    }, [progressRecords, records, dateRange, showEmptyDays, showUniversalNorm, showCompanyNorm, activityGroupMap, selectedActivityGroups]);
    
    const shouldShowNormToggles = useMemo(() => {
        let uniqueGroupIds = new Set(progressRecords.map(pr => pr.activityGroupId));
        if (selectedActivityGroups && selectedActivityGroups.length > 0) {
            uniqueGroupIds = new Set([...uniqueGroupIds].filter(id => selectedActivityGroups.includes(id)));
        }
        return uniqueGroupIds.size === 1;
    }, [progressRecords, selectedActivityGroups]);

    const legendColor = theme === 'dark' ? '#cbd5e1' : '#475569';
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0';

    const chartOptions: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        onHover: (event: ChartEvent, elements: ActiveElement[], chart: ChartJS) => {
            const canvas = chart.canvas;
            if (canvas) {
                canvas.style.cursor = elements.length > 0 ? 'pointer' : 'default';
            }
        },
        plugins: {
            legend: { 
                display: true,
                position: 'bottom' as const,
                labels: { color: legendColor }
            },
            title: { display: true, text: 'Productivity (Units per Man-Hour)', color: legendColor, font: { size: 16 } },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += context.parsed.y.toFixed(2);
                        }
                        return label;
                    }
                }
            },
            datalabels: { display: false },
        },
        scales: {
            x: { ticks: { color: legendColor }, grid: { color: gridColor } },
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: { display: true, text: 'Productivity', color: legendColor },
                ticks: { color: legendColor },
                grid: { color: gridColor },
                beginAtZero: true
            },
        },
        interaction: {
            intersect: false,
            mode: 'index',
        },
        spanGaps: true, // This will make the line connect over NaN points
    };

    const handleClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
        if (!chartRef.current || !productivityChartData) return;
        const elements = getElementAtEvent(chartRef.current, event);
        if (elements.length > 0) {
            const { index } = elements[0];
            const date = productivityChartData.labels?.[index];
            if (date) {
                setCrossFilters(prev => ({
                    ...prev,
                    date: prev.date === date ? null : date
                }));
            }
        } else {
            setCrossFilters(prev => ({ ...prev, date: null }));
        }
    };

    if (!productivityChartData || productivityChartData.datasets.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm text-center">
                <p className="text-slate-500 dark:text-slate-400">No productivity data available for the selected filters. Please ensure manpower and progress are recorded for the same activities.</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm h-[60vh] print-break-inside-avoid print-chart-container">
                <Line ref={chartRef} data={productivityChartData} options={chartOptions} onClick={handleClick} />
            </div>
            {shouldShowNormToggles && (
                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm flex items-center justify-center space-x-6 no-print">
                    <label className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
                        <input type="checkbox" checked={showUniversalNorm} onChange={() => setShowUniversalNorm(s => !s)} className="rounded text-[#28a745] focus:ring-[#28a745] dark:bg-slate-600 dark:border-slate-500" />
                        <span>Show Universal Norm</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
                        <input type="checkbox" checked={showCompanyNorm} onChange={() => setShowCompanyNorm(s => !s)} className="rounded text-[#28a745] focus:ring-[#28a745] dark:bg-slate-600 dark:border-slate-500" />
                        <span>Show Company Norm</span>
                    </label>
                </div>
            )}
        </div>
    );
};

export default ProductivityDashboard;