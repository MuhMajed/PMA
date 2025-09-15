// FIX: Add EquipmentStatus to the import from './types'
import { ManpowerStatus, Shift, Project, Employee, Subcontractor, User, ProgressRecord, Profession, Department, Equipment, EquipmentRecord, ManpowerRecord, SafetyViolation, EquipmentStatus, ActivityGroup, ActivityGroupMapping } from './types';

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
  safetyViolations: SafetyViolation[];
  activityGroups: ActivityGroup[];
  activityGroupMappings: ActivityGroupMapping[];
} = {
  projects: [
    { id: 'proj-1', name: 'Jeddah Tower Construction', parentId: null, type: 'Project', hierarchyLabels: { Level1: 'Zone', Level2: 'Building', Level3: 'Floor', Activity: 'Task' } },
    { id: 'proj-2', name: 'Zone A', parentId: 'proj-1', type: 'Level1' },
    { id: 'proj-3', name: 'Residential Building 1', parentId: 'proj-2', type: 'Level2' },
    { id: 'proj-4', name: 'Floor 10', parentId: 'proj-3', type: 'Level3' },
    { id: 'proj-5', name: 'Concrete Pouring - F10', parentId: 'proj-4', type: 'Activity', totalQty: 5000 },
    { id: 'proj-6', name: 'Zone B', parentId: 'proj-1', type: 'Level1' },
    // Taawon Project
    { id: 'proj-taawon', name: 'Taawon', parentId: null, type: 'Project', hierarchyLabels: { Level1: 'Location', Level2: 'Construction Level', Level3: 'Zone/Building', Level4: 'Levels', Activity: 'Activity' } },
    // Level 1: Locations
    { id: 'proj-taawon-dammam', name: 'Dammam', parentId: 'proj-taawon', type: 'Level1' },
    { id: 'proj-taawon-khobar', name: 'Khobar', parentId: 'proj-taawon', type: 'Level1' },
    // Level 2 for Dammam
    { id: 'proj-taawon-dammam-sub', name: 'Substructure', parentId: 'proj-taawon-dammam', type: 'Level2' },
    { id: 'proj-taawon-dammam-super', name: 'Superstructure', parentId: 'proj-taawon-dammam', type: 'Level2' },
    // Level 2 for Khobar
    { id: 'proj-taawon-khobar-sub', name: 'Substructure', parentId: 'proj-taawon-khobar', type: 'Level2' },
    { id: 'proj-taawon-khobar-super', name: 'Superstructure', parentId: 'proj-taawon-khobar', type: 'Level2' },
    // Level 3 for Khobar > Substructure
    { id: 'proj-taawon-khobar-sub-z1', name: 'Zone 1', parentId: 'proj-taawon-khobar-sub', type: 'Level3' },
    { id: 'proj-taawon-khobar-sub-z2', name: 'Zone 2', parentId: 'proj-taawon-khobar-sub', type: 'Level3' },
    { id: 'proj-taawon-khobar-sub-z3', name: 'Zone 3', parentId: 'proj-taawon-khobar-sub', type: 'Level3' },
    { id: 'proj-taawon-khobar-sub-z4', name: 'Zone 4', parentId: 'proj-taawon-khobar-sub', type: 'Level3' },
    { id: 'proj-taawon-khobar-sub-z5a', name: 'Zone 5A', parentId: 'proj-taawon-khobar-sub', type: 'Level3' },
    { id: 'proj-taawon-khobar-sub-z5b', name: 'Zone 5B', parentId: 'proj-taawon-khobar-sub', type: 'Level3' },
    { id: 'proj-taawon-khobar-sub-z6a', name: 'Zone 6A', parentId: 'proj-taawon-khobar-sub', type: 'Level3' },
    { id: 'proj-taawon-khobar-sub-z6b', name: 'Zone 6B', parentId: 'proj-taawon-khobar-sub', type: 'Level3' },
    { id: 'proj-taawon-khobar-sub-z7', name: 'Zone 7', parentId: 'proj-taawon-khobar-sub', type: 'Level3' },
    { id: 'proj-taawon-khobar-sub-z8', name: 'Zone 8', parentId: 'proj-taawon-khobar-sub', type: 'Level3' },
    // Level 3 for Dammam > Substructure
    { id: 'proj-taawon-dammam-sub-z1', name: 'Zone 1', parentId: 'proj-taawon-dammam-sub', type: 'Level3' },
    { id: 'proj-taawon-dammam-sub-z2a', name: 'Zone 2A', parentId: 'proj-taawon-dammam-sub', type: 'Level3' },
    { id: 'proj-taawon-dammam-sub-z2b', name: 'Zone 2B', parentId: 'proj-taawon-dammam-sub', type: 'Level3' },
    { id: 'proj-taawon-dammam-sub-z3a', name: 'Zone 3A', parentId: 'proj-taawon-dammam-sub', type: 'Level3' },
    { id: 'proj-taawon-dammam-sub-z3b', name: 'Zone 3B', parentId: 'proj-taawon-dammam-sub', type: 'Level3' },
    { id: 'proj-taawon-dammam-sub-z4a', name: 'Zone 4A', parentId: 'proj-taawon-dammam-sub', type: 'Level3' },
    { id: 'proj-taawon-dammam-sub-z4b', name: 'Zone 4B', parentId: 'proj-taawon-dammam-sub', type: 'Level3' },
    { id: 'proj-taawon-dammam-sub-z5a', name: 'Zone 5A', parentId: 'proj-taawon-dammam-sub', type: 'Level3' },
    { id: 'proj-taawon-dammam-sub-z5b', name: 'Zone 5B', parentId: 'proj-taawon-dammam-sub', type: 'Level3' },
    { id: 'proj-taawon-dammam-sub-z6a', name: 'Zone 6A', parentId: 'proj-taawon-dammam-sub', type: 'Level3' },
    { id: 'proj-taawon-dammam-sub-z6b', name: 'Zone 6B', parentId: 'proj-taawon-dammam-sub', type: 'Level3' },
    { id: 'proj-taawon-dammam-sub-z7a', name: 'Zone 7A', parentId: 'proj-taawon-dammam-sub', type: 'Level3' },
    { id: 'proj-taawon-dammam-sub-z7b', name: 'Zone 7B', parentId: 'proj-taawon-dammam-sub', type: 'Level3' },
    { id: 'proj-taawon-dammam-sub-z7c', name: 'Zone 7C', parentId: 'proj-taawon-dammam-sub', type: 'Level3' },
    { id: 'proj-taawon-dammam-sub-z7d', name: 'Zone 7D', parentId: 'proj-taawon-dammam-sub', type: 'Level3' },
    { id: 'proj-taawon-dammam-sub-z8', name: 'Zone 8', parentId: 'proj-taawon-dammam-sub', type: 'Level3' },
    { id: 'proj-taawon-dammam-sub-z9', name: 'Zone 9', parentId: 'proj-taawon-dammam-sub', type: 'Level3' },
    { id: 'proj-taawon-dammam-sub-z10', name: 'Zone 10', parentId: 'proj-taawon-dammam-sub', type: 'Level3' },
    { id: 'proj-taawon-dammam-sub-z11', name: 'Zone 11', parentId: 'proj-taawon-dammam-sub', type: 'Level3' },
    { id: 'proj-taawon-dammam-sub-z12a', name: 'Zone 12A', parentId: 'proj-taawon-dammam-sub', type: 'Level3' },
    { id: 'proj-taawon-dammam-sub-z12b', name: 'Zone 12B', parentId: 'proj-taawon-dammam-sub', type: 'Level3' },
    { id: 'proj-taawon-dammam-sub-z13a', name: 'Zone 13A', parentId: 'proj-taawon-dammam-sub', type: 'Level3' },
    { id: 'proj-taawon-dammam-sub-z13b', name: 'Zone 13B', parentId: 'proj-taawon-dammam-sub', type: 'Level3' },
    // Level 4 for Khobar > Substructure > Zones
    { id: 'proj-taawon-khobar-sub-z1-l4', name: 'Under Ground Floor', parentId: 'proj-taawon-khobar-sub-z1', type: 'Level4' },
    { id: 'proj-taawon-khobar-sub-z2-l4', name: 'Under Ground Floor', parentId: 'proj-taawon-khobar-sub-z2', type: 'Level4' },
    { id: 'proj-taawon-khobar-sub-z3-l4', name: 'Under Ground Floor', parentId: 'proj-taawon-khobar-sub-z3', type: 'Level4' },
    { id: 'proj-taawon-khobar-sub-z4-l4', name: 'Under Ground Floor', parentId: 'proj-taawon-khobar-sub-z4', type: 'Level4' },
    { id: 'proj-taawon-khobar-sub-z5a-l4', name: 'Under Ground Floor', parentId: 'proj-taawon-khobar-sub-z5a', type: 'Level4' },
    { id: 'proj-taawon-khobar-sub-z5b-l4', name: 'Under Ground Floor', parentId: 'proj-taawon-khobar-sub-z5b', type: 'Level4' },
    { id: 'proj-taawon-khobar-sub-z6a-l4', name: 'Under Ground Floor', parentId: 'proj-taawon-khobar-sub-z6a', type: 'Level4' },
    { id: 'proj-taawon-khobar-sub-z6b-l4', name: 'Under Ground Floor', parentId: 'proj-taawon-khobar-sub-z6b', type: 'Level4' },
    { id: 'proj-taawon-khobar-sub-z7-l4', name: 'Under Ground Floor', parentId: 'proj-taawon-khobar-sub-z7', type: 'Level4' },
    { id: 'proj-taawon-khobar-sub-z8-l4', name: 'Under Ground Floor', parentId: 'proj-taawon-khobar-sub-z8', type: 'Level4' },
    // Level 4 for Dammam > Substructure > Zones
    { id: 'proj-taawon-dammam-sub-z1-l4', name: 'Under Ground Floor', parentId: 'proj-taawon-dammam-sub-z1', type: 'Level4' },
    { id: 'proj-taawon-dammam-sub-z2a-l4', name: 'Under Ground Floor', parentId: 'proj-taawon-dammam-sub-z2a', type: 'Level4' },
    { id: 'proj-taawon-dammam-sub-z2b-l4', name: 'Under Ground Floor', parentId: 'proj-taawon-dammam-sub-z2b', type: 'Level4' },
    { id: 'proj-taawon-dammam-sub-z3a-l4', name: 'Under Ground Floor', parentId: 'proj-taawon-dammam-sub-z3a', type: 'Level4' },
    { id: 'proj-taawon-dammam-sub-z3b-l4', name: 'Under Ground Floor', parentId: 'proj-taawon-dammam-sub-z3b', type: 'Level4' },
    { id: 'proj-taawon-dammam-sub-z4a-l4', name: 'Under Ground Floor', parentId: 'proj-taawon-dammam-sub-z4a', type: 'Level4' },
    { id: 'proj-taawon-dammam-sub-z4b-l4', name: 'Under Ground Floor', parentId: 'proj-taawon-dammam-sub-z4b', type: 'Level4' },
    { id: 'proj-taawon-dammam-sub-z5a-l4', name: 'Under Ground Floor', parentId: 'proj-taawon-dammam-sub-z5a', type: 'Level4' },
    { id: 'proj-taawon-dammam-sub-z5b-l4', name: 'Under Ground Floor', parentId: 'proj-taawon-dammam-sub-z5b', type: 'Level4' },
    { id: 'proj-taawon-dammam-sub-z6a-l4', name: 'Under Ground Floor', parentId: 'proj-taawon-dammam-sub-z6a', type: 'Level4' },
    { id: 'proj-taawon-dammam-sub-z6b-l4', name: 'Under Ground Floor', parentId: 'proj-taawon-dammam-sub-z6b', type: 'Level4' },
    { id: 'proj-taawon-dammam-sub-z7a-l4', name: 'Under Ground Floor', parentId: 'proj-taawon-dammam-sub-z7a', type: 'Level4' },
    { id: 'proj-taawon-dammam-sub-z7b-l4', name: 'Under Ground Floor', parentId: 'proj-taawon-dammam-sub-z7b', type: 'Level4' },
    { id: 'proj-taawon-dammam-sub-z7c-l4', name: 'Under Ground Floor', parentId: 'proj-taawon-dammam-sub-z7c', type: 'Level4' },
    { id: 'proj-taawon-dammam-sub-z7d-l4', name: 'Under Ground Floor', parentId: 'proj-taawon-dammam-sub-z7d', type: 'Level4' },
    { id: 'proj-taawon-dammam-sub-z8-l4', name: 'Under Ground Floor', parentId: 'proj-taawon-dammam-sub-z8', type: 'Level4' },
    { id: 'proj-taawon-dammam-sub-z9-l4', name: 'Under Ground Floor', parentId: 'proj-taawon-dammam-sub-z9', type: 'Level4' },
    { id: 'proj-taawon-dammam-sub-z10-l4', name: 'Under Ground Floor', parentId: 'proj-taawon-dammam-sub-z10', type: 'Level4' },
    { id: 'proj-taawon-dammam-sub-z11-l4', name: 'Under Ground Floor', parentId: 'proj-taawon-dammam-sub-z11', type: 'Level4' },
    { id: 'proj-taawon-dammam-sub-z12a-l4', name: 'Under Ground Floor', parentId: 'proj-taawon-dammam-sub-z12a', type: 'Level4' },
    { id: 'proj-taawon-dammam-sub-z12b-l4', name: 'Under Ground Floor', parentId: 'proj-taawon-dammam-sub-z12b', type: 'Level4' },
    { id: 'proj-taawon-dammam-sub-z13a-l4', name: 'Under Ground Floor', parentId: 'proj-taawon-dammam-sub-z13a', type: 'Level4' },
    { id: 'proj-taawon-dammam-sub-z13b-l4', name: 'Under Ground Floor', parentId: 'proj-taawon-dammam-sub-z13b', type: 'Level4' },
  ],
  employees: [
    { id: 'emp-1', empId: 'EMP001', name: 'John Doe', profession: 'Site Engineer', nationality: 'American', idIqama: '1234567890', department: 'Engineering', email: 'johndoe@example.com', phone: '555-0101', type: 'Indirect', subcontractor: 'Saudi Bin Ladin Group', joiningDate: '2023-01-15' },
    { id: 'emp-2', empId: 'EMP002', name: 'Ali Khan', profession: 'Electrician', nationality: 'Pakistani', idIqama: '2345678901', department: 'Construction & Field Operations', email: 'alikhan@example.com', phone: '555-0102', type: 'Direct', subcontractor: 'BuildWell Inc.', joiningDate: '2023-02-20' },
    { id: 'emp-3', empId: 'EMP003', name: 'Mohammed Al-Masri', profession: 'Safety Officer', nationality: 'Egyptian', idIqama: '3456789012', department: 'HSE', phone: '555-0103', type: 'Indirect', subcontractor: 'Saudi Bin Ladin Group', joiningDate: '2022-11-10' },
    { id: 'emp-4', empId: 'TAA001', name: 'Ravi Kumar', profession: 'Scaffolder', nationality: 'Indian', idIqama: '4567890123', department: 'Construction & Field Operations', phone: '555-0104', type: 'Direct', subcontractor: 'Modern Scaffolding Co.', joiningDate: '2023-03-01' },
    { id: 'emp-5', empId: 'TAA002', name: 'Suresh Patel', profession: 'Rebar Fitter', nationality: 'Indian', idIqama: '5678901234', department: 'Construction & Field Operations', phone: '555-0105', type: 'Direct', subcontractor: 'Steel Reinforcements Ltd.', joiningDate: '2023-03-05' },
    { id: 'emp-6', empId: 'EMP004', name: 'Safety User', profession: 'Safety Officer', nationality: 'Saudi Arabian', idIqama: '6789012345', department: 'HSE', email: 'safety@prodmon.com', phone: '555-0106', type: 'Indirect', subcontractor: 'Saudi Bin Ladin Group', joiningDate: '2023-04-01' },
  ],
  manpowerRecords: [
    { id: 'rec-1', empId: 'EMP002', name: 'Ali Khan', profession: 'Electrician', project: 'proj-5', status: ManpowerStatus.ACTIVE, nationality: 'Pakistani', subcontractor: 'BuildWell Inc.', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], hoursWorked: 8, shift: Shift.DAY },
    { id: 'rec-2', empId: 'EMP001', name: 'John Doe', profession: 'Site Engineer', project: 'proj-3', status: ManpowerStatus.ACTIVE, nationality: 'American', subcontractor: 'Saudi Bin Ladin Group', date: new Date().toISOString().split('T')[0], hoursWorked: 10, shift: Shift.DAY },
  ],
  subcontractors: [
    { id: 'sub-1', name: 'Saudi Bin Ladin Group', contactPerson: 'Admin', email: 'info@sbg.com.sa', website: 'sbg.com.sa', nationality: 'Saudi Arabian', scope: 'General Contracting' },
    { id: 'sub-2', name: 'BuildWell Inc.', contactPerson: 'Mr. Sharma', email: 'contact@buildwell.com', website: 'buildwell.com', nationality: 'Indian', scope: 'Civil Works' },
    { id: 'sub-3', name: 'Modern Scaffolding Co.', contactPerson: 'Mr. Ahmed', email: 'ahmed@modernscaff.com', website: 'modernscaff.com', nationality: 'Emirati', scope: 'Civil Works' },
    { id: 'sub-4', name: 'Steel Reinforcements Ltd.', contactPerson: 'Mr. Singh', email: 'singh@steelrein.com', website: 'steelrein.com', nationality: 'Indian', scope: 'Civil Works' },
  ],
  professions: ['Site Engineer', 'Electrician', 'Plumber', 'Safety Officer', 'Project Manager', 'Foreman', 'Mason', 'Carpenter', 'Scaffolder', 'Rebar Fitter', 'Concrete Pourer'],
  departments: ['Engineering', 'HSE', 'Construction & Field Operations', 'Project Management'],
  progressRecords: [
      { id: 'prog-1', activityId: 'proj-5', activityGroupId: 'group-concrete', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], qty: 150 },
      { id: 'prog-2', activityId: 'proj-5', activityGroupId: 'group-concrete', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], qty: 200 },
  ],
  users: [
      { id: 'user-1', name: 'Admin User', username: 'admin', empId: 'EMP003', email: 'admin@prodmon.com', password: 'admin123', role: 'Admin', assignedProjects: [] },
      { id: 'user-2', name: 'Project Manager A', username: 'pm', empId: 'EMP001', email: 'johndoe@example.com', password: 'pm123', role: 'Project Manager', assignedProjects: ['proj-1'] },
      { id: 'user-3', name: 'Data Entry User', username: 'dataentry', empId: 'EMP002', email: 'alikhan@example.com', password: 'dataentry123', role: 'Data Entry', assignedProjects: ['proj-1'] },
      { id: 'user-4', name: 'Safety User', username: 'safety', empId: 'EMP004', email: 'safety@prodmon.com', password: 'safety123', role: 'Safety', assignedProjects: [] },
  ],
  scopes: ['Civil Works', 'MEP Works', 'Finishing Works', 'General Contracting', 'Earthworks', 'HVAC'],
  equipment: [
    { id: 'eq-1', name: 'Excavator CAT 320D', type: 'Excavator', plateNo: 'EX-001', operatorId: 'EMP001', status: 'Active' },
    { id: 'eq-2', name: 'Tower Crane 1', type: 'Crane', plateNo: 'TC-A1', operatorId: 'EMP002', status: 'Active' },
  ],
  equipmentRecords: [
    { id: 'er-1', equipmentId: 'eq-1', date: new Date().toISOString().split('T')[0], project: 'proj-5', status: EquipmentStatus.WORKING, hoursWorked: 8, shift: Shift.DAY, operatorId: 'EMP001' },
  ],
  safetyViolations: [
    {
      id: 'sv-1',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      projectId: 'proj-5',
      subcontractor: 'BuildWell Inc.',
      empId: 'EMP002',
      violationType: 'No Helmet',
      description: 'Worker Ali Khan was observed operating machinery without a helmet.',
      actionTaken: 'Worker was given a warning and provided with a helmet. A toolbox talk on PPE was scheduled for the next morning.',
      photo: '', // Base64 string would go here
      createdBy: 'user-1'
    },
    // Taawon Data for July/August 2025
    {
      id: 'sv-2',
      date: '2025-08-01',
      projectId: 'act-khobar-sub-z1-l4-scaffolding',
      subcontractor: 'Modern Scaffolding Co.',
      empId: 'TAA001',
      violationType: 'No Harness',
      description: 'Worker Ravi Kumar was seen working at an elevation of 3 meters without a safety harness.',
      actionTaken: 'Work was immediately stopped. The worker was reprimanded and sent for a refresher safety training session. A safety stand-down was held for the entire crew.',
      photo: '',
      createdBy: 'user-1'
    }
  ],
  activityGroups: [
    { id: 'group-concrete', name: 'Concrete Pouring C35', uom: 'm³', universalNorm: 0.5, companyNorm: 0.45, rate: 120 },
    { id: 'group-scaffolding', name: 'Standard Scaffolding', uom: 'm²', universalNorm: 0.25, companyNorm: 0.2, rate: 25 },
    { id: 'group-rebar', name: 'Rebar Fixing', uom: 'ton', universalNorm: 16, companyNorm: 14, rate: 3000 },
    { id: 'group-formwork', name: 'Standard Formwork', uom: 'm²', universalNorm: 0.4, companyNorm: 0.35, rate: 50 },
    { id: 'group-deshutter', name: 'Standard Deshuttering', uom: 'm²', universalNorm: 0.15, companyNorm: 0.12, rate: 10 },
  ],
  activityGroupMappings: [
    { activityId: 'proj-5', activityGroupId: 'group-concrete' }
  ]
};

