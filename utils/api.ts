import {
    Project, ManpowerRecord, Employee, Subcontractor, User, ProgressRecord,
    Profession, Department, Equipment, EquipmentRecord, SafetyViolation, ActivityGroup, ActivityGroupMapping
} from '../types';
import { db } from '../data';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

// ===================================
// READ OPERATIONS (Queries)
// ===================================

export const fetchProjects = async (): Promise<Project[]> => { await delay(100); return [...db.projects]; };
export const fetchManpowerRecords = async (): Promise<ManpowerRecord[]> => { await delay(100); return [...db.manpowerRecords]; };
export const fetchEmployees = async (): Promise<Employee[]> => { await delay(100); return [...db.employees]; };
export const fetchSubcontractors = async (): Promise<Subcontractor[]> => { await delay(100); return [...db.subcontractors]; };
export const fetchProfessions = async (): Promise<Profession[]> => { await delay(100); return [...db.professions]; };
export const fetchDepartments = async (): Promise<Department[]> => { await delay(100); return [...db.departments]; };
export const fetchProgressRecords = async (): Promise<ProgressRecord[]> => { await delay(100); return [...db.progressRecords]; };
export const fetchUsers = async (): Promise<User[]> => { await delay(100); return [...db.users]; };
export const fetchScopes = async (): Promise<string[]> => { await delay(100); return [...db.scopes]; };
export const fetchEquipment = async (): Promise<Equipment[]> => { await delay(100); return [...db.equipment]; };
export const fetchEquipmentRecords = async (): Promise<EquipmentRecord[]> => { await delay(100); return [...db.equipmentRecords]; };
export const fetchSafetyViolations = async (): Promise<SafetyViolation[]> => { await delay(100); return [...db.safetyViolations]; };
export const fetchActivityGroups = async (): Promise<ActivityGroup[]> => { await delay(100); return [...db.activityGroups]; };
export const fetchActivityGroupMappings = async (): Promise<ActivityGroupMapping[]> => { await delay(100); return [...db.activityGroupMappings]; };


// ===================================
// WRITE OPERATIONS (Mutations)
// ===================================

// --- Manpower Records ---
export const addManpowerRecord = async (record: Omit<ManpowerRecord, 'id'>): Promise<ManpowerRecord> => {
    await delay(200);
    const newRecord: ManpowerRecord = { ...record, id: generateId('mr') };
    db.manpowerRecords.push(newRecord);
    return newRecord;
};
export const updateManpowerRecord = async (record: ManpowerRecord): Promise<ManpowerRecord> => {
    await delay(200);
    const index = db.manpowerRecords.findIndex(r => r.id === record.id);
    if (index !== -1) db.manpowerRecords[index] = record;
    return record;
};
export const deleteManpowerRecord = async (id: string): Promise<string> => {
    await delay(200);
    db.manpowerRecords = db.manpowerRecords.filter(r => r.id !== id);
    return id;
};
export const bulkAddManpowerRecords = async (payload: { records: Omit<ManpowerRecord, 'id' | 'project' | 'date'>[], date: string, projectId: string }): Promise<ManpowerRecord[]> => {
    await delay(500);
    // This is a simplified logic for mock; a real one would find appropriate activities.
    // For now, we'll assign to the first available activity in the selected project tree.
    const getDescendants = (pId: string): string[] => {
        let ids = [pId];
        const children = db.projects.filter(p => p.parentId === pId);
        children.forEach(child => ids = [...ids, ...getDescendants(child.id)]);
        return ids;
    };
    const allProjectBranchIds = getDescendants(payload.projectId);
    const firstActivity = db.projects.find(p => allProjectBranchIds.includes(p.id) && p.type === 'Activity');
    
    if (!firstActivity) {
        console.error("Bulk upload failed: No activity found under selected project to assign records to.");
        return [];
    }

    const newRecords = payload.records.map(r => ({
        ...r,
        id: generateId('mr'),
        date: payload.date,
        project: firstActivity.id // Assign to the first found activity
    }));
    db.manpowerRecords.push(...newRecords);
    return newRecords;
};

