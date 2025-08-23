

import React, { useState, useMemo } from 'react';
import { ManpowerRecord, Project, Subcontractor, Employee, User } from '../types';
import ManpowerTable from '../components/ManpowerTable';
import AddManpowerModal from '../components/AddManpowerModal';
import BulkUploadExcelModal from '../components/BulkUploadExcelModal';
import { PlusIcon } from '../components/icons/PlusIcon';
import { ImportIcon } from '../components/icons/ImportIcon';
import { ExportIcon } from '../components/icons/ExportIcon';
import PageHeader from '../components/ui/PageHeader';
import { exportToExcel } from '../utils/excel';
import { ProjectMultiSelectFilter } from '../components/ProjectMultiSelectFilter';

interface ManpowerRecordsProps {
  records: ManpowerRecord[];
  allRecords: ManpowerRecord[];
  employees: Employee[];
  projects: Project[]; // these are all projects
  selectedProjects: string[];
  setSelectedProjects: (ids: string[]) => void;
  dateRange: { start: string, end: string };
  setDateRange: (range: { start: string, end: string }) => void;
  onAddRecord: (record: Omit<ManpowerRecord, 'id'>) => void;
  onUpdateRecord: (record: ManpowerRecord) => void;
  onDeleteRecord: (id: string) => void;
  onBulkAdd: (records: Omit<ManpowerRecord, 'id' | 'project' | 'date'>[], date: string, projectId: string) => void;
  professions: string[];
  subcontractors: Subcontractor[];
  currentUser: User;
}

const ManpowerRecords: React.FC<ManpowerRecordsProps> = ({
  records, allRecords, employees, projects, selectedProjects, setSelectedProjects,
  dateRange, setDateRange, onAddRecord, onUpdateRecord,
  onDeleteRecord, onBulkAdd, professions, subcontractors, currentUser
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<ManpowerRecord | null>(null);

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
  
  const handleUpdate = (record: ManpowerRecord) => {
      onUpdateRecord(record);
      handleModalClose();
  };

  const handleAdd = (record: Omit<ManpowerRecord, 'id'>) => {
    onAddRecord(record);
    handleModalClose();
  };

  const handleBulkUpload = (newRecords: Omit<ManpowerRecord, 'id' | 'project' | 'date'>[]) => {
      if (dateRange.start !== dateRange.end) {
          alert('Bulk import is only available when the date range is set to a single day. Please set the start and end date to be the same.');
          return;
      }

      const selectedIdSet = new Set(selectedProjects);
      const topLevelSelected = selectedProjects.filter(id => {
          const project = projects.find(p => p.id === id);
          return !project?.parentId || !selectedIdSet.has(project.parentId);
      });

      if (topLevelSelected.length !== 1) {
          alert("Please select a single top-level project in the filter to bulk upload records for it.");
          return;
      }
      const projectId = topLevelSelected[0];

      onBulkAdd(newRecords, dateRange.start, projectId);
  };


  const handleExport = () => {
    const selectedIdSet = new Set(selectedProjects);
    const topLevelSelectedNames = selectedProjects
      .filter(id => {
        const project = projects.find(p => p.id === id);
        return !project?.parentId || !selectedIdSet.has(project.parentId);
      })
      .map(id => projects.find(p => p.id === id)?.name)
      .filter(Boolean);

    const projectName = topLevelSelectedNames.length > 0 ? topLevelSelectedNames.join('_') : 'Export';
    exportToExcel(records, `Manpower_Report_${projectName}_${dateRange.start}_to_${dateRange.end}`);
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manpower Records"
        subtitle="Manage manpower for a specific project and date."
      >
        <div className="flex space-x-3">
          <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <ImportIcon className="h-5 w-5 mr-2" />
              Bulk Upload
            </button>
            <button
              onClick={handleExport}
              disabled={records.length === 0}
              className="flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:bg-slate-50 disabled:cursor-not-allowed dark:disabled:bg-slate-700"
            >
              <ExportIcon className="h-5 w-5 mr-2" />
              Export
            </button>
          <button
            onClick={handleAddClick}
            className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#28a745] hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#28a745] disabled:bg-green-400 disabled:cursor-not-allowed"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Manpower
          </button>
        </div>
      </PageHeader>
      
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="project-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Project
            </label>
             <ProjectMultiSelectFilter
                projects={projects}
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
        <ManpowerTable records={records} projects={projects} onDelete={onDeleteRecord} onEdit={handleEditClick} currentUser={currentUser} />
      </div>

      {isAddModalOpen && (
        <AddManpowerModal
          onClose={handleModalClose}
          onAdd={handleAdd}
          onEdit={handleUpdate}
          recordToEdit={recordToEdit}
          projects={projects}
          allRecords={allRecords}
          employees={employees}
          defaultDate={dateRange.end}
          subcontractors={subcontractors}
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