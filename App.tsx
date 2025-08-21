
import React, { useState, useMemo, useEffect } from 'react';
import mysql from 'mysql2';
import { ManpowerRecord, Project, Employee, Subcontractor, ProgressRecord, User, Profession, Department } from './types';
import { 
  PROJECTS, 
  INITIAL_RECORDS,
  PROFESSIONS as INITIAL_PROFESSIONS,
  SUBCONTRACTORS,
  INITIAL_EMPLOYEES,
  SCOPES as INITIAL_SCOPES,
  INITIAL_DEPARTMENTS,
  INITIAL_PROGRESS_RECORDS,
  INITIAL_USERS,
} from './constants';
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
import { ConfirmationProvider } from './components/ConfirmationProvider';


const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'muhmajed',
  password: process.env.DB_PASSWORD || 'muh11315',
  database: process.env.DB_NAME || 'mydb',
});

connection.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL!');
});


export type Page = 
  | 'dashboard' 
  | 'manpower-records' 
  | 'progress-record'
  | 'settings-employees'
  | 'settings-professions' 
  | 'settings-projects'
  | 'settings-subcontractors'
  | 'settings-departments'
  | 'settings-users';
  
export type Theme = 'light' | 'dark';

const getDescendantIds = (projectId: string, projects: Project[]): string[] => {
  let descendants: string[] = [];
  const children = projects.filter(p => p.parentId === projectId);
  children.forEach(child => {
    descendants.push(child.id);
    descendants = [...descendants, ...getDescendantIds(child.id, projects)];
  });
  return descendants;
};

const getInitialManpowerDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 29); // Last 30 days
    return {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
    };
};

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    return (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) ? 'dark' : 'light';
  });
  
  // === AUTH STATE ===
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // === GLOBAL STATE (using local data) ===
  const [records, setRecords] = useState<ManpowerRecord[]>(INITIAL_RECORDS);
  const [projects, setProjects] = useState<Project[]>(PROJECTS);
  const [professions, setProfessions] = useState<string[]>(INITIAL_PROFESSIONS);
  const [departments, setDepartments] = useState<string[]>(INITIAL_DEPARTMENTS);
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>(SUBCONTRACTORS);
  const [scopes, setScopes] = useState<string[]>(INITIAL_SCOPES);
  const [progressRecords, setProgressRecords] = useState<ProgressRecord[]>(INITIAL_PROGRESS_RECORDS);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);

  // === UI STATE ===
  const [selectedProjects, setSelectedProjects] = useState<string[]>(() => PROJECTS.filter(p => p.parentId === null).map(p => p.id));
  const [manpowerSelectedProjects, setManpowerSelectedProjects] = useState<string[]>(() => PROJECTS.filter(p => p.parentId === null).map(p => p.id));
  const [manpowerDateRange, setManpowerDateRange] = useState(getInitialManpowerDateRange);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

    // New useEffect to fetch manpower records on component mount
  useEffect(() => {
    fetch('http://<your-vm-ip>:5000/api/manpower-records')
      .then(response => response.json())
      .then(data => setManpowerRecords(data))
      .catch(console.error);
  }, []); // empty dependency array means this runs once on mount
  
  // === DERIVED STATE ===
  const filteredRecordsForManpower = useMemo(() => {
    if (!manpowerDateRange.start || !manpowerDateRange.end) return [];

    const projectIdsToFilter = new Set<string>();
    manpowerSelectedProjects.forEach(id => {
      projectIdsToFilter.add(id);
      getDescendantIds(id, projects).forEach(descId => projectIdsToFilter.add(descId));
    });

    const projectIdsArray = Array.from(projectIdsToFilter);
    if (projectIdsArray.length === 0) return [];
    
    return records.filter(record => 
      projectIdsArray.includes(record.project) && 
      record.date >= manpowerDateRange.start &&
      record.date <= manpowerDateRange.end
    );
  }, [records, manpowerSelectedProjects, manpowerDateRange, projects]);
  
  // === AUTH HANDLERS ===
  const handleLogin = (emailOrEmpId: string, password: string): boolean => {
    const searchTerm = emailOrEmpId.toLowerCase();
    const user = users.find(u => 
        (u.username.toLowerCase() === searchTerm || u.email.toLowerCase() === searchTerm || u.empId.toLowerCase() === searchTerm) 
        && u.password === password
    );
    if (user) {
        const { password, ...userToStore } = user;
        setCurrentUser(userToStore);
        if(user.role === 'Data Entry') {
            setCurrentPage('manpower-records');
        } else {
            setCurrentPage('dashboard');
        }
        return true;
    }
    return false;
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleForgotPasswordRequest = (emailOrEmpId: string): boolean => {
      const searchTerm = emailOrEmpId.toLowerCase();
      const user = users.find(u => u.email.toLowerCase() === searchTerm || u.empId.toLowerCase() === searchTerm);
      return !!user;
  };

  const handlePasswordResetWithCode = (emailOrEmpId: string, code: string, newPassword: string): boolean => {
      if (code !== '123456') return false;
      const searchTerm = emailOrEmpId.toLowerCase();
      const userIndex = users.findIndex(u => u.email.toLowerCase() === searchTerm || u.empId.toLowerCase() === searchTerm);
      
      if (userIndex !== -1) {
          setUsers(prev => {
              const newUsers = [...prev];
              newUsers[userIndex] = { ...newUsers[userIndex], password: newPassword };
              return newUsers;
          });
          return true;
      }
      return false;
  };

  // === LOCAL STATE CRUD HANDLERS ===
  
  // Manpower Records
  const handleAddRecord = (newRecord: Omit<ManpowerRecord, 'id'>) => {
    const recordToAdd: ManpowerRecord = { 
        ...newRecord, 
        id: `rec${Date.now()}`,
        createdBy: currentUser?.name || 'System',
        modifiedDate: new Date().toISOString().split('T')[0],
        modifiedBy: currentUser?.name || 'System',
    };
    setRecords(prev => [...prev, recordToAdd]);
  };
  
  const handleUpdateRecord = (updatedRecord: ManpowerRecord) => {
    const recordWithAudit = { 
        ...updatedRecord, 
        modifiedBy: currentUser?.name || 'System',
        modifiedDate: new Date().toISOString().split('T')[0],
    };
    setRecords(prev => prev.map(rec => rec.id === recordWithAudit.id ? recordWithAudit : rec));
  };
  
  const handleDeleteRecord = (id: string) => {
    setRecords(prev => prev.filter(record => record.id !== id));
  };

  // Employees
  const handleAddEmployee = (employee: Omit<Employee, 'id'>) => {
    const newEmployee: Employee = { 
        ...employee, 
        id: `emp${Date.now()}`,
        createdBy: currentUser?.name || 'System',
        modifiedDate: new Date().toISOString().split('T')[0],
        modifiedBy: currentUser?.name || 'System',
    };
    setEmployees(prev => [...prev, newEmployee]);
  };

  const handleUpdateEmployee = (updatedEmployee: Employee) => {
      const employeeWithAudit = { 
          ...updatedEmployee, 
          modifiedBy: currentUser?.name || 'System',
          modifiedDate: new Date().toISOString().split('T')[0],
      };
      setEmployees(prev => prev.map(e => e.id === employeeWithAudit.id ? employeeWithAudit : e));
  };

  const handleDeleteEmployee = (id: string) => {
      setEmployees(prev => prev.filter(e => e.id !== id));
  };
  
  // Projects
  const handleAddProject = (project: Omit<Project, 'id'>) => {
      const newProject: Project = { ...project, id: `proj${Date.now()}` };
      setProjects(prev => [...prev, newProject]);
  };

  const handleEditProject = (updatedProject: Project) => {
      setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
  };

  const handleDeleteProject = (id: string) => {
      const idsToDelete = [id, ...getDescendantIds(id, projects)];
      setProjects(prev => prev.filter(p => !idsToDelete.includes(p.id)));
  };
  
  // Subcontractors
  const handleAddSubcontractor = (sub: Omit<Subcontractor, 'id'>) => {
      const newSub: Subcontractor = { ...sub, id: `sub${Date.now()}` };
      setSubcontractors(prev => [...prev, newSub]);
  };
  const handleUpdateSubcontractor = (updatedSub: Subcontractor) => {
      setSubcontractors(prev => prev.map(s => s.id === updatedSub.id ? updatedSub : s));
  };
  const handleDeleteSubcontractor = (id: string) => {
      setSubcontractors(prev => prev.filter(s => s.id !== id));
  };

  // These "set" functions are for bulk import
  const handleSetEmployees = (newEmployees: Employee[]) => setEmployees(newEmployees);
  const handleSetProjects = (newProjects: Project[]) => setProjects(newProjects);
  const handleSetSubcontractors = (newSubs: Subcontractor[]) => setSubcontractors(newSubs);
  const handleSetProfessions = (newProfessions: string[]) => setProfessions(newProfessions);
  const handleSetDepartments = (newDepartments: string[]) => setDepartments(newDepartments);
  
  const handleBulkAddRecords = (newRecords: Omit<ManpowerRecord, 'id' | 'project' | 'date'>[], date: string, projectId: string) => {
    const recordsToAdd: ManpowerRecord[] = newRecords.map((rec, index) => ({
      ...rec,
      id: `rec-bulk-${Date.now()}-${index}`,
      date: date,
      project: projectId, 
      createdBy: currentUser?.name || 'System',
      modifiedDate: new Date().toISOString().split('T')[0],
      modifiedBy: currentUser?.name || 'System',
    }));
    setRecords(prev => [...prev, ...recordsToAdd]);
  };
  
  // Simple CRUD for professions/departments (assuming simple string arrays)
  const handleAddProfession = (name: string) => setProfessions(p => [...p, name].sort());
  const handleEditProfession = (oldName: string, newName: string) => setProfessions(p => p.map(prof => prof === oldName ? newName : prof).sort());
  const handleDeleteProfession = (name: string) => setProfessions(p => p.filter(prof => prof !== name));
  const handleAddDepartment = (name: string) => setDepartments(d => [...d, name].sort());
  const handleEditDepartment = (oldName: string, newName: string) => setDepartments(d => d.map(dept => dept === oldName ? newName : dept).sort());
  const handleDeleteDepartment = (name: string) => setDepartments(d => d.filter(dept => dept !== name));

  // Progress Records
  const handleAddProgressRecord = (record: Omit<ProgressRecord, 'id'>) => {
    const newRecord: ProgressRecord = { ...record, id: `prog${Date.now()}` };
    setProgressRecords(prev => [...prev, newRecord].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
  };

  const handleUpdateProgressRecord = (updatedRecord: ProgressRecord) => {
    setProgressRecords(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
  };

  const handleDeleteProgressRecord = (id: string) => {
    setProgressRecords(prev => prev.filter(r => r.id !== id));
  };

  // Users
  const handleAddUser = (user: Omit<User, 'id'>) => {
    const newUser: User = { ...user, id: `user${Date.now()}` };
    setUsers(prev => [...prev, newUser]);
  };
  const handleUpdateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u));
  };
  const handleDeleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };
  const handleAdminPasswordReset = (userId: string, newPassword: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, password: newPassword } : u));
  };

  const renderPage = () => {
    if (!currentUser) return null; // Should not happen if logic is correct
    
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard 
                  records={records} 
                  projects={projects} 
                  progressRecords={progressRecords}
                  subcontractors={subcontractors}
                  employees={employees}
                  selectedProjects={selectedProjects}
                  setSelectedProjects={setSelectedProjects}
                  theme={theme}
                  currentUser={currentUser}
                />;
      case 'manpower-records':
        return <ManpowerRecords
                  records={filteredRecordsForManpower} allRecords={records} employees={employees} projects={projects}
                  selectedProjects={manpowerSelectedProjects} setSelectedProjects={setManpowerSelectedProjects}
                  dateRange={manpowerDateRange} setDateRange={setManpowerDateRange}
                  onAddRecord={handleAddRecord} onUpdateRecord={handleUpdateRecord} onDeleteRecord={handleDeleteRecord}
                  onBulkAdd={handleBulkAddRecords} professions={professions} subcontractors={subcontractors}
                  currentUser={currentUser}
                />;
      case 'progress-record':
        return <ProgressRecordPage 
                    projects={projects}
                    progressRecords={progressRecords}
                    onAddProgress={handleAddProgressRecord}
                    onUpdateProgress={handleUpdateProgressRecord}
                    onDeleteProgress={handleDeleteProgressRecord}
                    currentUser={currentUser}
                />;
      case 'settings-employees':
          return <SettingsEmployees 
                    employees={employees} onAdd={handleAddEmployee} onUpdate={handleUpdateEmployee}
                    onDelete={handleDeleteEmployee} professions={professions} onSetEmployees={handleSetEmployees}
                    subcontractors={subcontractors} departments={departments}
                    currentUser={currentUser}
                   />;
      case 'settings-projects':
          return <SettingsProjects 
                    projects={projects} records={records} onAdd={handleAddProject}
                    onEdit={handleEditProject} onDelete={handleDeleteProject} onSetProjects={handleSetProjects}
                    currentUser={currentUser}
                  />;
      case 'settings-professions':
          return <SettingsProfessions 
                    professions={professions} records={records} onAdd={handleAddProfession}
                    onEdit={handleEditProfession} onDelete={handleDeleteProfession} onSetProfessions={handleSetProfessions}
                    currentUser={currentUser}
                  />;
      case 'settings-departments':
          return <SettingsDepartments
                    departments={departments} employees={employees} onAdd={handleAddDepartment}
                    onEdit={handleEditDepartment} onDelete={handleDeleteDepartment} onSetDepartments={handleSetDepartments}
                    currentUser={currentUser}
                  />;
      case 'settings-subcontractors':
          return <SettingsSubcontractors
                    subcontractors={subcontractors} records={records} onAdd={handleAddSubcontractor}
                    onUpdate={handleUpdateSubcontractor} onDelete={handleDeleteSubcontractor}
                    scopes={scopes} onSetSubcontractors={handleSetSubcontractors}
                    currentUser={currentUser}
                  />;
      case 'settings-users':
          return <SettingsUsers
                    users={users}
                    employees={employees}
                    onAdd={handleAddUser}
                    onUpdate={handleUpdateUser}
                    onDelete={handleDeleteUser}
                    onAdminResetPassword={handleAdminPasswordReset}
                    currentUser={currentUser}
                  />;
      default:
        return <Dashboard 
                  records={records} 
                  projects={projects} 
                  progressRecords={progressRecords}
                  subcontractors={subcontractors}
                  employees={employees}
                  selectedProjects={selectedProjects}
                  setSelectedProjects={setSelectedProjects}
                  theme={theme}
                  currentUser={currentUser}
                />;
    }
  };

  if (!currentUser) {
    return <LoginPage 
              onLogin={handleLogin} 
              onForgotPassword={handleForgotPasswordRequest}
              onResetPassword={handlePasswordResetWithCode}
            />;
  }

  return (
    <ConfirmationProvider>
      <Layout 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage}
        theme={theme}
        setTheme={setTheme}
        currentUser={currentUser}
        onLogout={handleLogout}
      >
          {renderPage()}
      </Layout>
    </ConfirmationProvider>
  );
};

export default App;
