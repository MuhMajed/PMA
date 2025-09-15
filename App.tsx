import React, { useEffect } from 'react';
import { useStore } from './store/appStore';
import { useProjectsForCurrentUser, useManpowerRecordsForCurrentUser, useProgressRecordsForCurrentUser, useEquipmentRecordsForCurrentUser, useSafetyViolationsForCurrentUser } from './hooks/useData';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ManpowerRecords from './pages/ManpowerRecords';
import ProgressRecordPage from './pages/ProgressRecord';
import EquipmentRecordsPage from './pages/EquipmentRecords';
import SafetyViolationsPage from './pages/SafetyViolations';
import SettingsEmployees from './pages/SettingsEmployees';
import SettingsProjects from './pages/SettingsProjects';
import SettingsProfessions from './pages/SettingsProfessions';
import SettingsSubcontractors from './pages/SettingsSubcontractors';
import SettingsDepartments from './pages/SettingsDepartments';
import SettingsUsers from './pages/SettingsUsers';
import SettingsEquipment from './pages/SettingsEquipment';
import SettingsActivityGroups from './pages/SettingsActivityGroups';
import LoginPage from './pages/LoginPage';
import { useMessage } from './components/ConfirmationProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from './utils/api';
import { Chart as ChartJS } from 'chart.js';

// === MAIN APP COMPONENT ===

const App: React.FC = () => {
  const queryClient = useQueryClient();
  const { currentUser, theme, setTheme, currentPage, setCurrentPage, logout, setSharedFilters, isFilterInitialized, setIsFilterInitialized } = useStore();
  const { showError } = useMessage();

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
    const originalLegendOnClick = ChartJS.defaults.plugins?.legend?.onClick;
    const originalOnClick = ChartJS.defaults.onClick;
    const originalOnHover = ChartJS.defaults.onHover;
    const originalAnimation = ChartJS.defaults.animation;
    // FIX: Cast plugins to any to access datalabels property which is not in the default Chart.js types.
    const originalDatalabelsDisplay = (ChartJS.defaults.plugins as any)?.datalabels?.display;

    const handleBeforePrint = () => {
        // Disable all interactions and animations
        if (ChartJS.defaults.plugins?.legend) {
            ChartJS.defaults.plugins.legend.onClick = () => {};
        }
        ChartJS.defaults.onClick = () => {};
        ChartJS.defaults.onHover = () => {};
        ChartJS.defaults.animation = false;
        // Show datalabels for printing
        // FIX: Cast plugins to any to access datalabels property which is not in the default Chart.js types.
        if ((ChartJS.defaults.plugins as any)?.datalabels) {
            // FIX: Cast plugins to any to access datalabels property which is not in the default Chart.js types.
            (ChartJS.defaults.plugins as any).datalabels.display = true;
        }
    };

    const handleAfterPrint = () => {
        // Restore original defaults
        if (ChartJS.defaults.plugins?.legend) {
            ChartJS.defaults.plugins.legend.onClick = originalLegendOnClick;
        }
        ChartJS.defaults.onClick = originalOnClick;
        ChartJS.defaults.onHover = originalOnHover;
        ChartJS.defaults.animation = originalAnimation;
        // FIX: Cast plugins to any to access datalabels property which is not in the default Chart.js types.
        if ((ChartJS.defaults.plugins as any)?.datalabels) {
            // FIX: Cast plugins to any to access datalabels property which is not in the default Chart.js types.
            (ChartJS.defaults.plugins as any).datalabels.display = originalDatalabelsDisplay;
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
  const { data: allEquipment = [] } = useQuery({ queryKey: ['equipment'], queryFn: api.fetchEquipment });
  const { data: allActivityGroups = [] } = useQuery({ queryKey: ['activityGroups'], queryFn: api.fetchActivityGroups });
  const { data: allActivityGroupMappings = [] } = useQuery({ queryKey: ['activityGroupMappings'], queryFn: api.fetchActivityGroupMappings });
  
  const { projects: allProjectsForUser } = useProjectsForCurrentUser();
  const { records: allManpowerRecordsForUser } = useManpowerRecordsForCurrentUser();
  const { progressRecords: allProgressRecordsForUser } = useProgressRecordsForCurrentUser();
  const { equipmentRecords: allEquipmentRecordsForUser } = useEquipmentRecordsForCurrentUser();
  const { violations: allSafetyViolationsForUser } = useSafetyViolationsForCurrentUser();
  
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
    useMutation<TData, TError, TVariables>({
        mutationFn,
        onSuccess: () => queryClient.invalidateQueries({ queryKey }),
        onError: (error: any) => {
          showError('Operation Failed', error.message || 'An unexpected error occurred.');
        },
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

  // Equipment
  const addEquipmentMutation = createMutation(api.addEquipment, ['equipment']);
  const updateEquipmentMutation = createMutation(api.updateEquipment, ['equipment']);
  const deleteEquipmentMutation = createMutation(api.deleteEquipment, ['equipment']);
  const setEquipmentMutation = createMutation(api.setEquipment, ['equipment']);

  // Equipment Records
  const addEquipmentRecordMutation = createMutation(api.addEquipmentRecord, ['equipmentRecords']);
  const updateEquipmentRecordMutation = createMutation(api.updateEquipmentRecord, ['equipmentRecords']);
  const deleteEquipmentRecordMutation = createMutation(api.deleteEquipmentRecord, ['equipmentRecords']);

  // Safety Violations
  const addSafetyViolationMutation = createMutation(api.addSafetyViolation, ['safetyViolations']);
  const updateSafetyViolationMutation = createMutation(api.updateSafetyViolation, ['safetyViolations']);
  const deleteSafetyViolationMutation = createMutation(api.deleteSafetyViolation, ['safetyViolations']);
  
  // Activity Groups
  const addActivityGroupMutation = createMutation(api.addActivityGroup, ['activityGroups']);
  const updateActivityGroupMutation = createMutation(api.updateActivityGroup, ['activityGroups']);
  const deleteActivityGroupMutation = createMutation(api.deleteActivityGroup, ['activityGroups', 'activityGroupMappings']);
  const setActivityGroupMappingsMutation = useMutation({
    mutationFn: ({ groupId, activityIds }: { groupId: string; activityIds: string[] }) => api.setActivityGroupMappings(groupId, activityIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activityGroupMappings'] })
  });

  
  const renderPage = () => {
    if (!currentUser) return <LoginPage />;

    if (currentPage.startsWith('settings-') && currentUser.role !== 'Admin') {
        // While useEffect handles state change, render dashboard immediately to prevent flicker.
        return <Dashboard />;
    }

    if (currentUser.role === 'Safety' && !['dashboard', 'safety-violations'].includes(currentPage)) {
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
// FIX: Pass activityGroups and activityGroupMappings to ProgressRecordPage.
      case 'progress-record': return <ProgressRecordPage 
        projects={allProjectsForUser}
        progressRecords={allProgressRecordsForUser}
        activityGroups={allActivityGroups}
        activityGroupMappings={allActivityGroupMappings}
        onAddProgress={addProgressRecordMutation.mutate}
        onUpdateProgress={updateProgressRecordMutation.mutate}
        onDeleteProgress={deleteProgressRecordMutation.mutate}
        currentUser={currentUser}
      />;
      case 'equipment-records': return <EquipmentRecordsPage
        equipment={allEquipment}
        equipmentRecords={allEquipmentRecordsForUser}
        projects={allProjectsForUser}
        employees={allEmployees}
        onAdd={addEquipmentRecordMutation.mutate}
        onUpdate={updateEquipmentRecordMutation.mutate}
        onDelete={deleteEquipmentRecordMutation.mutate}
        currentUser={currentUser}
      />;
      case 'safety-violations': return <SafetyViolationsPage
        violations={allSafetyViolationsForUser}
        projects={allProjectsForUser}
        employees={allEmployees}
        subcontractors={allSubcontractors}
        onAdd={addSafetyViolationMutation.mutate}
        onUpdate={updateSafetyViolationMutation.mutate}
        onDelete={deleteSafetyViolationMutation.mutate}
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
      case 'settings-equipment': return <SettingsEquipment
        equipment={allEquipment}
        equipmentRecords={allEquipmentRecordsForUser}
        employees={allEmployees}
        onAdd={addEquipmentMutation.mutate}
        onUpdate={updateEquipmentMutation.mutate}
        onDelete={deleteEquipmentMutation.mutate}
        onSetEquipment={setEquipmentMutation.mutate}
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
       case 'settings-activity-groups': return <SettingsActivityGroups 
        projects={allProjectsForUser}
        activityGroups={allActivityGroups}
        activityGroupMappings={allActivityGroupMappings}
        onAdd={addActivityGroupMutation.mutate}
        onUpdate={updateActivityGroupMutation.mutate}
        onDelete={deleteActivityGroupMutation.mutate}
        onSetMappings={(groupId, activityIds) => setActivityGroupMappingsMutation.mutate({ groupId, activityIds })}
        currentUser={currentUser}
      />;
      default: return <Dashboard />;
    }
  };

  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <Layout>
      {renderPage()}
    </Layout>
  );
};

export default App;