// Auto-generate activities for Taawon project Level 4 nodes
const level4Nodes = db.projects.filter(p => p.type === 'Level4');

const activityTemplates: { name: string, totalQty: number, groupId: string }[] = [
  { name: 'Scaffolding', totalQty: 500, groupId: 'group-scaffolding' },
  { name: 'Raft Footings - Formwork', totalQty: 300, groupId: 'group-formwork' },
  { name: 'Raft Footings - Rebar', totalQty: 15, groupId: 'group-rebar' },
  { name: 'Raft Footings - Pouring', totalQty: 250, groupId: 'group-concrete' },
  { name: 'Raft Footings - Deshuttering', totalQty: 300, groupId: 'group-deshutter' },
];

level4Nodes.forEach(level4Node => {
    activityTemplates.forEach(template => {
        const activityName = template.name.replace(/ /g, '-').toLowerCase();
        const parentIdParts = level4Node.id.split('-').slice(2).join('-');
        const activityId = `act-${parentIdParts}-${activityName}`;
        
        db.projects.push({
            id: activityId,
            parentId: level4Node.id,
            name: template.name,
            type: 'Activity',
            totalQty: template.totalQty
        });
        db.activityGroupMappings.push({
            activityId: activityId,
            activityGroupId: template.groupId
        });
    });
});

