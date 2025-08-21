import React from 'react';
import { Page } from '../App';
import { User } from '../types';
import { DashboardIcon } from './icons/DashboardIcon';
import { ReportIcon } from './icons/ReportIcon';
import { GearIcon } from './icons/GearIcon';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { BuildingIcon } from './icons/BuildingIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { BuildingOfficeIcon } from './icons/BuildingOfficeIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { UsersGroupIcon } from './icons/UsersGroupIcon';
import { UsersIcon } from './icons/UsersIcon';
import { TagIcon } from './icons/TagIcon';


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
    
    const canViewDashboards = currentUser.role === 'Admin' || currentUser.role === 'Project Manager';
    const canViewSettings = currentUser.role === 'Admin' || currentUser.role === 'Project Manager';
    const isAdmin = currentUser.role === 'Admin';
    
    return (
        <aside
            className={`z-40 flex-shrink-0 bg-white dark:bg-slate-800 shadow-lg transition-all duration-300 ease-in-out ${isOpen ? 'w-64' : 'w-0'} overflow-hidden`}
            aria-label="Sidebar"
        >
            <div className="h-full px-3 py-4 overflow-y-auto">
                 <div className="flex items-center pl-2.5 mb-5 h-16">
                    {/* Placeholder for Logo */}
                 </div>
                <ul className="space-y-2">
                    {canViewDashboards && <NavLink page="dashboard" label="Dashboard" icon={<DashboardIcon className="w-6 h-6" />} isCurrent={currentPage === 'dashboard'} onClick={setCurrentPage} />}
                    
                    <li>
                        <div className={`flex items-center p-2 text-base font-normal rounded-lg text-slate-500 dark:text-slate-400 mt-4`}>
                            <ReportIcon className="w-6 h-6" />
                            <span className="ml-3">Reports</span>
                        </div>
                    </li>
                     <ul className="space-y-2">
                        <NavLink page="manpower-records" label="Manpower Records" icon={<UsersGroupIcon className="w-5 h-5" />} isCurrent={currentPage === 'manpower-records'} onClick={setCurrentPage} isSubLink />
                        <NavLink page="progress-record" label="Progress Record" icon={<ChartBarIcon className="w-5 h-5" />} isCurrent={currentPage === 'progress-record'} onClick={setCurrentPage} isSubLink />
                    </ul>

                    {canViewSettings && (
                        <>
                            <li>
                                <div className={`flex items-center p-2 text-base font-normal rounded-lg text-slate-500 dark:text-slate-400 mt-4`}>
                                    <GearIcon className="w-6 h-6" />
                                    <span className="ml-3">Settings</span>
                                </div>
                            </li>
                            <ul className="space-y-2">
                                <NavLink page="settings-employees" label="Employees" icon={<UserCircleIcon className="w-5 h-5" />} isCurrent={currentPage === 'settings-employees'} onClick={setCurrentPage} isSubLink />
                                <NavLink page="settings-subcontractors" label="Subcontractors" icon={<BuildingOfficeIcon className="w-5 h-5" />} isCurrent={currentPage === 'settings-subcontractors'} onClick={setCurrentPage} isSubLink />
                                <NavLink page="settings-departments" label="Departments" icon={<TagIcon className="w-5 h-5" />} isCurrent={currentPage === 'settings-departments'} onClick={setCurrentPage} isSubLink />
                                <NavLink page="settings-professions" label="Professions" icon={<BriefcaseIcon className="w-5 h-5" />} isCurrent={currentPage === 'settings-professions'} onClick={setCurrentPage} isSubLink />
                                <NavLink page="settings-projects" label="Projects" icon={<BuildingIcon className="w-5 h-5" />} isCurrent={currentPage === 'settings-projects'} onClick={setCurrentPage} isSubLink />
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