

import React, { useState, useMemo } from 'react';
import { ManpowerRecord, Project, Subcontractor, ProgressRecord, Employee, User } from '../types';
import { PROJECTS, INITIAL_RECORDS, PROFESSIONS, SUBCONTRACTORS, INITIAL_EMPLOYEES } from '../constants';
import ManpowerTable from './ManpowerTable';
import AddManpowerModal from './AddManpowerModal';
import BulkUploadExcelModal from './BulkUploadExcelModal';
import DashboardMetrics, { CrossFilters } from './DashboardMetrics';
import { PlusIcon } from './icons/PlusIcon';
import { UploadIcon } from './icons/UploadIcon';
import { Theme } from '../App';

const ProjectDashboard: React.FC = () => {
  const [records, setRecords] = useState<ManpowerRecord[]>(INITIAL_RECORDS);
  const [projects] = useState<Project[]>(PROJECTS);
  const [professions] = useState<string[]>(PROFESSIONS);
  const [subcontractors] = useState<Subcontractor[]>(SUBCONTRACTORS);
  const [employees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [progressRecords] = useState<ProgressRecord[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>(projects[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [recordToEdit, setRecordToEdit] = useState<ManpowerRecord | null>(null);
  const [crossFilters, setCrossFilters] = useState<CrossFilters>({ subcontractor: null, shift: null, type: null });
  const [theme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    return (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) ? 'dark' : 'light';
  });
  
  // This component seems to be a standalone page for testing/dev, it's not connected
  // to the main app's authentication flow. We'll create a dummy user to satisfy
  // ManpowerTable's prop requirement.
  const currentUser: User = {
    id: 'dev-user',
    name: 'Dev User',
    username: 'dev',
    empId: 'DEV001',
    email: 'dev@example.com',
    role: 'Admin',
  };


  const filteredRecords = useMemo(() => {
    return records.filter(record => record.project === selectedProject && record.date === selectedDate);
  }, [records, selectedProject, selectedDate]);

  // Stats Calculations
  const totalEmployees = useMemo(() => new Set(filteredRecords.map(r => r.empId)).size, [filteredRecords]);
  
  const todaysHeadcount = useMemo(() => {
      const today = new Date().toISOString().split('T')[0];
      return records.filter(r => 
          r.date === today && r.project === selectedProject
      ).length;
  }, [records, selectedProject]);

  const avgDailyManpower = useMemo(() => {
      const projectRecords = records.filter(r => r.project === selectedProject);
      if (projectRecords.length === 0) return 0;

      const uniqueDates = new Set(projectRecords.map(r => r.date));
      if (uniqueDates.size === 0) return 0;
      
      return projectRecords.length / uniqueDates.size;
  }, [records, selectedProject]);


  const handleModalClose = () => {
    setIsAddModalOpen(false);
    setRecordToEdit(null);
  };

  const handleAddRecord = (newRecord: Omit<ManpowerRecord, 'id'>) => {
    const recordToAdd: ManpowerRecord = {
      ...newRecord,
      id: `rec${Date.now()}`,
    };
    setRecords(prevRecords => [...prevRecords, recordToAdd]);
    handleModalClose();
  };

  const handleUpdateRecord = (updatedRecord: ManpowerRecord) => {
      setRecords(prevRecords => prevRecords.map(rec => rec.id === updatedRecord.id ? updatedRecord : rec));
      handleModalClose();
  };

  const handleEditClick = (record: ManpowerRecord) => {
    setRecordToEdit(record);
    setIsAddModalOpen(true);
  };

  const handleAddClick = () => {
    setRecordToEdit(null);
    setIsAddModalOpen(true);
  };
  
  const handleBulkUpload = (newRecords: Omit<ManpowerRecord, 'id' | 'project' | 'date'>[]) => {
      const recordsToAdd: ManpowerRecord[] = newRecords.map((rec, index) => ({
          ...rec,
          id: `rec-bulk-${Date.now()}-${index}`,
          project: selectedProject,
          date: selectedDate,
      }));
      setRecords(prevRecords => [...prevRecords, ...recordsToAdd]);
  };
  
  const handleDeleteRecord = (id: string) => {
    setRecords(prevRecords => prevRecords.filter(record => record.id !== id));
  };


  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <label htmlFor="project-select" className="block text-sm font-medium text-slate-700 mb-1">
              Project
            </label>
            <select
              id="project-select"
              className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-1">
            <label htmlFor="date-picker" className="block text-sm font-medium text-slate-700 mb-1">
              Date
            </label>
            <input
              type="date"
              id="date-picker"
              className="block w-full pl-3 pr-4 py-2 text-base border-slate-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <div className="md:col-span-2 lg:col-span-2 flex items-end space-x-3">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="w-full flex items-center justify-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
            >
              <UploadIcon className="h-5 w-5 mr-2" />
              Bulk Upload
            </button>
            <button
              onClick={handleAddClick}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Manpower
            </button>
          </div>
        </div>
      </div>

      <DashboardMetrics 
        records={filteredRecords} 
        subcontractors={subcontractors} 
        projects={projects}
        employees={employees}
        selectedProjects={[selectedProject]}
        theme={theme}
        totalEmployees={totalEmployees}
        todaysHeadcount={todaysHeadcount}
        avgDailyManpower={avgDailyManpower}
        crossFilters={crossFilters}
        setCrossFilters={setCrossFilters}
      />

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Daily Manpower Report</h2>
        <ManpowerTable records={filteredRecords} projects={projects} onDelete={handleDeleteRecord} onEdit={handleEditClick} currentUser={currentUser} />
      </div>

      {isAddModalOpen && (
        <AddManpowerModal
          onClose={handleModalClose}
          onAdd={handleAddRecord}
          onEdit={handleUpdateRecord}
          recordToEdit={recordToEdit}
          projects={projects}
          allRecords={records}
          employees={employees}
          subcontractors={subcontractors}
          defaultDate={selectedDate}
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

export default ProjectDashboard;