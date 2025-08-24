

import React, { useState, useMemo } from 'react';
import { ManpowerRecord, Project, User } from '../types';
import ManpowerTable from '../components/ManpowerTable';
import AddManpowerModal from '../components/AddManpowerModal';
import BulkUploadExcelModal from '../components/BulkUploadExcelModal';
import { PlusIcon } from '../components/icons/PlusIcon';
import { ImportIcon } from '../components/icons/ImportIcon';
import { ExportIcon } from '../components/icons/ExportIcon';
import PageHeader from '../components/ui/PageHeader';
import { exportToExcel } from '../utils/excel';
import { ProjectMultiSelectFilter } from '../components/ProjectMultiSelectFilter';
import { useManpowerRecordsForCurrentUser, useProjectsForCurrentUser } from '../hooks/useData';
import { useQuery } from '@tanstack/react-query';
import * as api from '../utils/api';
import { ChevronLeftIcon } from '../components/icons/ChevronLeftIcon';
import { ChevronRightIcon } from '../components/icons/ChevronRightIcon';

const getDescendantIds = (projectId: string, projects: Project[]): string[] => {
  let descendants: string[] = [];
  const children = projects.filter(p => p.parentId === projectId);
  children.forEach(child => {
    descendants.push(child.id);
    descendants = [...descendants, ...getDescendantIds(child.id, projects)];
  });
  return descendants;
};

const getInitialDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 29); // Last 30 days
    return {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
    };
};

interface ManpowerRecordsProps {
    onAddRecord: (record: Omit<ManpowerRecord, 'id'>) => void;
    onUpdateRecord: (record: ManpowerRecord) => void;
    onDeleteRecord: (id: string) => void;
    onBulkAddRecords: (payload: { records: Omit<ManpowerRecord, 'id' | 'project' | 'date'>[], date: string, projectId: string }) => void;
    currentUser: User;
}

const ITEMS_PER_PAGE = 15;

