import * as db from '../data';
import { 
    Project, ManpowerRecord, Employee, Subcontractor, User, ProgressRecord, 
    Profession, Department 
} from '../types';

// This file simulates a remote API to demonstrate TanStack Query.
// A short delay is added to mimic network latency.

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const getDescendantIds = (projectId: string, projects: Project[]): string[] => {
  let descendants: string[] = [];
  const children = projects.filter(p => p.parentId === projectId);
  children.forEach(child => {
    descendants.push(child.id);
    descendants = [...descendants, ...getDescendantIds(child.id, projects)];
  });
  return descendants;
};

// ===================================
// READ OPERATIONS (Queries)
// ===================================

export const fetchProjects = async (): Promise<Project[]> => { await delay(200); return [...db.projects]; };
export const fetchManpowerRecords = async (): Promise<ManpowerRecord[]> => { await delay(200); return [...db.records]; };
export const fetchEmployees = async (): Promise<Employee[]> => { await delay(200); return [...db.employees]; };
export const fetchSubcontractors = async (): Promise<Subcontractor[]> => { await delay(200); return [...db.subcontractors]; };
export const fetchProfessions = async (): Promise<Profession[]> => { await delay(200); return [...db.professions]; };
export const fetchDepartments = async (): Promise<Department[]> => { await delay(200); return [...db.departments]; };
export const fetchProgressRecords = async (): Promise<ProgressRecord[]> => { await delay(200); return [...db.progressRecords]; };
export const fetchUsers = async (): Promise<User[]> => { await delay(200); return [...db.users]; };
export const fetchScopes = async (): Promise<string[]> => { await delay(200); return [...db.scopes]; };


// ===================================
// WRITE OPERATIONS (Mutations)
// ===================================

// --- Manpower Records ---
export const addManpowerRecord = async (record: Omit<ManpowerRecord, 'id'>): Promise<ManpowerRecord> => {
    await delay(300);
    const newRecord: ManpowerRecord = { ...record, id: `rec${Date.now()}` };
    db.records.push(newRecord);
    return newRecord;
};

export const updateManpowerRecord = async (record: ManpowerRecord): Promise<ManpowerRecord> => {
    await delay(300);
    const index = db.records.findIndex(r => r.id === record.id);
    if (index > -1) {
        db.records[index] = record;
    }
    return record;
};

export const deleteManpowerRecord = async (id: string): Promise<string> => {
    await delay(300);
    const index = db.records.findIndex(r => r.id === id);
    if (index > -1) {
        db.records.splice(index, 1);
    }
    return id;
};

export const bulkAddManpowerRecords = async (payload: { records: Omit<ManpowerRecord, 'id' | 'project' | 'date'>[], date: string, projectId: string }): Promise<ManpowerRecord[]> => {
    await delay(500);
    const { records, date, projectId } = payload;
    const recordsToAdd: ManpowerRecord[] = records.map((rec, index) => ({
      ...rec,
      id: `rec-bulk-${Date.now()}-${index}`,
      date: date,
      project: projectId,
    }));
    db.records.push(...recordsToAdd);
    return recordsToAdd;
};


// --- Employees ---
export const addEmployee = async (employee: Omit<Employee, 'id'>): Promise<Employee> => {
    await delay(300);
    const newEmployee = { ...employee, id: `emp${Date.now()}` };
    db.employees.push(newEmployee);
    return newEmployee;
};

export const updateEmployee = async (employee: Employee): Promise<Employee> => {
    await delay(300);
    const index = db.employees.findIndex(e => e.id === employee.id);
    if (index > -1) {
        db.employees[index] = employee;
    }
    return employee;
};

export const deleteEmployee = async (id: string): Promise<string> => {
    await delay(300);
    const index = db.employees.findIndex(e => e.id === id);
    if (index > -1) {
        db.employees.splice(index, 1);
    }
    return id;
};

export const setEmployees = async (newEmployees: Employee[]): Promise<Employee[]> => {
    await delay(300);
    db.employees.length = 0;
    db.employees.push(...newEmployees);
    return newEmployees;
};

// --- Projects ---
export const addProject = async (project: Omit<Project, 'id'>): Promise<Project> => {
    await delay(300);
    const newProject = { ...project, id: `proj${Date.now()}` };
    db.projects.push(newProject);
    return newProject;
};

export const updateProject = async (project: Project): Promise<Project> => {
    await delay(300);
    const index = db.projects.findIndex(p => p.id === project.id);
    if (index > -1) {
        db.projects[index] = project;
    }
    return project;
};

export const deleteProject = async (id: string): Promise<string> => {
    await delay(300);
    const idsToDelete = new Set([id, ...getDescendantIds(id, db.projects)]);
    const newProjects = db.projects.filter(p => !idsToDelete.has(p.id));
    db.projects.length = 0;
    db.projects.push(...newProjects);
    return id;
};

export const setProjects = async (newProjects: Project[]): Promise<Project[]> => {
    await delay(300);
    db.projects.length = 0;
    db.projects.push(...newProjects);
    return newProjects;
};

// --- Subcontractors ---
export const addSubcontractor = async (sub: Omit<Subcontractor, 'id'>): Promise<Subcontractor> => {
    await delay(300);
    const newSub = { ...sub, id: `sub${Date.now()}` };
    db.subcontractors.push(newSub);
    return newSub;
};

export const updateSubcontractor = async (sub: Subcontractor): Promise<Subcontractor> => {
    await delay(300);
    const index = db.subcontractors.findIndex(s => s.id === sub.id);
    if (index > -1) {
        db.subcontractors[index] = sub;
    }
    return sub;
};

export const deleteSubcontractor = async (id: string): Promise<string> => {
    await delay(300);
    const index = db.subcontractors.findIndex(s => s.id === id);
    if (index > -1) {
        db.subcontractors.splice(index, 1);
    }
    return id;
};

export const setSubcontractors = async (newSubs: Subcontractor[]): Promise<Subcontractor[]> => {
    await delay(300);
    db.subcontractors.length = 0;
    db.subcontractors.push(...newSubs);
    return newSubs;
};

// --- Professions ---
export const addProfession = async (name: string): Promise<string> => {
    await delay(300);
    db.professions.push(name);
    db.professions.sort();
    return name;
};

export const updateProfession = async ({ oldName, newName }: { oldName: string, newName: string }): Promise<string> => {
    await delay(300);
    const index = db.professions.findIndex(p => p === oldName);
    if (index > -1) {
        db.professions[index] = newName;
    }
    db.professions.sort();
    return newName;
};

export const deleteProfession = async (name: string): Promise<string> => {
    await delay(300);
    const index = db.professions.findIndex(p => p === name);
    if (index > -1) {
        db.professions.splice(index, 1);
    }
    return name;
};

export const setProfessions = async (newProfessions: string[]): Promise<string[]> => {
    await delay(300);
    db.professions.length = 0;
    db.professions.push(...newProfessions);
    return newProfessions;
};

// --- Departments ---
export const addDepartment = async (name: string): Promise<string> => {
    await delay(300);
    db.departments.push(name);
    db.departments.sort();
    return name;
};

export const updateDepartment = async ({ oldName, newName }: { oldName: string, newName: string }): Promise<string> => {
    await delay(300);
    const index = db.departments.findIndex(d => d === oldName);
    if (index > -1) {
        db.departments[index] = newName;
    }
    db.departments.sort();
    return newName;
};

export const deleteDepartment = async (name: string): Promise<string> => {
    await delay(300);
    const index = db.departments.findIndex(d => d === name);
    if (index > -1) {
        db.departments.splice(index, 1);
    }
    return name;
};

export const setDepartments = async (newDepartments: string[]): Promise<string[]> => {
    await delay(300);
    db.departments.length = 0;
    db.departments.push(...newDepartments);
    return newDepartments;
};

// --- Progress Records ---
export const addProgressRecord = async (record: Omit<ProgressRecord, 'id'>): Promise<ProgressRecord> => {
    await delay(300);
    const newRecord = { ...record, id: `prog${Date.now()}` };
    db.progressRecords.push(newRecord);
    return newRecord;
};

export const updateProgressRecord = async (record: ProgressRecord): Promise<ProgressRecord> => {
    await delay(300);
    const index = db.progressRecords.findIndex(r => r.id === record.id);
    if (index > -1) {
        db.progressRecords[index] = record;
    }
    return record;
};

export const deleteProgressRecord = async (id: string): Promise<string> => {
    await delay(300);
    const index = db.progressRecords.findIndex(r => r.id === id);
    if (index > -1) {
        db.progressRecords.splice(index, 1);
    }
    return id;
};

// --- Users ---
export const addUser = async (user: Omit<User, 'id'>): Promise<User> => {
    await delay(300);
    const newUser = { ...user, id: `user${Date.now()}` };
    db.users.push(newUser);
    return newUser;
};

export const updateUser = async (user: User): Promise<User> => {
    await delay(300);
    const index = db.users.findIndex(u => u.id === user.id);
    if (index > -1) {
        db.users[index] = { ...db.users[index], ...user };
    }
    return user;
};

export const deleteUser = async (id: string): Promise<string> => {
    await delay(300);
    const index = db.users.findIndex(u => u.id === id);
    if (index > -1) {
        db.users.splice(index, 1);
    }
    return id;
};

export const adminResetPassword = async ({ userId, newPassword }: { userId: string, newPassword: string }): Promise<boolean> => {
    await delay(300);
    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex > -1) {
        db.users[userIndex].password = newPassword;
        return true;
    }
    return false;
};

export const userResetPassword = async ({ emailOrEmpId, code, newPassword }: { emailOrEmpId: string, code: string, newPassword: string }): Promise<boolean> => {
    await delay(300);
    if (code !== '123456') return false;
    const searchTerm = emailOrEmpId.toLowerCase();
    const userIndex = db.users.findIndex(u => u.username.toLowerCase() === searchTerm || u.email.toLowerCase() === searchTerm || u.empId.toLowerCase() === searchTerm);
    if (userIndex > -1) {
        db.users[userIndex].password = newPassword;
        return true;
    }
    return false;
};

export const findUserForLogin = async ({ emailOrEmpId, password }: { emailOrEmpId: string, password: string }): Promise<User | null> => {
    await delay(300);
    const searchTerm = emailOrEmpId.toLowerCase();
    const user = db.users.find(u => 
        (u.username.toLowerCase() === searchTerm || u.email.toLowerCase() === searchTerm || u.empId.toLowerCase() === searchTerm) 
        && u.password === password
    );
    return user || null;
};

export const findUserForPasswordReset = async (emailOrEmpId: string): Promise<boolean> => {
    await delay(300);
    const searchTerm = emailOrEmpId.toLowerCase();
    return db.users.some(u => u.username.toLowerCase() === searchTerm || u.email.toLowerCase() === searchTerm || u.empId.toLowerCase() === searchTerm);
};