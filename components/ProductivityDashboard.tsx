import React, { useMemo, useState } from 'react';
import { ManpowerRecord, ProgressRecord, Project } from '../types';
import { Theme } from '../App';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, Title, Tooltip, Legend, PointElement, LineElement, Filler, ChartDataset } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, Title, Tooltip, Legend, PointElement, LineElement, Filler);

interface ProductivityDashboardProps {
    records: ManpowerRecord[];
    progressRecords: ProgressRecord[];
    projects: Project[];
    projectIdsToFilter: string[];
    theme: Theme;
}

const materialChartColors = [
    '#4285F4', '#DB4437', '#F4B400', '#0F9D58', '#AB47BC', '#00ACC1',
    '#FF7043', '#78909C', '#5C6BC0', '#EC407A', '#26A69A', '#FFCA28',
    '#66BB6A', '#9CCC65', '#D4E157', '#FFEE58', '#FFD54F', '#FFB74D'
];

const ProductivityDashboard: React.FC<ProductivityDashboardProps> = ({
    records, progressRecords, projects, projectIdsToFilter, theme
}) => {
    const [showUniversalNorm, setShowUniversalNorm] = useState(true);
    const [showCompanyNorm, setShowCompanyNorm] = useState(true);

    const activities = useMemo(() => 
        projects.filter(p => p.type === 'Activity' && projectIdsToFilter.includes(p.id)), 
        [projects, projectIdsToFilter]
    );
    
    const productivityChartData = useMemo(() => {
        if (activities.length === 0) return null;

        const manHoursByDate = records.reduce((acc, r) => {
            if (!acc[r.project]) acc[r.project] = {};
            acc[r.project][r.date] = (acc[r.project][r.date] || 0) + (r.hoursWorked || 0);
            return acc;
        }, {} as { [activityId: string]: { [date: string]: number } });

        const qtyByDate = progressRecords.reduce((acc, r) => {
            if (!acc[r.activityId]) acc[r.activityId] = {};
            acc[r.activityId][r.date] = (acc[r.activityId][r.date] || 0) + r.qty;
            return acc;
        }, {} as { [activityId: string]: { [date: string]: number } });
        
        const allDates = new Set<string>();
        activities.forEach(act => {
             Object.keys(manHoursByDate[act.id] || {}).forEach(d => allDates.add(d));
             Object.keys(qtyByDate[act.id] || {}).forEach(d => allDates.add(d));
        });
        
        const sortedDates = Array.from(allDates).sort();
        
        const datasets: ChartDataset<'line', (number | null)[]>[] = activities.map((activity, index) => {
            const data = sortedDates.map(date => {
                const hours = manHoursByDate[activity.id]?.[date] || 0;
                const qty = qtyByDate[activity.id]?.[date] || 0;
                return hours > 0 && qty > 0 ? qty / hours : null;
            });
            
            const color = materialChartColors[index % materialChartColors.length];

            return {
                label: `${activity.name} (${activity.uom || 'Unit'} / Man-hour)`,
                data,
                borderColor: color,
                backgroundColor: `${color}33`, // Add alpha for fill
                fill: false,
                tension: 0.1,
                spanGaps: true,
            };
        });

        // Add norm lines if only one activity is selected
        if (activities.length === 1) {
            const activity = activities[0];
            if (showUniversalNorm && typeof activity.universalNorm === 'number') {
                datasets.push({
                    label: 'Universal Norm',
                    data: Array(sortedDates.length).fill(activity.universalNorm),
                    borderColor: '#E53E3E', // Red
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false,
                    tension: 0,
                    borderWidth: 2,
                });
            }
            if (showCompanyNorm && typeof activity.companyNorm === 'number') {
                datasets.push({
                    label: 'Company Norm',
                    data: Array(sortedDates.length).fill(activity.companyNorm),
                    borderColor: '#4299E1', // Blue
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false,
                    tension: 0,
                    borderWidth: 2,
                });
            }
        }

        return {
            labels: sortedDates,
            datasets: datasets,
        };

    }, [records, progressRecords, activities, showUniversalNorm, showCompanyNorm]);

    const chartOptions = useMemo(() => {
        const legendColor = theme === 'dark' ? '#cbd5e1' : '#475569';
        const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0';

        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom' as const,
                    labels: { color: legendColor }
                },
                title: {
                    display: true,
                    text: 'Productivity Trend per Activity',
                    color: legendColor,
                    font: { size: 16 },
                },
                tooltip: {
                    mode: 'index' as const,
                    intersect: false,
                }
            },
            scales: {
                x: {
                    ticks: { color: legendColor },
                    grid: { color: gridColor }
                },
                y: {
                    ticks: { color: legendColor },
                    grid: { color: gridColor },
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Unit / Man-hour',
                        color: legendColor,
                    }
                }
            }
        };
    }, [theme]);

    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm h-[60vh] flex flex-col">
            {activities.length === 1 && (
                <div className="flex justify-end items-center space-x-4 pb-2 -mt-2">
                    <label className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
                        <input type="checkbox" checked={showUniversalNorm} onChange={() => setShowUniversalNorm(s => !s)} className="rounded text-red-500 focus:ring-red-500 dark:bg-slate-600 dark:border-slate-500" />
                        <span>Universal Norm</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
                        <input type="checkbox" checked={showCompanyNorm} onChange={() => setShowCompanyNorm(s => !s)} className="rounded text-blue-500 focus:ring-blue-500 dark:bg-slate-600 dark:border-slate-500" />
                        <span>Company Norm</span>
                    </label>
                </div>
            )}
            <div className="flex-1 min-h-0">
                {productivityChartData ? (
                    <Line data={productivityChartData} options={chartOptions} />
                ) : (
                    <div className="flex items-center justify-center h-full text-center text-slate-500 dark:text-slate-400 p-4">
                        <div>
                            <h4 className="font-semibold text-lg">Productivity Trend</h4>
                            <p className="mt-2">Please select one or more projects that contain 'Activities' to view productivity metrics.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductivityDashboard;