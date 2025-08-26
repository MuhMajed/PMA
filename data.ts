// FIX: Add ManpowerRecord to the import from './types'
import { ManpowerStatus, Shift, Project, Employee, Subcontractor, User, ProgressRecord, Profession, Department, Equipment, EquipmentRecord, ManpowerRecord } from './types';

// In-memory database for the application prototype
const db: {
  projects: Project[];
  employees: Employee[];
  manpowerRecords: ManpowerRecord[];
  subcontractors: Subcontractor[];
  professions: Profession[];
  departments: Department[];
  progressRecords: ProgressRecord[];
  users: User[];
  scopes: string[];
  equipment: Equipment[];
  equipmentRecords: EquipmentRecord[];
} = {
  projects: [
    { id: 'proj-1', name: 'Jeddah Tower Construction', parentId: null, type: 'Project', hierarchyLabels: { Level1: 'Zone', Level2: 'Building', Level3: 'Floor', Activity: 'Task' } },
    { id: 'proj-2', name: 'Zone A', parentId: 'proj-1', type: 'Level1' },
    { id: 'proj-3', name: 'Residential Building 1', parentId: 'proj-2', type: 'Level2' },
    { id: 'proj-4', name: 'Floor 10', parentId: 'proj-3', type: 'Level3' },
    { id: 'proj-5', name: 'Concrete Pouring - F10', parentId: 'proj-4', type: 'Activity', uom: 'm³', totalQty: 5000, universalNorm: 0.5, companyNorm: 0.45, rate: 120 },
    { id: 'proj-6', name: 'Zone B', parentId: 'proj-1', type: 'Level1' },
  ],
  employees: [
    { id: 'emp-1', empId: 'E001', name: 'Admin User', profession: 'System Admin', nationality: 'Saudi Arabian', idIqama: '1111111111', department: 'IT', phone: '555-0101', type: 'Indirect', subcontractor: 'Saudi Bin Ladin Group' },
    { id: 'emp-2', empId: 'E002', name: 'Project Manager', profession: 'Project Manager', nationality: 'American', idIqama: '2222222222', department: 'Management', phone: '555-0102', type: 'Indirect', subcontractor: 'Saudi Bin Ladin Group' },
    { id: 'emp-3', empId: 'E003', name: 'Data Entry User', profession: 'Data Clerk', nationality: 'Filipino', idIqama: '3333333333', department: 'Site Office', phone: '555-0103', type: 'Indirect', subcontractor: 'Saudi Bin Ladin Group' },
    { id: 'emp-4', empId: 'E101', name: 'Ahmed Khan', profession: 'Civil Engineer', nationality: 'Pakistani', idIqama: '4444444444', department: 'Engineering', phone: '555-0104', type: 'Direct', subcontractor: 'Civil Works Co' },
  ],
  users: [
    { id: 'user-1', name: 'Admin User', username: 'admin', empId: 'E001', email: 'admin@example.com', password: 'admin123', role: 'Admin' },
    { id: 'user-2', name: 'Project Manager', username: 'pm', empId: 'E002', email: 'pm@example.com', password: 'pm123', role: 'Project Manager', assignedProjects: ['proj-1'] },
    { id: 'user-3', name: 'Data Entry User', username: 'dataentry', empId: 'E003', email: 'dataentry@example.com', password: 'dataentry123', role: 'Data Entry', assignedProjects: ['proj-1'] },
  ],
  manpowerRecords: [],
  subcontractors: [
    { id: 'sub-1', name: 'Saudi Bin Ladin Group', contactPerson: 'HR Dept', email: 'hr@sbg.com.sa', website: 'sbg.com.sa', nationality: 'Saudi Arabian', scope: 'General Contracting' },
    { id: 'sub-2', name: 'Civil Works Co', contactPerson: 'Mr. Ali', email: 'ali@civil.com', website: 'civil.com', nationality: 'Emirati', scope: 'Civil Works' }
  ],
  professions: ['System Admin', 'Project Manager', 'Data Clerk', 'Civil Engineer', 'Plumber', 'Electrician'],
  departments: ['IT', 'Management', 'Site Office', 'Engineering', 'Construction & Field Operations'],
  progressRecords: [],
  scopes: ['Civil Works', 'MEP Works', 'Finishing Works', 'General Contracting', 'Earthworks', 'HVAC'],
  equipment: [],
  equipmentRecords: [],
};

// Make DB mutable for the mock API
const mutableDb = JSON.parse(JSON.stringify(db));

export { mutableDb as db };