// --- Employees ---
export const addEmployee = async (employee: Omit<Employee, 'id'>): Promise<Employee> => {
    await delay(200);
    const newEmployee: Employee = { ...employee, id: generateId('emp') };
    db.employees.push(newEmployee);
    return newEmployee;
};
export const updateEmployee = async (employee: Employee): Promise<Employee> => {
    await delay(200);
    const index = db.employees.findIndex(e => e.id === employee.id);
    if (index !== -1) db.employees[index] = employee;
    return employee;
};
export const deleteEmployee = async (id: string): Promise<string> => {
    await delay(200);
    db.employees = db.employees.filter(e => e.id !== id);
    return id;
};
export const setEmployees = async (newEmployees: Employee[]): Promise<Employee[]> => {
    await delay(200);
    db.employees = newEmployees;
    return [...db.employees];
};

// --- Projects ---
export const addProject = async (project: Omit<Project, 'id'>): Promise<Project> => {
    await delay(200);
    const newProject: Project = { ...project, id: generateId('proj') };
    db.projects.push(newProject);
    return newProject;
};
export const updateProject = async (project: Project): Promise<Project> => {
    await delay(200);
    const index = db.projects.findIndex(p => p.id === project.id);
    if (index !== -1) db.projects[index] = project;
    return project;
};
export const deleteProject = async (id: string): Promise<string> => {
    await delay(200);
    const getDescendants = (projectId: string): string[] => {
        let ids: string[] = [projectId];
        const children = db.projects.filter(p => p.parentId === projectId);
        children.forEach(child => ids = [...ids, ...getDescendants(child.id)]);
        return ids;
    };
    const idsToDelete = new Set(getDescendants(id));
    db.projects = db.projects.filter(p => !idsToDelete.has(p.id));
    return id;
};
export const setProjects = async (newProjects: Project[]): Promise<Project[]> => {
    await delay(200);
    db.projects = newProjects;
    return [...db.projects];
};

// --- Subcontractors ---
export const addSubcontractor = async (sub: Omit<Subcontractor, 'id'>): Promise<Subcontractor> => {
    await delay(200);
    const newSub: Subcontractor = { ...sub, id: generateId('sub') };
    db.subcontractors.push(newSub);
    return newSub;
};
export const updateSubcontractor = async (sub: Subcontractor): Promise<Subcontractor> => {
    await delay(200);
    const index = db.subcontractors.findIndex(s => s.id === sub.id);
    if (index !== -1) db.subcontractors[index] = sub;
    return sub;
};
export const deleteSubcontractor = async (id: string): Promise<string> => {
    await delay(200);
    db.subcontractors = db.subcontractors.filter(s => s.id !== id);
    return id;
};
export const setSubcontractors = async (newSubs: Subcontractor[]): Promise<Subcontractor[]> => {
    await delay(200);
    db.subcontractors = newSubs;
    return [...db.subcontractors];
};

// --- Professions ---
export const addProfession = async (name: string): Promise<string> => {
    await delay(200);
    if (!db.professions.includes(name)) db.professions.push(name);
    return name;
};
export const updateProfession = async ({ oldName, newName }: { oldName: string, newName: string }): Promise<{ oldName: string, newName: string }> => {
    await delay(200);
    const index = db.professions.indexOf(oldName);
    if (index !== -1) db.professions[index] = newName;
    db.employees.forEach(e => { if (e.profession === oldName) e.profession = newName; });
    db.manpowerRecords.forEach(r => { if (r.profession === oldName) r.profession = newName; });
    return { oldName, newName };
};
export const deleteProfession = async (name: string): Promise<string> => {
    await delay(200);
    db.professions = db.professions.filter(p => p !== name);
    return name;
};
export const setProfessions = async (newProfessions: string[]): Promise<string[]> => {
    await delay(200);
    db.professions = newProfessions;
    return [...db.professions];
};

// --- Departments ---
export const addDepartment = async (name: string): Promise<string> => {
    await delay(200);
    if (!db.departments.includes(name)) db.departments.push(name);
    return name;
};
export const updateDepartment = async ({ oldName, newName }: { oldName: string, newName: string }): Promise<{ oldName: string, newName: string }> => {
    await delay(200);
    const index = db.departments.indexOf(oldName);
    if (index !== -1) db.departments[index] = newName;
    db.employees.forEach(e => { if (e.department === oldName) e.department = newName; });
    return { oldName, newName };
};
export const deleteDepartment = async (name: string): Promise<string> => {
    await delay(200);
    db.departments = db.departments.filter(d => d !== name);
    return name;
};
export const setDepartments = async (newDepartments: string[]): Promise<string[]> => {
    await delay(200);
    db.departments = newDepartments;
    return [...db.departments];
};

// --- Progress Records ---
export const addProgressRecord = async (record: Omit<ProgressRecord, 'id'>): Promise<ProgressRecord> => {
    await delay(200);
    const existing = db.progressRecords.find(
        r => r.activityId === record.activityId && r.date === record.date && r.shift === record.shift
    );
    if (existing) {
        throw new Error(`A progress record for this activity, date, and shift already exists.`);
    }
    const newRecord: ProgressRecord = { ...record, id: generateId('pr') };
    db.progressRecords.push(newRecord);
    return newRecord;
};
export const updateProgressRecord = async (record: ProgressRecord): Promise<ProgressRecord> => {
    await delay(200);
    const existing = db.progressRecords.find(
        r => r.activityId === record.activityId && r.date === record.date && r.shift === record.shift && r.id !== record.id
    );
    if (existing) {
        throw new Error(`Updating this record would create a duplicate for this activity, date, and shift.`);
    }
    const index = db.progressRecords.findIndex(r => r.id === record.id);
    if (index !== -1) db.progressRecords[index] = record;
    return record;
};
export const deleteProgressRecord = async (id: string): Promise<string> => {
    await delay(200);
    db.progressRecords = db.progressRecords.filter(r => r.id !== id);
    return id;
};

// --- Users ---
export const addUser = async (user: Omit<User, 'id'>): Promise<User> => {
    await delay(200);
    const newUser: User = { ...user, id: generateId('user') };
    db.users.push(newUser);
    const { password, ...userToReturn } = newUser;
    return userToReturn;
};
export const updateUser = async (user: User): Promise<User> => {
    await delay(200);
    const index = db.users.findIndex(u => u.id === user.id);
    if (index !== -1) {
        // If password is blank, keep the old one
        const newPassword = user.password || db.users[index].password;
        db.users[index] = { ...user, password: newPassword };
    }
    const { password, ...userToReturn } = db.users[index];
    return userToReturn;
};
export const deleteUser = async (id: string): Promise<string> => {
    await delay(200);
    db.users = db.users.filter(u => u.id !== id);
    return id;
};

// --- Equipment ---
export const addEquipment = async (item: Omit<Equipment, 'id'>): Promise<Equipment> => {
    await delay(200);
    const newItem: Equipment = { ...item, id: generateId('eq') };
    db.equipment.push(newItem);
    return newItem;
};
export const updateEquipment = async (item: Equipment): Promise<Equipment> => {
    await delay(200);
    const index = db.equipment.findIndex(eq => eq.id === item.id);
    if (index !== -1) db.equipment[index] = item;
    return item;
};
export const deleteEquipment = async (id: string): Promise<string> => {
    await delay(200);
    db.equipment = db.equipment.filter(eq => eq.id !== id);
    return id;
};
export const setEquipment = async (newItems: Equipment[]): Promise<Equipment[]> => {
    await delay(200);
    db.equipment = newItems;
    return [...db.equipment];
};

// --- Equipment Records ---
export const addEquipmentRecord = async (record: Omit<EquipmentRecord, 'id'>): Promise<EquipmentRecord> => {
    await delay(200);
    const newRecord: EquipmentRecord = { ...record, id: generateId('er') };
    db.equipmentRecords.push(newRecord);
    return newRecord;
};
export const updateEquipmentRecord = async (record: EquipmentRecord): Promise<EquipmentRecord> => {
    await delay(200);
    const index = db.equipmentRecords.findIndex(r => r.id === record.id);
    if (index !== -1) db.equipmentRecords[index] = record;
    return record;
};
export const deleteEquipmentRecord = async (id: string): Promise<string> => {
    await delay(200);
    db.equipmentRecords = db.equipmentRecords.filter(r => r.id !== id);
    return id;
};

