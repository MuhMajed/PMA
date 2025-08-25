import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  children?: React.ReactNode; // For buttons or other actions
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, children }) => {
  return (
    <div className="md:flex md:items-center md:justify-between pb-4 border-b border-slate-200 dark:border-slate-700 mb-6">
      <div className="flex-1 min-w-0 overflow-hidden">
        <h1 className="text-2xl font-bold leading-7 text-slate-900 dark:text-white sm:text-3xl sm:truncate">
          {title}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 truncate">{subtitle}</p>
      </div>
      {children && (
        <div className="mt-4 flex md:mt-0 md:ml-4 relative z-10">
          {children}
        </div>
      )}
    </div>
  );
};

export default PageHeader;