// --- START: Auto-generate daily data for Taawon Project ---
const startDate = new Date('2025-07-01T12:00:00Z');
const endDate = new Date('2025-08-25T12:00:00Z');

// Find relevant activities
const dammamActivities = db.projects.filter(p => p.id.includes('dammam') && p.type === 'Activity').map(p => p.id);
const khobarActivities = db.projects.filter(p => p.id.includes('khobar') && p.type === 'Activity').map(p => p.id);

const scaffoldingMappings = db.activityGroupMappings.filter(m => m.activityGroupId === 'group-scaffolding');
const rebarMappings = db.activityGroupMappings.filter(m => m.activityGroupId === 'group-rebar');
const concreteMappings = db.activityGroupMappings.filter(m => m.activityGroupId === 'group-concrete');


let currentDate = new Date(startDate);
let recordIdCounter = 100;

while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayOfWeek = currentDate.getUTCDay(); // Sunday = 0, ..., Saturday = 6

    // Skip Fridays (weekend)
    if (dayOfWeek === 5) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
    }

    // --- LINKED MANPOWER & PROGRESS ---
    
    // Scaffolding Work
    if (Math.random() > 0.1 && scaffoldingMappings.length > 0) {
        const mapping = scaffoldingMappings[Math.floor(Math.random() * scaffoldingMappings.length)];
        const { activityId, activityGroupId } = mapping;
        const hours = parseFloat((8 + Math.random() * 2).toFixed(1));
        const group = db.activityGroups.find(g => g.id === activityGroupId)!;
        const qty = parseFloat((hours * group.universalNorm * (0.8 + Math.random() * 0.4)).toFixed(2));
        
        db.manpowerRecords.push({
            id: `rec-m-${recordIdCounter++}`, empId: 'TAA001', name: 'Ravi Kumar', profession: 'Scaffolder', 
            project: activityId, status: ManpowerStatus.ACTIVE, nationality: 'Indian', subcontractor: 'Modern Scaffolding Co.', 
            date: dateStr, hoursWorked: hours, shift: Shift.DAY
        });
        db.progressRecords.push({
            id: `prog-${recordIdCounter++}`, activityId, activityGroupId, date: dateStr, qty, shift: Shift.DAY
        });
    }

    // Rebar Work
    if (Math.random() > 0.15 && rebarMappings.length > 0) {
        const mapping = rebarMappings[Math.floor(Math.random() * rebarMappings.length)];
        const { activityId, activityGroupId } = mapping;
        const hours = parseFloat((8.5 + Math.random() * 2).toFixed(1));
        const group = db.activityGroups.find(g => g.id === activityGroupId)!;
        const qty = parseFloat((hours / group.universalNorm * (0.8 + Math.random() * 0.4)).toFixed(3));
        const shift = Math.random() > 0.5 ? Shift.DAY : Shift.NIGHT;
        
        db.manpowerRecords.push({
            id: `rec-m-${recordIdCounter++}`, empId: 'TAA002', name: 'Suresh Patel', profession: 'Rebar Fitter', 
            project: activityId, status: ManpowerStatus.ACTIVE, nationality: 'Indian', subcontractor: 'Steel Reinforcements Ltd.', 
            date: dateStr, hoursWorked: hours, shift: shift
        });
        db.progressRecords.push({
            id: `prog-${recordIdCounter++}`, activityId, activityGroupId, date: dateStr, qty, shift
        });
    }
    
    // Pouring Work
    if (Math.random() > 0.2 && concreteMappings.length > 0) {
        const mapping = concreteMappings[Math.floor(Math.random() * concreteMappings.length)];
        const { activityId, activityGroupId } = mapping;
        const hours = 9;
        const group = db.activityGroups.find(g => g.id === activityGroupId)!;
        const qty = parseFloat((hours * group.universalNorm * (0.8 + Math.random() * 0.4)).toFixed(2));
        
        db.manpowerRecords.push({
            id: `rec-m-${recordIdCounter++}`, empId: 'EMP002', name: 'Ali Khan', profession: 'Concrete Pourer',
            project: activityId, status: ManpowerStatus.ACTIVE, nationality: 'Pakistani', subcontractor: 'BuildWell Inc.',
            date: dateStr, hoursWorked: hours, shift: Shift.NIGHT
        });
        db.progressRecords.push({
            id: `prog-${recordIdCounter++}`, activityId, activityGroupId, date: dateStr, qty, shift: Shift.NIGHT
        });
    }


    // --- UNLINKED/INDIRECT MANPOWER ---
    // Indirect staff are more consistent and don't have direct progress records.
    db.manpowerRecords.push({
        id: `rec-m-${recordIdCounter++}`, empId: 'EMP003', name: 'Mohammed Al-Masri', profession: 'Safety Officer', 
        project: 'proj-taawon-dammam-sub-z1', status: ManpowerStatus.ACTIVE, nationality: 'Egyptian', subcontractor: 'Saudi Bin Ladin Group', 
        date: dateStr, hoursWorked: 9, shift: Shift.DAY
    });
    db.manpowerRecords.push({
        id: `rec-m-${recordIdCounter++}`, empId: 'EMP001', name: 'John Doe', profession: 'Site Engineer',
        project: 'proj-taawon-khobar-sub-z1', status: ManpowerStatus.ACTIVE, nationality: 'American', subcontractor: 'Saudi Bin Ladin Group',
        date: dateStr, hoursWorked: parseFloat((9.5 + Math.random() * 2).toFixed(1)), shift: Shift.DAY
    });

    // --- EQUIPMENT ---
    db.equipmentRecords.push({
        id: `er-${recordIdCounter++}`, equipmentId: 'eq-1', date: dateStr, 
        project: khobarActivities[(recordIdCounter % khobarActivities.length)], status: EquipmentStatus.WORKING, hoursWorked: 8, shift: Shift.DAY, operatorId: 'EMP001'
    });
    
    if (dayOfWeek !== 6) { // Not Saturday
         db.equipmentRecords.push({
            id: `er-${recordIdCounter++}`, equipmentId: 'eq-2', date: dateStr, 
            project: dammamActivities[(recordIdCounter % dammamActivities.length)], status: EquipmentStatus.WORKING, hoursWorked: 9, shift: Shift.NIGHT, operatorId: 'EMP002'
        });
    } else { // Saturday breakdown
         db.equipmentRecords.push({
            id: `er-${recordIdCounter++}`, equipmentId: 'eq-2', date: dateStr, 
            project: dammamActivities[(recordIdCounter % dammamActivities.length)], status: EquipmentStatus.BREAKDOWN, shift: Shift.NIGHT, remarks: 'Hydraulic leak'
        });
    }

    currentDate.setDate(currentDate.getDate() + 1);
}
// --- END: Auto-generate daily data ---


export { db };