import React, { useEffect } from 'react';
import { useStore } from './store/appStore';
import { useProjectsForCurrentUser, useManpowerRecordsForCurrentUser, useProgressRecordsForCurrentUser } from './hooks/useData';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ManpowerRecords from './pages/ManpowerRecords';
import ProgressRecordPage from './pages/ProgressRecord';
import SettingsEmployees from './pages/SettingsEmployees';
import SettingsProjects from './pages/SettingsProjects';
import SettingsProfessions from './pages/SettingsProfessions';
import SettingsSubcontractors from './pages/SettingsSubcontractors';
import SettingsDepartments from './pages/SettingsDepartments';
import SettingsUsers from './pages/SettingsUsers';
import LoginPage from './pages/LoginPage';
import { MessageProvider } from './components/ConfirmationProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from './utils/api';
import { Chart as ChartJS } from 'chart.js';

// === MAIN APP COMPONENT ===

const App: React.FC = () => {
  const queryClient = useQueryClient();
  const { currentUser, theme, setTheme, currentPage, setCurrentPage, logout, setSharedFilters, isFilterInitialized, setIsFilterInitialized } = useStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Global handler for printing charts safely
  useEffect(() => {
    const originalLegendOnClick = ChartJS.defaults.plugins.legend.onClick;
    const originalOnClick = ChartJS.defaults.onClick;
    const originalOnHover = ChartJS.defaults.onHover;
    const originalAnimation = ChartJS.defaults.animation;
    const originalDatalabelsDisplay = ChartJS.defaults.plugins.datalabels?.display;

    const handleBeforePrint = () => {
        // Disable all interactions and animations
        ChartJS.defaults.plugins.legend.onClick = () => {};
        ChartJS.defaults.onClick = () => {};
        ChartJS.defaults.onHover = () => {};
        ChartJS.defaults.animation = false;
        // Show datalabels for printing
        if (ChartJS.defaults.plugins.datalabels) {
            ChartJS.defaults.plugins.datalabels.display = true;
        }
    };

    const handleAfterPrint = () => {
        // Restore original defaults
        ChartJS.defaults.plugins.legend.onClick = originalLegendOnClick;
        ChartJS.defaults.onClick = originalOnClick;
        ChartJS.defaults.onHover = originalOnHover;
        ChartJS.defaults.animation = originalAnimation;
        if (ChartJS.defaults.plugins.datalabels) {
            ChartJS.defaults.plugins.datalabels.display = originalDatalabelsDisplay;
        }
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
        window.removeEventListener('beforeprint', handleBeforePrint);
        window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  useEffect(() => {
    if (currentUser && currentPage.startsWith('settings-') && currentUser.role !== 'Admin') {
      setCurrentPage('dashboard');
    }
  }, [currentPage, currentUser, setCurrentPage]);

  // Data fetching for settings pages
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: api.fetchUsers });
  const { data: allEmployees = [] } = useQuery({ queryKey: ['employees'], queryFn: api.fetchEmployees });
  const { data: allSubcontractors = [] } = useQuery({ queryKey: ['subcontractors'], queryFn: api.fetchSubcontractors });
  const { data: allProfessions = [] } = useQuery({ queryKey: ['professions'], queryFn: api.fetchProfessions });
  const { data: allDepartments = [] } = useQuery({ queryKey: ['departments'], queryFn: api.fetchDepartments });
  const { data: allScopes = [] } = useQuery({ queryKey: ['scopes'], queryFn: api.fetchScopes });
  
  const { projects: allProjectsForUser } = useProjectsForCurrentUser();
  const { records: allManpowerRecordsForUser } = useManpowerRecordsForCurrentUser();
  const { progressRecords: allProgressRecordsForUser } = useProgressRecordsForCurrentUser();
  
  // Initialize shared project filter once projects are loaded
  useEffect(() => {
      if (allProjectsForUser.length > 0 && !isFilterInitialized) {
          setSharedFilters({
              selectedProjects: allProjectsForUser.filter(p => p.parentId === null).map(p => p.id)
          });
          setIsFilterInitialized(true);
      }
  }, [allProjectsForUser, isFilterInitialized, setSharedFilters, setIsFilterInitialized]);


  // Mutations
  const createMutation = <TData, TError, TVariables>(mutationFn: (vars: TVariables) => Promise<TData>, queryKey: string[]) => 
    useMutation({
        mutationFn,
        onSuccess: () => queryClient.invalidateQueries({ queryKey })
    });

  // Projects
  const addProjectMutation = createMutation(api.addProject, ['projects']);
  const updateProjectMutation = createMutation(api.updateProject, ['projects']);
  const deleteProjectMutation = createMutation(api.deleteProject, ['projects']);
  const setProjectsMutation = createMutation(api.setProjects, ['projects']);

  // Employees
  const addEmployeeMutation = createMutation(api.addEmployee, ['employees']);
  const updateEmployeeMutation = createMutation(api.updateEmployee, ['employees']);
  const deleteEmployeeMutation = createMutation(api.deleteEmployee, ['employees']);
  const setEmployeesMutation = createMutation(api.setEmployees, ['employees']);
  
  // Professions
  const addProfessionMutation = createMutation(api.addProfession, ['professions']);
  const updateProfessionMutation = createMutation(api.updateProfession, ['professions']);
  const deleteProfessionMutation = createMutation(api.deleteProfession, ['professions']);
  const setProfessionsMutation = createMutation(api.setProfessions, ['professions']);

  // Departments
  const addDepartmentMutation = createMutation(api.addDepartment, ['departments']);
  const updateDepartmentMutation = createMutation(api.updateDepartment, ['departments']);
  const deleteDepartmentMutation = createMutation(api.deleteDepartment, ['departments']);
  const setDepartmentsMutation = createMutation(api.setDepartments, ['departments']);

  // Subcontractors
  const addSubcontractorMutation = createMutation(api.addSubcontractor, ['subcontractors']);
  const updateSubcontractorMutation = createMutation(api.updateSubcontractor, ['subcontractors']);
  const deleteSubcontractorMutation = createMutation(api.deleteSubcontractor, ['subcontractors']);
  const setSubcontractorsMutation = createMutation(api.setSubcontractors, ['subcontractors']);

  // Users
  const addUserMutation = createMutation(api.addUser, ['users']);
  const updateUserMutation = createMutation(api.updateUser, ['users']);
  const deleteUserMutation = createMutation(api.deleteUser, ['users']);
  const adminResetPasswordMutation = createMutation(api.adminResetPassword, ['users']);
  
  // Manpower Records
  const addManpowerRecordMutation = createMutation(api.addManpowerRecord, ['manpowerRecords']);
  const updateManpowerRecordMutation = createMutation(api.updateManpowerRecord, ['manpowerRecords']);
  const deleteManpowerRecordMutation = createMutation(api.deleteManpowerRecord, ['manpowerRecords']);
  const bulkAddManpowerRecordsMutation = createMutation(api.bulkAddManpowerRecords, ['manpowerRecords']);

  // Progress Records
  const addProgressRecordMutation = createMutation(api.addProgressRecord, ['progressRecords']);
  const updateProgressRecordMutation = createMutation(api.updateProgressRecord, ['progressRecords']);
  const deleteProgressRecordMutation = createMutation(api.deleteProgressRecord, ['progressRecords']);

  
  const renderPage = () => {
    if (!currentUser) return <LoginPage />;

    if (currentPage.startsWith('settings-') && currentUser.role !== 'Admin') {
        // While useEffect handles state change, render dashboard immediately to prevent flicker.
        return <Dashboard />;
    }
    
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'manpower-records': return <ManpowerRecords 
        onAddRecord={addManpowerRecordMutation.mutate}
        onUpdateRecord={updateManpowerRecordMutation.mutate}
        onDeleteRecord={deleteManpowerRecordMutation.mutate}
        onBulkAddRecords={bulkAddManpowerRecordsMutation.mutate}
        currentUser={currentUser}
      />;
      case 'progress-record': return <ProgressRecordPage 
        projects={allProjectsForUser}
        progressRecords={allProgressRecordsForUser}
        onAddProgress={addProgressRecordMutation.mutate}
        onUpdateProgress={updateProgressRecordMutation.mutate}
        onDeleteProgress={deleteProgressRecordMutation.mutate}
        currentUser={currentUser}
      />;
      case 'settings-employees': return <SettingsEmployees 
        employees={allEmployees}
        professions={allProfessions}
        subcontractors={allSubcontractors}
        departments={allDepartments}
        onAdd={addEmployeeMutation.mutate}
        onUpdate={updateEmployeeMutation.mutate}
        onDelete={deleteEmployeeMutation.mutate}
        onSetEmployees={setEmployeesMutation.mutate}
        currentUser={currentUser}
      />;
      case 'settings-projects': return <SettingsProjects 
        projects={allProjectsForUser}
        records={allManpowerRecordsForUser}
        onAdd={addProjectMutation.mutate}
        onEdit={updateProjectMutation.mutate}
        onDelete={deleteProjectMutation.mutate}
        onSetProjects={setProjectsMutation.mutate}
        currentUser={currentUser}
      />;
      case 'settings-professions': return <SettingsProfessions 
        professions={allProfessions}
        records={allManpowerRecordsForUser}
        onAdd={addProfessionMutation.mutate}
        onEdit={(oldName, newName) => updateProfessionMutation.mutate({ oldName, newName })}
        onDelete={deleteProfessionMutation.mutate}
        onSetProfessions={setProfessionsMutation.mutate}
        currentUser={currentUser}
      />;
      case 'settings-departments': return <SettingsDepartments 
        departments={allDepartments}
        employees={allEmployees}
        onAdd={addDepartmentMutation.mutate}
        onEdit={(oldName, newName) => updateDepartmentMutation.mutate({ oldName, newName })}
        onDelete={deleteDepartmentMutation.mutate}
        onSetDepartments={setDepartmentsMutation.mutate}
        currentUser={currentUser}
      />;
      case 'settings-subcontractors': return <SettingsSubcontractors 
        subcontractors={allSubcontractors}
        records={allManpowerRecordsForUser}
        scopes={allScopes}
        onAdd={addSubcontractorMutation.mutate}
        onUpdate={updateSubcontractorMutation.mutate}
        onDelete={deleteSubcontractorMutation.mutate}
        onSetSubcontractors={setSubcontractorsMutation.mutate}
        currentUser={currentUser}
      />;
      case 'settings-users': return <SettingsUsers
        users={users}
        employees={allEmployees}
        projects={allProjectsForUser}
        onAdd={addUserMutation.mutate}
        onUpdate={updateUserMutation.mutate}
        onDelete={deleteUserMutation.mutate}
        onAdminResetPassword={(userId, newPassword) => adminResetPasswordMutation.mutate({ userId, newPassword })}
        currentUser={currentUser}
       />;
      default: return <Dashboard />;
    }
  };

  if (!currentUser) {
    return (
        <MessageProvider>
            <LoginPage />
        </MessageProvider>
    );
  }

  return (
    <MessageProvider>
      <Layout>
          {renderPage()}
      </Layout>
    </MessageProvider>
  );
};

export default App;