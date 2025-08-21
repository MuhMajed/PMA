import React, { useState, useMemo, useEffect } from 'react';
import { ManpowerRecord, Project, Employee, Subcontractor, ProgressRecord, User } from './types';
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

// Your other imports/constants/functions unchanged...

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
  startDate.setDate(endDate.getDate() - 29);
  return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T'),
  };
};

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'manpower-records' | 'progress-record' | 'settings-employees' | 'settings-professions' | 'settings-projects' | 'settings-subcontractors' | 'settings-departments' | 'settings-users'>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      return 'dark';
    }
    return 'light';
  });

  // AUTH STATE
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // GLOBAL STATE
  const [records, setRecords] = useState<ManpowerRecord[]>([]);
  // Initialize other states as needed or leave empty and fetch them later...
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [professions, setProfessions] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [progressRecords, setProgressRecords] = useState<ProgressRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // UI STATE
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [manpowerSelectedProjects, setManpowerSelectedProjects] = useState<string[]>([]);
  const [manpowerDateRange, setManpowerDateRange] = useState(getInitialManpowerDateRange);

const fetchManpowerRecords = () => {
  fetch('http://35.238.214.132:5000/api/manpower-records')
    .then(res => res.json())
    .then(data => setRecords(data))
    .catch(console.error);
};

  
  // Apply theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Fetch manpower records on mount
  useEffect(() => {
    fetch('http://35.238.214.132:5000/api/manpower-records')
      .then(res => res.json())
      .then(data => setRecords(data))
      .catch(console.error);
  }, []);


  useEffect(() => {
  fetchManpowerRecords();
}, []);


  // FETCH other data similarly if you build API endpoints...

  // Derived filtered records (same as your original)
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

  // AUTH HANDLERS (same as yours, no backend shown)

  // CRUD Handlers with API integration

const handleAddRecord = async (newRecord) => {
  const recordToAdd = {
    ...newRecord,
    createdBy: currentUser?.name || 'System',
    modifiedDate: new Date().toISOString().split('T')[0],
    modifiedBy: currentUser?.name || 'System',
  };

  try {
    const response = await fetch('http://35.238.214.132:5000/api/manpower-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recordToAdd),
    });

    if (!response.ok) throw new Error('Failed to add record');

    // RELOAD all records after add to keep UI in sync
    fetchManpowerRecords();
  } catch (error) {
    console.error('Error adding record:', error);
  }
};


  const handleUpdateRecord = async (updatedRecord: ManpowerRecord) => {
    const recordWithAudit = {
      ...updatedRecord,
      modifiedBy: currentUser?.name || 'System',
      modifiedDate: new Date().toISOString().split('T')[0],
    };

    try {
      const response = await fetch(`http://35.238.214.132:5000/api/manpower-records/${recordWithAudit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordWithAudit),
      });

      if (!response.ok) {
        throw new Error('Failed to update record');
      }

      const savedRecord: ManpowerRecord = await response.json();
      setRecords(prev => prev.map(rec => rec.id === savedRecord.id ? savedRecord : rec));
      fetchManpowerRecords();

    } catch (error) {
      console.error('Error updating record:', error);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      const response = await fetch(`http://35.238.214.132:5000/api/manpower-records/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete record');
      }

      setRecords(prev => prev.filter(record => record.id !== id));
      fetchManpowerRecords();

    } catch (error) {
      console.error('Error deleting record:', error);
    }
  };

  // Keep your other CRUD handlers unchanged or enhance similarly...

  const renderPage = () => {
    if (!currentUser) return null;

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
                  currentUser={currentUser}
                />;
      // other cases...
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
              onLogin={() => {}} 
              onForgotPassword={() => {}} 
              onResetPassword={() => {}} 
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
        onLogout={() => setCurrentUser(null)}
      >
          {renderPage()}
      </Layout>
    </ConfirmationProvider>
  );
};

export default App;
