import React from 'react';
import { Page, User } from '../types';
import { useProjectsForCurrentUser } from '../hooks/useData';
import { DashboardIcon } from './icons/DashboardIcon';
import { ReportIcon } from './icons/ReportIcon';
import { GearIcon } from './icons/GearIcon';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { BuildingIcon } from './icons/BuildingIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { BuildingOfficeIcon } from './icons/BuildingOfficeIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { UserIcon } from './icons/UserIcon';
import { UsersIcon } from './icons/UsersIcon';
import { ArchiveBoxIcon } from './icons/ArchiveBoxIcon';
import { TruckIcon } from './icons/TruckIcon';
import { ShieldExclamationIcon } from './icons/ShieldExclamationIcon';
import { ClipboardDocumentListIcon } from './icons/ClipboardDocumentListIcon';


interface SidebarProps {
    isOpen: boolean;
    currentPage: Page;
    setCurrentPage: (page: Page) => void;
    currentUser: User;
}

const NavLink: React.FC<{
    page: Page;
    label: string;
    icon: React.ReactNode;
    isCurrent: boolean;
    onClick: (page: Page) => void;
    isSubLink?: boolean;
}> = ({ page, label, icon, isCurrent, onClick, isSubLink = false }) => (
    <li>
        <a
            href="#"
            onClick={(e) => { e.preventDefault(); onClick(page); }}
            className={`flex items-center p-2 text-base font-normal rounded-lg transition-colors duration-150
                ${isCurrent
                    ? 'bg-green-100 dark:bg-slate-700 text-[#28a745] dark:text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}
                ${isSubLink ? 'pl-11' : ''}
            `}
        >
            {icon}
            <span className="ml-3 flex-1 whitespace-nowrap">{label}</span>
        </a>
    </li>
);

const Sidebar: React.FC<SidebarProps> = ({ isOpen, currentPage, setCurrentPage, currentUser }) => {
    
    const { projects: visibleProjects } = useProjectsForCurrentUser();
    const canViewDashboards = currentUser.role === 'Admin' || currentUser.role === 'Project Manager' || currentUser.role === 'Safety';
    const canViewSettings = currentUser.role === 'Admin';
    const isAdmin = currentUser.role === 'Admin';
    
    const hasActivitiesInScope = visibleProjects.some(p => p.type === 'Activity');
    
    const showManpower = hasActivitiesInScope && currentUser.role !== 'Safety';
    const showProgress = hasActivitiesInScope && currentUser.role !== 'Safety';
    const showEquipment = hasActivitiesInScope && currentUser.role !== 'Safety';
    const showSafety = hasActivitiesInScope || currentUser.role === 'Safety';
    const showReportsSection = showManpower || showProgress || showEquipment || showSafety;
    
    return (
        <aside
            className={`z-40 flex-shrink-0 bg-white dark:bg-slate-800 shadow-lg transition-all duration-300 ease-in-out ${isOpen ? 'w-64' : 'w-0'} overflow-hidden`}
            aria-label="Sidebar"
        >
            <div className="h-full px-3 py-4 overflow-y-auto">
                 <div className="flex items-center pl-2.5 mb-5 h-16">
                    <img src="/logo.png" alt="PMA Logo" className="h-9 w-9 mr-3" />
                    <span className="self-center text-xl font-semibold whitespace-nowrap dark:text-white text-slate-800">
                        PMA
                    </span>
                 </div>
                <ul className="space-y-2">
                    {canViewDashboards && <NavLink page="dashboard" label="Dashboard" icon={<DashboardIcon className="w-6 h-6" />} isCurrent={currentPage === 'dashboard'} onClick={setCurrentPage} />}
                    
                    {showReportsSection && (
                        <>
                            <li>
                                <div className={`flex items-center p-2 text-base font-normal rounded-lg text-slate-500 dark:text-slate-400 mt-4`}>
                                    <ReportIcon className="w-6 h-6" />
                                    <span className="ml-3">Reports</span>
                                </div>
                            </li>
                            <ul className="space-y-2">
                                {showManpower && <NavLink page="manpower-records" label="Manpower Records" icon={<UserIcon className="w-5 h-5" />} isCurrent={currentPage === 'manpower-records'} onClick={setCurrentPage} isSubLink />}
                                {showProgress && <NavLink page="progress-record" label="Progress Record" icon={<ChartBarIcon className="w-5 h-5" />} isCurrent={currentPage === 'progress-record'} onClick={setCurrentPage} isSubLink />}
                                {showEquipment && <NavLink page="equipment-records" label="Equipment Records" icon={<TruckIcon className="w-5 h-5" />} isCurrent={currentPage === 'equipment-records'} onClick={setCurrentPage} isSubLink />}
                                {showSafety && <NavLink page="safety-violations" label="Safety Violations" icon={<ShieldExclamationIcon className="w-5 h-5" />} isCurrent={currentPage === 'safety-violations'} onClick={setCurrentPage} isSubLink />}
                            </ul>
                        </>
                    )}

                    {canViewSettings && (
                        <>
                            <li>
                                <div className={`flex items-center p-2 text-base font-normal rounded-lg text-slate-500 dark:text-slate-400 mt-4`}>
                                    <GearIcon className="w-6 h-6" />
                                    <span className="ml-3">Settings</span>
                                </div>
                            </li>
                            <ul className="space-y-2">
                                <NavLink page="settings-projects" label="Projects" icon={<BuildingIcon className="w-5 h-5" />} isCurrent={currentPage === 'settings-projects'} onClick={setCurrentPage} isSubLink />
                                <NavLink page="settings-activity-groups" label="Activity Groups" icon={<ClipboardDocumentListIcon className="w-5 h-5" />} isCurrent={currentPage === 'settings-activity-groups'} onClick={setCurrentPage} isSubLink />
                                <NavLink page="settings-employees" label="Employees" icon={<UserCircleIcon className="w-5 h-5" />} isCurrent={currentPage === 'settings-employees'} onClick={setCurrentPage} isSubLink />
                                <NavLink page="settings-subcontractors" label="Subcontractors" icon={<BuildingOfficeIcon className="w-5 h-5" />} isCurrent={currentPage === 'settings-subcontractors'} onClick={setCurrentPage} isSubLink />
                                <NavLink page="settings-equipment" label="Equipment" icon={<TruckIcon className="w-5 h-5" />} isCurrent={currentPage === 'settings-equipment'} onClick={setCurrentPage} isSubLink />
                                <NavLink page="settings-departments" label="Departments" icon={<ArchiveBoxIcon className="w-5 h-5" />} isCurrent={currentPage === 'settings-departments'} onClick={setCurrentPage} isSubLink />
                                <NavLink page="settings-professions" label="Professions" icon={<BriefcaseIcon className="w-5 h-5" />} isCurrent={currentPage === 'settings-professions'} onClick={setCurrentPage} isSubLink />
                                {isAdmin && <NavLink page="settings-users" label="Users" icon={<UsersIcon className="w-5 h-5" />} isCurrent={currentPage === 'settings-users'} onClick={setCurrentPage} isSubLink />}
                            </ul>
                        </>
                    )}
                </ul>
            </div>
        </aside>
    );
};

export default Sidebar;