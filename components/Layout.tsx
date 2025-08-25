import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import { useStore } from '../store/appStore';


interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { currentPage, setCurrentPage, theme, setTheme, currentUser, logout } = useStore();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (!currentUser) {
      return null; // Or a loading spinner, or some other non-layout view
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#1e1e2d] text-slate-800 dark:text-slate-200 flex print:block print:min-h-0">
      <aside className="no-print">
        <Sidebar 
          isOpen={isSidebarOpen} 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage}
          currentUser={currentUser}
        />
      </aside>

      <div className="flex-1 flex flex-col transition-all duration-300 min-w-0 print:block">
        <header className="no-print">
            <Header 
                toggleSidebar={toggleSidebar}
                theme={theme}
                setTheme={setTheme}
                currentUser={currentUser}
                onLogout={logout}
            />
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto print:p-0 print:m-0 print:overflow-visible">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;