const ManpowerRecords: React.FC<ManpowerRecordsProps> = ({ onAddRecord, onUpdateRecord, onDeleteRecord, onBulkAddRecords, currentUser }) => {
  const { records: allRecords, isLoading: isLoadingRecords } = useManpowerRecordsForCurrentUser();
  const { projects: allProjects, isLoading: isLoadingProjects } = useProjectsForCurrentUser();
  
  const { data: employees = [] } = useQuery({ queryKey: ['employees'], queryFn: api.fetchEmployees });
  const { data: subcontractors = [] } = useQuery({ queryKey: ['subcontractors'], queryFn: api.fetchSubcontractors });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<ManpowerRecord | null>(null);
  
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState(getInitialDateRange);
  const [currentPage, setCurrentPage] = useState(1);
  
  const canAddAndBulkUpload = currentUser.role === 'Admin' || currentUser.role === 'Data Entry';
  
  React.useEffect(() => {
    if(allProjects.length > 0 && selectedProjects.length === 0) {
      setSelectedProjects(allProjects.filter(p => p.parentId === null).map(p => p.id));
    }
  }, [allProjects, selectedProjects.length]);

  const filteredRecords = useMemo(() => {
    if (!dateRange.start || !dateRange.end || !allRecords) return [];

    const projectIdsToFilter = new Set<string>();
    selectedProjects.forEach(id => {
      projectIdsToFilter.add(id);
      getDescendantIds(id, allProjects).forEach(descId => projectIdsToFilter.add(descId));
    });

    const projectIdsArray = Array.from(projectIdsToFilter);
    if (projectIdsArray.length === 0) return [];
    
    return allRecords.filter(record => 
      projectIdsArray.includes(record.project) && 
      record.date >= dateRange.start &&
      record.date <= dateRange.end
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || a.name.localeCompare(b.name));
  }, [allRecords, selectedProjects, dateRange, allProjects]);

  // Reset page to 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filteredRecords.length]);

  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRecords.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredRecords, currentPage]);

  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);

  const handleEditClick = (record: ManpowerRecord) => {
    setRecordToEdit(record);
    setIsAddModalOpen(true);
  };

  const handleAddClick = () => {
    setRecordToEdit(null);
    setIsAddModalOpen(true);
  };
  
  const handleModalClose = () => {
      setIsAddModalOpen(false);
      setRecordToEdit(null);
  };

  const handleBulkUpload = (records: Omit<ManpowerRecord, 'id' | 'project' | 'date'>[]) => {
      if (dateRange.start !== dateRange.end) {
          alert('Bulk import is only available when the date range is set to a single day. Please set the start and end date to be the same.');
          return;
      }

      const selectedIdSet = new Set(selectedProjects);
      const topLevelSelected = selectedProjects.filter(id => {
          const project = allProjects.find(p => p.id === id);
          return !project?.parentId || !selectedIdSet.has(project.parentId);
      });

      if (topLevelSelected.length !== 1) {
          alert("Please select a single top-level project in the filter to bulk upload records for it.");
          return;
      }
      const projectId = topLevelSelected[0];

      onBulkAddRecords({ records, date: dateRange.start, projectId });
      setIsUploadModalOpen(false);
  };
  
  const handleAddSubmit = (record: Omit<ManpowerRecord, 'id'>) => {
    onAddRecord(record);
    handleModalClose();
  };
  
  const handleUpdateSubmit = (record: ManpowerRecord) => {
    onUpdateRecord(record);
    handleModalClose();
  };

  const handleExport = () => {
    const selectedIdSet = new Set(selectedProjects);
    const topLevelSelectedNames = selectedProjects
      .filter(id => {
        const project = allProjects.find(p => p.id === id);
        return !project?.parentId || !selectedIdSet.has(project.parentId);
      })
      .map(id => allProjects.find(p => p.id === id)?.name)
      .filter(Boolean);

    const projectName = topLevelSelectedNames.length > 0 ? topLevelSelectedNames.join('_') : 'Export';
    exportToExcel(filteredRecords, `Manpower_Report_${projectName}_${dateRange.start}_to_${dateRange.end}`);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange({ ...dateRange, [name]: value });
  };

  const handleSetToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setDateRange({ start: today, end: today });
  };
  
  const today = new Date().toISOString().split('T')[0];
  const isLoading = isLoadingRecords || isLoadingProjects;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manpower Records"
        subtitle="Manage manpower for a specific project and date."
      >
        <div className="flex space-x-3">
          {canAddAndBulkUpload && (
            <button
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <ImportIcon className="h-5 w-5 mr-2" />
                Bulk Upload
            </button>
          )}
            <button
              onClick={handleExport}
              disabled={filteredRecords.length === 0}
              className="flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:bg-slate-50 disabled:cursor-not-allowed dark:disabled:bg-slate-700"
            >
              <ExportIcon className="h-5 w-5 mr-2" />
              Export
            </button>
          {canAddAndBulkUpload && (
            <button
              onClick={handleAddClick}
              className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#28a745] hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#28a745] disabled:bg-green-400 disabled:cursor-not-allowed"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Manpower
            </button>
          )}
        </div>
      </PageHeader>
      
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="project-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Project
            </label>
             <ProjectMultiSelectFilter
                projects={allProjects}
                selectedIds={selectedProjects}
                onSelectionChange={setSelectedProjects}
             />
          </div>
          <div>
            <label htmlFor="start-date-picker" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Start Date
            </label>
            <input
              type="date"
              id="start-date-picker"
              name="start"
              className="block w-full pl-3 pr-2 py-2 text-base border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-[#28a745] focus:border-[#28a745] sm:text-sm rounded-md"
              value={dateRange.start}
              onChange={handleDateChange}
              max={dateRange.end || today}
            />
          </div>
          <div>
            <label htmlFor="end-date-picker" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              End Date
            </label>
            <div className="flex">
              <input
                type="date"
                id="end-date-picker"
                name="end"
                className="block w-full pl-3 pr-2 py-2 text-base border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-[#28a745] focus:border-[#28a745] sm:text-sm rounded-l-md"
                value={dateRange.end}
                onChange={handleDateChange}
                min={dateRange.start}
                max={today}
              />
              <button
                type="button"
                onClick={handleSetToday}
                className="relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 focus:border-[#28a745] focus:outline-none focus:ring-1 focus:ring-[#28a745]"
              >
                Today
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-sm">
        {isLoading ? (
            <div className="text-center py-10">Loading records...</div>
        ) : (
            <>
                <ManpowerTable 
                    records={paginatedRecords} 
                    projects={allProjects} 
                    onEdit={handleEditClick} 
                    onDelete={onDeleteRecord}
                    currentUser={currentUser}
                />
                {totalPages > 0 && (
                    <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700 mt-4">
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                            Showing <span className="font-medium">{Math.min(filteredRecords.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)}</span> to <span className="font-medium">{Math.min(filteredRecords.length, currentPage * ITEMS_PER_PAGE)}</span> of <span className="font-medium">{filteredRecords.length}</span> results
                        </span>
                        <div className="flex items-center space-x-2">
                            <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="inline-flex items-center px-3 py-1 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                <ChevronLeftIcon className="h-5 w-5 mr-1" /> Previous
                            </button>
                            <span className="text-sm text-slate-700 dark:text-slate-300">Page {currentPage} of {totalPages}</span>
                            <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="inline-flex items-center px-3 py-1 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                Next <ChevronRightIcon className="h-5 w-5 ml-1" />
                            </button>
                        </div>
                    </div>
                )}
            </>
        )}
      </div>

      {isAddModalOpen && (
        <AddManpowerModal
          onClose={handleModalClose}
          onAdd={handleAddSubmit}
          onEdit={handleUpdateSubmit}
          recordToEdit={recordToEdit}
          projects={allProjects || []}
          allRecords={allRecords || []}
          employees={employees || []}
          subcontractors={subcontractors || []}
          defaultDate={dateRange.end}
        />
      )}
      
      {isUploadModalOpen && (
          <BulkUploadExcelModal
            onClose={() => setIsUploadModalOpen(false)}
            onUpload={handleBulkUpload}
          />
      )}
    </div>
  );
};

export default ManpowerRecords;