// --- Safety Violations ---
export const addSafetyViolation = async (violation: Omit<SafetyViolation, 'id'>): Promise<SafetyViolation> => {
    await delay(200);
    const newViolation: SafetyViolation = { ...violation, id: generateId('sv') };
    db.safetyViolations.push(newViolation);
    return newViolation;
};
export const updateSafetyViolation = async (violation: SafetyViolation): Promise<SafetyViolation> => {
    await delay(200);
    const index = db.safetyViolations.findIndex(v => v.id === violation.id);
    if (index !== -1) db.safetyViolations[index] = violation;
    return violation;
};
export const deleteSafetyViolation = async (id: string): Promise<string> => {
    await delay(200);
    db.safetyViolations = db.safetyViolations.filter(v => v.id !== id);
    return id;
};

// --- Activity Groups ---
export const addActivityGroup = async (group: Omit<ActivityGroup, 'id'>): Promise<ActivityGroup> => {
    await delay(200);
    const newGroup: ActivityGroup = { ...group, id: generateId('group') };
    db.activityGroups.push(newGroup);
    return newGroup;
};
export const updateActivityGroup = async (group: ActivityGroup): Promise<ActivityGroup> => {
    await delay(200);
    const index = db.activityGroups.findIndex(g => g.id === group.id);
    if (index !== -1) db.activityGroups[index] = group;
    return group;
};
export const deleteActivityGroup = async (id: string): Promise<string> => {
    await delay(200);
    db.activityGroups = db.activityGroups.filter(g => g.id !== id);
    // Also remove any mappings
    db.activityGroupMappings = db.activityGroupMappings.filter(m => m.activityGroupId !== id);
    return id;
};

// --- Activity Group Mappings ---
export const setActivityGroupMappings = async (groupId: string, activityIds: string[]): Promise<ActivityGroupMapping[]> => {
    await delay(200);
    // Remove existing mappings for this group
    db.activityGroupMappings = db.activityGroupMappings.filter(m => m.activityGroupId !== groupId);
    // Add new mappings
    const newMappings = activityIds.map(activityId => ({ activityGroupId: groupId, activityId }));
    db.activityGroupMappings.push(...newMappings);
    return newMappings;
};


// --- Authentication ---
export const findUserForLogin = async ({ emailOrEmpId, password }: { emailOrEmpId: string, password: string }): Promise<User | null> => {
    await delay(500); // Simulate network latency
    const searchTerm = emailOrEmpId.toLowerCase();
    const user = db.users.find(u =>
        (u.username.toLowerCase() === searchTerm || u.email.toLowerCase() === searchTerm || u.empId.toLowerCase() === searchTerm) &&
        u.password === password
    );
    return user ? { ...user } : null;
};

export const findUserForPasswordReset = async (emailOrEmpId: string): Promise<boolean> => {
    await delay(500);
    const searchTerm = emailOrEmpId.toLowerCase();
    const user = db.users.find(u => u.username.toLowerCase() === searchTerm || u.email.toLowerCase() === searchTerm || u.empId.toLowerCase() === searchTerm);
    if (user) {
      // In a real app, an email would be sent. For mock, we can log it.
      console.log(`Password reset requested for ${user.email}. Mock code is '123456'.`);
    }
    return true; // Always return true for security reasons
};

export const userResetPassword = async ({ emailOrEmpId, code, newPassword }: { emailOrEmpId: string, code: string, newPassword: string }): Promise<boolean> => {
    await delay(500);
    const searchTerm = emailOrEmpId.toLowerCase();
    const userIndex = db.users.findIndex(u => u.username.toLowerCase() === searchTerm || u.email.toLowerCase() === searchTerm || u.empId.toLowerCase() === searchTerm);
    
    // Use a mock code "123456" for demonstration
    if (userIndex !== -1 && code === "123456") { 
        db.users[userIndex].password = newPassword;
        return true;
    }
    return false;
};

export const adminResetPassword = async ({ userId, newPassword }: { userId: string, newPassword: string }): Promise<boolean> => {
    await delay(200);
    const userIndex = db.users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
        db.users[userIndex].password = newPassword;
        console.log(`Admin reset password for ${db.users[userIndex].name}. New password is ${newPassword}`);
        return true;
    }
    return false;
};