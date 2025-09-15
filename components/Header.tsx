import React from 'react';
import { MenuIcon } from './icons/MenuIcon';
import ThemeToggle from './ThemeToggle';
import { Theme, User } from '../types';
import { PowerIcon } from './icons/PowerIcon';

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
            <img src="/logo.png" alt="PMA Logo" className="h-9 w-9 hidden sm:block" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">
              PMA
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
                <div className="font-medium text-slate-800 dark:text-white">{currentUser.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{currentUser.role}</div>
            </div>
            <ThemeToggle theme={theme} setTheme={setTheme} />
            <button onClick={onLogout} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700" title="Logout">
                <PowerIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;