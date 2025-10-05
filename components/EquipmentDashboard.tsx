import React, { useMemo, useRef } from 'react';
import { Equipment, EquipmentRecord, EquipmentStatus, Theme } from '../types';
import { Pie, Bar, getElementAtEvent } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, Title, BarElement, ChartOptions } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { ClockIcon } from './icons/ClockIcon';
import { TruckIcon } from './icons/TruckIcon';
import { CrossFilters } from '../pages/Dashboard';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, Title, BarElement, ChartDataLabels);

interface EquipmentDashboardProps {
    equipmentRecords: EquipmentRecord[];
    equipment: Equipment[];
    theme: Theme;
    crossFilters: CrossFilters;
    setCrossFilters: React.Dispatch<React.SetStateAction<CrossFilters>>;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm flex items-center space-x-4">
        <div className="bg-blue-100 dark:bg-slate-700 text-blue-600 dark:text-blue-400 rounded-full p-3 flex-shrink-0">
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{title}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
        </div>
    </div>
);

const materialChartColors = {
    [EquipmentStatus.WORKING]: '#0F9D58', // Green
    [EquipmentStatus.IDLE]: '#F4B400',    // Yellow
    [EquipmentStatus.BREAKDOWN]: '#DB4437', // Red
};

const EquipmentDashboard: React.FC<EquipmentDashboardProps> = ({ equipmentRecords, equipment, theme, crossFilters, setCrossFilters }) => {
    const byDateRef = useRef<ChartJS<'bar'>>(null);
    const byStatusRef = useRef<ChartJS<'pie'>>(null);
    const byEquipmentRef = useRef<ChartJS<'bar'>>(null);

    const equipmentMap = useMemo(() => new Map(equipment.map(e => [e.id, e])), [equipment]);

    const totalHours = useMemo(() => 
        equipmentRecords.reduce((sum, r) => sum + (r.hoursWorked || 0), 0),
    [equipmentRecords]);

    const recordsByStatus = useMemo(() => {
        return equipmentRecords.reduce((acc, r) => {
            acc[r.status] = (acc[r.status] || 0) + 1;
            return acc;
        }, {} as Record<EquipmentStatus, number>);
    }, [equipmentRecords]);

    const hoursByEquipment = useMemo(() => {
        const hoursMap = equipmentRecords.reduce((acc, r) => {
            const eq = equipmentMap.get(r.equipmentId);
            if (eq) {
                acc[eq.id] = (acc[eq.id] || 0) + (r.hoursWorked || 0);
            }
            return acc;
        }, {} as Record<string, number>);
        // FIX: Cast sort callback parameters to 'number' to resolve arithmetic operation error on unknown types.
        return Object.entries(hoursMap).sort(([, a], [, b]) => (b as number) - (a as number));
    }, [equipmentRecords, equipmentMap]);

    const hoursByDate = useMemo(() => {
        return equipmentRecords.reduce((acc, r) => {
            acc[r.date] = (acc[r.date] || 0) + (r.hoursWorked || 0);
            return acc;
        }, {} as Record<string, number>);
    }, [equipmentRecords]);
    
    const sortedDates = useMemo(() => Object.keys(hoursByDate).sort(), [hoursByDate]);

    // Chart Data
    const byStatusData = {
        labels: Object.keys(recordsByStatus),
        datasets: [{ 
            data: Object.values(recordsByStatus), 
            backgroundColor: Object.keys(recordsByStatus).map(status => 
                !crossFilters.equipmentStatus || crossFilters.equipmentStatus === status ? materialChartColors[status as EquipmentStatus] : `${materialChartColors[status as EquipmentStatus]}55`
            )
        }],
    };

    const byEquipmentData = {
        labels: hoursByEquipment.map(([id]) => equipmentMap.get(id)?.name),
        datasets: [{ 
            label: 'Hours', 
            data: hoursByEquipment.map(([, hours]) => hours), 
            backgroundColor: hoursByEquipment.map(([id]) => 
                !crossFilters.equipmentId || crossFilters.equipmentId === id ? '#00ACC1' : '#00ACC155'
            )
        }],
    };

    const byDateData = {
        labels: sortedDates,
        datasets: [{ 
            label: 'Total Hours', 
            data: sortedDates.map(date => hoursByDate[date]), 
            backgroundColor: sortedDates.map(date => 
                !crossFilters.date || crossFilters.date === date ? '#5C6BC0' : '#5C6BC055'
            )
        }],
    };

    const legendColor = theme === 'dark' ? '#cbd5e1' : '#475569';
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0';

    const barChartOptions: ChartOptions<'bar'> = {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, title: { display: true, color: legendColor, font: { size: 16 } }, datalabels: { display: false } },
        scales: { x: { ticks: { color: legendColor }, grid: { color: gridColor } }, y: { ticks: { color: legendColor }, grid: { color: gridColor }, beginAtZero: true } },
    };
    
    const pieChartOptions: ChartOptions<'pie'> = {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { color: legendColor } }, title: { display: true, color: legendColor, font: { size: 16 } }, datalabels: { display: false } },
    };

    const handleChartClick = (event: React.MouseEvent<HTMLCanvasElement>, ref: React.RefObject<ChartJS<any>>, data: any, filterKey: keyof CrossFilters) => {
        if (!ref.current) return;
        const elements = getElementAtEvent(ref.current, event);
        if (elements.length > 0) {
            const label = data.labels?.[elements[0].index] as string;
            if (label) setCrossFilters(prev => ({ ...prev, [filterKey]: prev[filterKey] === label ? null : label }));
        } else {
             setCrossFilters(prev => ({ ...prev, [filterKey]: null }));
        }
    };
    
    const handleEquipmentClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
        if (!byEquipmentRef.current) return;
        const elements = getElementAtEvent(byEquipmentRef.current, event);
        if (elements.length > 0) {
            const equipmentId = hoursByEquipment[elements[0].index][0];
            if (equipmentId) setCrossFilters(prev => ({ ...prev, equipmentId: prev.equipmentId === equipmentId ? null : equipmentId }));
        } else {
            setCrossFilters(prev => ({ ...prev, equipmentId: null }));
        }
    };

    return (
        <div className="space-y-6">
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Hours Worked" value={totalHours.toFixed(1)} icon={<ClockIcon className="h-6 w-6" />} />
                <StatCard title="Fleet in Date Range" value={new Set(equipmentRecords.map(r => r.equipmentId)).size} icon={<TruckIcon className="h-6 w-6" />} />
            </div>

            {equipmentRecords.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 print:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm h-96 print-break-inside-avoid print-chart-container">
                        <Bar ref={byDateRef} data={byDateData} options={{ ...barChartOptions, plugins: { ...barChartOptions.plugins, title: { ...barChartOptions.plugins?.title, text: 'Hours Worked Over Time' } } }} onClick={(e) => handleChartClick(e, byDateRef, byDateData, 'date')}/>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm h-96 print-break-inside-avoid print-chart-container">
                        <Pie ref={byStatusRef} data={byStatusData} options={{ ...pieChartOptions, plugins: { ...pieChartOptions.plugins, title: { ...pieChartOptions.plugins?.title, text: 'Records by Status' } } }} onClick={(e) => handleChartClick(e, byStatusRef, byStatusData, 'equipmentStatus')} />
                    </div>
                     <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm h-96 lg:col-span-2 print-break-inside-avoid print-chart-container">
                        <Bar ref={byEquipmentRef} data={byEquipmentData} options={{ ...barChartOptions, plugins: { ...barChartOptions.plugins, title: { ...barChartOptions.plugins?.title, text: 'Hours by Equipment' } } }} onClick={handleEquipmentClick}/>
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm text-center">
                    <p className="text-slate-500 dark:text-slate-400">No equipment records found for the selected filters.</p>
                </div>
            )}
        </div>
    );
};

export default EquipmentDashboard;