import React from 'react';
import { MenuIcon } from './icons/MenuIcon';
import ThemeToggle from './ThemeToggle';
import { Theme } from '../App';
import { User } from '../types';
import { LogoutIcon } from './icons/LogoutIcon';

interface HeaderProps {
    toggleSidebar: () => void;
    theme: Theme;
    setTheme: (theme: Theme) => void;
    currentUser: User;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, theme, setTheme, currentUser, onLogout }) => {
  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-30">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
             <button onClick={toggleSidebar} className="p-1 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#28a745]">
                <MenuIcon className="h-6 w-6" />
                <span className="sr-only">Toggle Sidebar</span>
            </button>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#28a745] hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-1a6 6 0 00-5.197-5.975M15 21v-2a4 4 0 00-4-4H9.828a4 4 0 00-3.564 2.339l-.828 1.656A4 4 0 005.279 8.586H4a2 2 0 00-2 2v2a2 2 0 002 2h1.279a4 4 0 013.564 2.339l.828 1.656A4 4 0 009.828 17h5.172a4 4 0 004-4v-2a2 2 0 00-2-2h-1.279a4 4 0 01-3.564-2.339l-.828-1.656A4 4 0 009.828 7H9a4 4 0 00-4 4v1" />
            </svg>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">
              Productivity Monitoring
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
                <div className="font-medium text-slate-800 dark:text-white">{currentUser.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{currentUser.role}</div>
            </div>
            <ThemeToggle theme={theme} setTheme={setTheme} />
            <button onClick={onLogout} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700" title="Logout">
                <LogoutIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
