import { Project, ManpowerRecord, ManpowerStatus, Employee, Subcontractor, Shift, User, UserRole, ProgressRecord, ProjectNodeType, Profession, Department } from './types';
import { SCOPES } from './constants';

// This file acts as a simple in-memory database for the API simulation.

// --- PROJECTS ---
// Helper functions to generate large project structures
const generateJeddahTower = (): Project[] => {
    const projects: Project[] = [];
    const rootId = 'jt_root';
    projects.push({ id: rootId, name: 'Jedda Tower', parentId: null, type: 'Project' });

    // Podium
    const podiumId = 'jt_podium';
    projects.push({ id: podiumId, name: 'Podium', parentId: rootId, type: 'Level1' });
    for (let i = 1; i <= 4; i++) {
        const areaId = `jt_podium_a${i}`;
        projects.push({ id: areaId, name: `Area ${i}`, parentId: podiumId, type: 'Level2' });
        projects.push({ id: `${areaId}_act`, name: 'General Works', parentId: areaId, type: 'Activity', uom: 'LS', totalQty: 1, universalNorm: 1 });
    }

    // Tower
    const towerId = 'jt_tower';
    projects.push({ id: towerId, name: 'Tower', parentId: rootId, type: 'Level1' });
    for (let i = 1; i <= 300; i++) {
        const levelId = `jt_tower_l${i}`;
        projects.push({ id: levelId, name: `Level ${i}`, parentId: towerId, type: 'Level2' });

        const subLevels = [
            { id: `${levelId}_core`, name: 'Core' },
            { id: `${levelId}_wa`, name: 'Wing A' },
            { id: `${levelId}_wb`, name: 'Wing B' },
            { id: `${levelId}_wc`, name: 'Wing C' },
        ];

        for (const sub of subLevels) {
            projects.push({ id: sub.id, name: sub.name, parentId: levelId, type: 'Level3' });
            projects.push({ id: `${sub.id}_act`, name: 'General Works', parentId: sub.id, type: 'Activity', uom: 'LS', totalQty: 1, universalNorm: 1 });
        }
    }
    return projects;
};

const generateNGH = (): Project[] => {
    const projects: Project[] = [];
    const rootId = 'ngh_root';
    projects.push({ id: rootId, name: 'NGH', parentId: null, type: 'Project' });

    const cities = ['Jeddah', 'Madinah', 'Bahra', 'Dammam', 'Riyadh', 'X', 'Y'];
    for (const city of cities) {
        const cityId = `ngh_${city.toLowerCase()}`;
        projects.push({ id: cityId, name: city, parentId: rootId, type: 'Level1' });
        projects.push({ id: `${cityId}_rework`, name: 'Rework', parentId: cityId, type: 'Activity', uom: 'LS', totalQty: 1, universalNorm: 1 });
    }
    return projects;
};

const generateKSU = (): Project[] => {
    const projects: Project[] = [];
    const rootId = 'ksu_root';
    projects.push({ id: rootId, name: 'KSU', parentId: null, type: 'Project' });
    const southVillaId = 'ksu_sv';
    projects.push({ id: southVillaId, name: 'South Villa', parentId: rootId, type: 'Level1' });

    const villas = [
        { id: 'ksu_sv_th', name: 'Town House' },
        { id: 'ksu_sv_5b', name: '5 BED VILLAS' },
        { id: 'ksu_sv_4b', name: '4 BED VILLAS' },
    ];

    for (const villa of villas) {
        projects.push({ id: villa.id, name: villa.name, parentId: southVillaId, type: 'Level2' });
        projects.push({ id: `${villa.id}_fin`, name: 'Finishing', parentId: villa.id, type: 'Activity', uom: 'm2', totalQty: 1000, universalNorm: 1 });
    }
    return projects;
};

export let projects: Project[] = [
  ...generateJeddahTower(),
  ...generateNGH(),
  ...generateKSU(),
  // Taawon Project (preserved)
  { id: 'p4', name: 'Taawon', parentId: null, type: 'Project', hierarchyLabels: {
    Level1: 'Location',
    Level2: 'Work Type',
    Level3: 'Sub-level',
    Level4: 'Package',
    Level5: 'Sub-Package',
  }},
  { id: 'p4_loc1', name: 'Dammam', parentId: 'p4', type: 'Level1' },
  { id: 'p4_loc2', name: 'Khobar', parentId: 'p4', type: 'Level1' },
  { id: 'p4_dammam_area1', name: 'Substructure', parentId: 'p4_loc1', type: 'Level2' },
  { id: 'p4_dammam_area2', name: 'Superstructure', parentId: 'p4_loc1', type: 'Level2' },
  { id: 'p4_dammam_sub_bld1', name: 'Underground', parentId: 'p4_dammam_area1', type: 'Level3' },
  { id: 'p4_dammam_super_bld1', name: 'Zone 1', parentId: 'p4_dammam_area2', type: 'Level3' },
  { id: 'p4_dammam_super_bld2', name: 'Zone 2', parentId: 'p4_dammam_area2', type: 'Level3' },
  { id: 'p4_dammam_ug_flr1', name: 'Concrete', parentId: 'p4_dammam_sub_bld1', type: 'Level4' },
  { id: 'p4_dammam_ug_flr2', name: 'Finishing', parentId: 'p4_dammam_sub_bld1', type: 'Level4' },
  { id: 'p4_dammam_ug_con_zone1', name: 'Reinforced Concrete', parentId: 'p4_dammam_ug_flr1', type: 'Level5' },
  { id: 'p4_dammam_ug_con_zone2', name: 'Plain Concrete', parentId: 'p4_dammam_ug_flr1', type: 'Level5' },
  { id: 'p4_act_rc_pour_v', name: 'Vertical Elements (Columns): Concrete Pouring', parentId: 'p4_dammam_ug_con_zone1', type: 'Activity', uom: 'm³', totalQty: 12000, universalNorm: 0.4, companyNorm: 0.45, rate: 180 },
  { id: 'p4_act_rc_form_v', name: 'Vertical Elements (Columns): Formwork', parentId: 'p4_dammam_ug_con_zone1', type: 'Activity', uom: 'm²', totalQty: 80000, universalNorm: 1.25, companyNorm: 1.33, rate: 45 },
  { id: 'p4_act_rc_rebar_h', name: 'Horizontal Elements (Slabs): Rebar', parentId: 'p4_dammam_ug_con_zone1', type: 'Activity', uom: 'ton', totalQty: 1500, universalNorm: 0.05, companyNorm: 0.056, rate: 3000 },
  { id: 'p4_act_rc_deshutter_h', name: 'Horizontal Elements (Slabs): Deshuttering', parentId: 'p4_dammam_ug_con_zone1', type: 'Activity', uom: 'm²', totalQty: 80000, universalNorm: 2.5, companyNorm: 2.86, rate: 20 },
  { id: 'p4_khobar_area1', name: 'Substructure', parentId: 'p4_loc2', type: 'Level2' },
  { id: 'p4_khobar_area2', name: 'Superstructure', parentId: 'p4_loc2', type: 'Level2' },
  { id: 'p4_khobar_super_bld1', name: 'Zone 1 to 10', parentId: 'p4_khobar_area2', type: 'Level3' },
  // Adding "None" options for Taawon Project
  { id: 'p4_dammam_area1_none', name: 'None', parentId: 'p4_dammam_area1', type: 'Level3' },
  { id: 'p4_dammam_area1_none_act', name: 'General Works', parentId: 'p4_dammam_area1_none', type: 'Activity', uom: 'LS', totalQty: 1, universalNorm: 1 },
  { id: 'p4_dammam_area2_none', name: 'None', parentId: 'p4_dammam_area2', type: 'Level3' },
  { id: 'p4_dammam_area2_none_act', name: 'General Works', parentId: 'p4_dammam_area2_none', type: 'Activity', uom: 'LS', totalQty: 1, universalNorm: 1 },
  { id: 'p4_khobar_area1_none', name: 'None', parentId: 'p4_khobar_area1', type: 'Level3' },
  { id: 'p4_khobar_area1_none_act', name: 'General Works', parentId: 'p4_khobar_area1_none', type: 'Activity', uom: 'LS', totalQty: 1, universalNorm: 1 },
  { id: 'p4_khobar_area2_none', name: 'None', parentId: 'p4_khobar_area2', type: 'Level3' },
  { id: 'p4_khobar_area2_none_act', name: 'General Works', parentId: 'p4_khobar_area2_none', type: 'Activity', uom: 'LS', totalQty: 1, universalNorm: 1 },
];

// --- PROFESSIONS & DEPARTMENTS ---
export let professions: Profession[] = [
  'Project Manager', 'Site Engineer', 'Surveyor', 'Electrician', 'Plumber',
  'Carpenter', 'Mason', 'Steel Fixer', 'Heavy Equipment Operator', 'General Laborer',
  'Cost Control Section Head'
];

export let departments: Department[] = [
  'Administration',
  'Asset Management',
  'Business Development & Marketing',
  'Commercial',
  'Commissioning & Maintenance',
  'Construction & Field Operations',
  'Core Business Operations',
  'Engineering & Design',
  'Estimating & Cost Planning',
  'Finance & Accounting',
  'Human Resources (HR)',
  'Information Technology (IT)',
  'Legal & Contracts',
  'Logistics & Warehousing',
  'Procurement & Supply Chain',
  'Project Management',
  'Quantity Surveying',
  'Safety & Quality Assurance (QA/QC)',
  'Support Functions',
].sort();

// --- SCOPES ---
export let scopes: string[] = SCOPES;

// --- SUBCONTRACTORS ---
export let subcontractors: Subcontractor[] = [
    { id: 'sub1', name: 'BuildWell Inc.', contactPerson: 'Mr. Smith', email: 'contact@buildwell.com', website: 'buildwell.com', nationality: 'American', scope: 'Civil Works', mainContractorId: null },
    { id: 'sub2', name: 'Spark Electricals', contactPerson: 'Mr. Khan', email: 'admin@spark.com', website: 'spark.com', nationality: 'Indian', scope: 'MEP Works', mainContractorId: 'sub1' },
    { id: 'sub3', name: 'WoodCrafters', contactPerson: 'Mr. Jones', email: 'info@woodcrafters.com', website: 'woodcrafters.com', nationality: 'British', scope: 'Finishing Works', mainContractorId: 'sub1' },
    { id: 'sub4', name: 'General Works Ltd.', contactPerson: 'Mr. Garcia', email: 'gwl@email.com', website: 'gwl.com', nationality: 'Filipino', scope: 'General Contracting', mainContractorId: null },
    { id: 'sub5', name: 'Saudi Bin Ladin Group', contactPerson: 'N/A', email: 'info@sbg.com.sa', website: 'sbg.com.sa', nationality: 'Saudi Arabian', scope: 'General Contracting', mainContractorId: null },
];

// --- EMPLOYEES ---
export let employees: Employee[] = [
    { id: 'e1', empId: 'EMP001', name: 'John Doe', profession: 'Site Engineer', nationality: 'American', idIqama: '1234567890', department: 'Engineering & Design', email: 'j.doe@example.com', phone: '555-0101', type: 'Direct', subcontractor: 'BuildWell Inc.', joiningDate: '2023-01-15', createdBy: 'system', modifiedDate: '2024-05-10', modifiedBy: 'system' },
    { id: 'e2', empId: 'EMP002', name: 'Arjun Kumar', profession: 'Electrician', nationality: 'Indian', idIqama: '2345678901', department: 'Construction & Field Operations', email: 'a.kumar@example.com', phone: '555-0102', type: 'Indirect', subcontractor: 'Spark Electricals', joiningDate: '2023-02-20', createdBy: 'system', modifiedDate: '2024-05-11', modifiedBy: 'system' },
    { id: 'e3', empId: 'EMP003', name: 'Peter Jones', profession: 'Carpenter', nationality: 'British', idIqama: '3456789012', department: 'Construction & Field Operations', email: 'p.jones@example.com', phone: '555-0103', type: 'Direct', subcontractor: 'WoodCrafters', joiningDate: '2023-03-10', createdBy: 'system', modifiedDate: '2024-05-12', modifiedBy: 'system' },
    { id: 'e4', empId: 'EMP004', name: 'M. Ali', profession: 'Mason', nationality: 'Pakistani', idIqama: '4567890123', department: 'Construction & Field Operations', phone: '555-0104', type: 'Indirect', subcontractor: 'BuildWell Inc.', joiningDate: '2023-04-01', createdBy: 'system', modifiedDate: '2024-05-13', modifiedBy: 'system' },
    { id: 'e5', empId: 'EMP005', name: 'Jose Rizal', profession: 'General Laborer', nationality: 'Filipino', idIqama: '5678901234', department: 'Construction & Field Operations', email: 'j.rizal@example.com', phone: '555-0105', type: 'Indirect', subcontractor: 'General Works Ltd.', createdBy: 'system', modifiedDate: '2024-05-14', modifiedBy: 'system' },
    { id: 'e6', empId: '977098', name: 'Mohamed Maged Yassin', profession: 'Cost Control Section Head', nationality: 'Egyptian', idIqama: '6789012345', department: 'Estimating & Cost Planning', email: 'mohamed.yassin@sbg.com.sa', phone: '555-0106', type: 'Direct', subcontractor: 'Saudi Bin Ladin Group', joiningDate: '2022-11-18', createdBy: 'system', modifiedDate: '2024-05-15', modifiedBy: 'system' },
    { id: 'e7', empId: 'EMP007', name: 'Fatima Al-Fassi', profession: 'General Laborer', nationality: 'Saudi Arabian', idIqama: '7890123456', department: 'Construction & Field Operations', email: 'f.alfassi@example.com', phone: '555-0107', type: 'Direct', subcontractor: 'Saudi Bin Ladin Group', joiningDate: '2024-06-01', createdBy: 'system', modifiedDate: '2024-06-01', modifiedBy: 'system' },
    { id: 'e8', empId: 'EMP008', name: 'David Chen', profession: 'Steel Fixer', nationality: 'Canadian', idIqama: '8901234567', department: 'Construction & Field Operations', email: 'd.chen@example.com', phone: '555-0108', type: 'Indirect', subcontractor: 'BuildWell Inc.', joiningDate: '2024-06-05', createdBy: 'system', modifiedDate: '2024-06-05', modifiedBy: 'system' },
    { id: 'e9', empId: 'EMP009', name: 'Omar Ibrahim', profession: 'Carpenter', nationality: 'Egyptian', idIqama: '9012345678', department: 'Construction & Field Operations', email: 'o.ibrahim@example.com', phone: '555-0109', type: 'Indirect', subcontractor: 'WoodCrafters', joiningDate: '2024-06-10', createdBy: 'system', modifiedDate: '2024-06-10', modifiedBy: 'system' },
];

// --- MANPOWER & PROGRESS RECORDS ---
export let records: ManpowerRecord[] = [
  {
    id: 'rec1',
    empId: 'EMP001',
    name: 'John Doe',
    profession: 'Site Engineer',
    project: 'p4_act_rc_form_v', // Remapped
    status: ManpowerStatus.ACTIVE,
    nationality: 'American',
    subcontractor: 'BuildWell Inc.',
    date: new Date().toISOString().split('T')[0],
    hoursWorked: 8,
    shift: Shift.DAY,
  },
  {
    id: 'rec2',
    empId: 'EMP002',
    name: 'Arjun Kumar',
    profession: 'Electrician',
    project: 'p4_act_rc_form_v', // Remapped
    status: ManpowerStatus.ACTIVE,
    nationality: 'Indian',
    subcontractor: 'Spark Electricals',
    date: new Date().toISOString().split('T')[0],
    hoursWorked: 8.5,
    shift: Shift.NIGHT,
  },
  {
    id: 'rec3',
    empId: 'EMP003',
    name: 'Peter Jones',
    profession: 'Carpenter',
    project: 'p4_act_rc_pour_v', // Remapped
    status: ManpowerStatus.ON_LEAVE,
    nationality: 'British',
    subcontractor: 'WoodCrafters',
    date: new Date().toISOString().split('T')[0],
    hoursWorked: 0,
    shift: Shift.DAY,
  },
   {
    id: 'rec4',
    empId: 'EMP004',
    name: 'M. Ali',
    profession: 'Mason',
    project: 'p4_act_rc_pour_v', // Remapped
    status: ManpowerStatus.IDLE,
    nationality: 'Pakistani',
    subcontractor: 'BuildWell Inc.',
    date: new Date().toISOString().split('T')[0],
    hoursWorked: 0,
    shift: Shift.DAY,
  },
  {
    id: 'rec5',
    empId: 'EMP005',
    name: 'Jose Rizal',
    profession: 'General Laborer',
    project: 'p4_act_rc_rebar_h', // Remapped
    status: ManpowerStatus.TRANSFERRED,
    nationality: 'Filipino',
    subcontractor: 'General Works Ltd.',
    date: new Date().toISOString().split('T')[0],
    hoursWorked: 0,
    shift: Shift.DAY,
  },
  // Taawon Project - August Records
  {
    id: 'rec_aug1', empId: 'EMP007', name: 'Fatima Al-Fassi', profession: 'General Laborer',
    project: 'p4_act_rc_pour_v', status: ManpowerStatus.ACTIVE, nationality: 'Saudi Arabian',
    subcontractor: 'Saudi Bin Ladin Group', date: '2024-08-01', hoursWorked: 10, shift: Shift.DAY,
  },
  {
    id: 'rec_aug2', empId: 'EMP008', name: 'David Chen', profession: 'Steel Fixer',
    project: 'p4_act_rc_rebar_h', status: ManpowerStatus.ACTIVE, nationality: 'Canadian',
    subcontractor: 'BuildWell Inc.', date: '2024-08-01', hoursWorked: 9.5, shift: Shift.DAY,
  },
  {
    id: 'rec_aug3', empId: 'EMP009', name: 'Omar Ibrahim', profession: 'Carpenter',
    project: 'p4_act_rc_form_v', status: ManpowerStatus.ACTIVE, nationality: 'Egyptian',
    subcontractor: 'WoodCrafters', date: '2024-08-02', hoursWorked: 8, shift: Shift.DAY,
  },
  {
    id: 'rec_aug4', empId: 'EMP007', name: 'Fatima Al-Fassi', profession: 'General Laborer',
    project: 'p4_act_rc_pour_v', status: ManpowerStatus.ACTIVE, nationality: 'Saudi Arabian',
    subcontractor: 'Saudi Bin Ladin Group', date: '2024-08-02', hoursWorked: 10, shift: Shift.DAY,
  },
  {
    id: 'rec_aug5', empId: 'EMP008', name: 'David Chen', profession: 'Steel Fixer',
    project: 'p4_act_rc_rebar_h', status: ManpowerStatus.IDLE, nationality: 'Canadian',
    subcontractor: 'BuildWell Inc.', date: '2024-08-03', hoursWorked: 0, shift: Shift.DAY,
  },
  // Generated Manpower Data (100 records)
  {id:"rec_taawon_3",empId:"EMP008",name:"David Chen",profession:"Steel Fixer",project:"p4_act_rc_pour_v",status:ManpowerStatus.ACTIVE,nationality:"Canadian",subcontractor:"BuildWell Inc.",date:"2025-08-01",hoursWorked:8.5,shift:Shift.DAY},
  {id:"rec_taawon_4",empId:"EMP007",name:"Fatima Al-Fassi",profession:"General Laborer",project:"p4_act_rc_deshutter_h",status:ManpowerStatus.ACTIVE,nationality:"Saudi Arabian",subcontractor:"Saudi Bin Ladin Group",date:"2025-07-16",hoursWorked:10,shift:Shift.DAY},
  {id:"rec_taawon_5",empId:"EMP008",name:"David Chen",profession:"Steel Fixer",project:"p4_act_rc_deshutter_h",status:ManpowerStatus.ACTIVE,nationality:"Canadian",subcontractor:"BuildWell Inc.",date:"2025-08-02",hoursWorked:9,shift:Shift.DAY},
  {id:"rec_taawon_6",empId:"EMP009",name:"Omar Ibrahim",profession:"Carpenter",project:"p4_act_rc_pour_v",status:ManpowerStatus.ACTIVE,nationality:"Egyptian",subcontractor:"WoodCrafters",date:"2025-07-06",hoursWorked:10,shift:Shift.NIGHT},
  {id:"rec_taawon_9",empId:"977098",name:"Mohamed Maged Yassin",profession:"Cost Control Section Head",project:"p4_act_rc_rebar_h",status:ManpowerStatus.ACTIVE,nationality:"Egyptian",subcontractor:"Saudi Bin Ladin Group",date:"2025-07-29",hoursWorked:8.5,shift:Shift.DAY},
  {id:"rec_taawon_10",empId:"e3",name:"Peter Jones",profession:"Carpenter",project:"p4_act_rc_form_v",status:ManpowerStatus.ACTIVE,nationality:"British",subcontractor:"WoodCrafters",date:"2025-07-03",hoursWorked:9,shift:Shift.DAY},
  {id:"rec_taawon_11",empId:"EMP007",name:"Fatima Al-Fassi",profession:"General Laborer",project:"p4_act_rc_rebar_h",status:ManpowerStatus.ACTIVE,nationality:"Saudi Arabian",subcontractor:"Saudi Bin Ladin Group",date:"2025-07-01",hoursWorked:9,shift:Shift.DAY},
  {id:"rec_taawon_12",empId:"EMP009",name:"Omar Ibrahim",profession:"Carpenter",project:"p4_act_rc_deshutter_h",status:ManpowerStatus.ACTIVE,nationality:"Egyptian",subcontractor:"WoodCrafters",date:"2025-07-28",hoursWorked:8.5,shift:Shift.NIGHT},
  {id:"rec_taawon_13",empId:"EMP007",name:"Fatima Al-Fassi",profession:"General Laborer",project:"p4_act_rc_rebar_h",status:ManpowerStatus.ACTIVE,nationality:"Saudi Arabian",subcontractor:"Saudi Bin Ladin Group",date:"2025-07-16",hoursWorked:11,shift:Shift.DAY},
  {id:"rec_taawon_14",empId:"EMP008",name:"David Chen",profession:"Steel Fixer",project:"p4_act_rc_deshutter_h",status:ManpowerStatus.ACTIVE,nationality:"Canadian",subcontractor:"BuildWell Inc.",date:"2025-08-01",hoursWorked:8,shift:Shift.NIGHT},
  {id:"rec_taawon_16",empId:"977098",name:"Mohamed Maged Yassin",profession:"Cost Control Section Head",project:"p4_act_rc_pour_v",status:ManpowerStatus.ACTIVE,nationality:"Egyptian",subcontractor:"Saudi Bin Ladin Group",date:"2025-08-04",hoursWorked:11,shift:Shift.DAY},
  {id:"rec_taawon_17",empId:"977098",name:"Mohamed Maged Yassin",profession:"Cost Control Section Head",project:"p4_act_rc_rebar_h",status:ManpowerStatus.ACTIVE,nationality:"Egyptian",subcontractor:"Saudi Bin Ladin Group",date:"2025-07-25",hoursWorked:8,shift:Shift.DAY},
  {id:"rec_taawon_18",empId:"e4",name:"M. Ali",profession:"Mason",project:"p4_act_rc_form_v",status:ManpowerStatus.IDLE,nationality:"Pakistani",subcontractor:"BuildWell Inc.",date:"2025-07-01",hoursWorked:0,shift:Shift.NIGHT},
  {id:"rec_taawon_19",empId:"EMP008",name:"David Chen",profession:"Steel Fixer",project:"p4_act_rc_rebar_h",status:ManpowerStatus.ACTIVE,nationality:"Canadian",subcontractor:"BuildWell Inc.",date:"2025-07-24",hoursWorked:10,shift:Shift.NIGHT},
  {id:"rec_taawon_20",empId:"e4",name:"M. Ali",profession:"Mason",project:"p4_act_rc_pour_v",status:ManpowerStatus.ACTIVE,nationality:"Pakistani",subcontractor:"BuildWell Inc.",date:"2025-08-16",hoursWorked:9,shift:Shift.DAY},
  {id:"rec_taawon_21",empId:"e1",name:"John Doe",profession:"Site Engineer",project:"p4_act_rc_deshutter_h",status:ManpowerStatus.ACTIVE,nationality:"American",subcontractor:"BuildWell Inc.",date:"2025-07-22",hoursWorked:8,shift:Shift.DAY},
  {id:"rec_taawon_22",empId:"e4",name:"M. Ali",profession:"Mason",project:"p4_act_rc_rebar_h",status:ManpowerStatus.ACTIVE,nationality:"Pakistani",subcontractor:"BuildWell Inc.",date:"2025-07-16",hoursWorked:10.5,shift:Shift.NIGHT},
  {id:"rec_taawon_23",empId:"EMP009",name:"Omar Ibrahim",profession:"Carpenter",project:"p4_act_rc_rebar_h",status:ManpowerStatus.ACTIVE,nationality:"Egyptian",subcontractor:"WoodCrafters",date:"2025-08-20",hoursWorked:8.5,shift:Shift.NIGHT},
  {id:"rec_taawon_26",empId:"e4",name:"M. Ali",profession:"Mason",project:"p4_act_rc_rebar_h",status:ManpowerStatus.ACTIVE,nationality:"Pakistani",subcontractor:"BuildWell Inc.",date:"2025-07-08",hoursWorked:12,shift:Shift.DAY},
  {id:"rec_taawon_27",empId:"e4",name:"M. Ali",profession:"Mason",project:"p4_act_rc_form_v",status:ManpowerStatus.ACTIVE,nationality:"Pakistani",subcontractor:"BuildWell Inc.",date:"2025-08-01",hoursWorked:9,shift:Shift.DAY},
  {id:"rec_taawon_28",empId:"977098",name:"Mohamed Maged Yassin",profession:"Cost Control Section Head",project:"p4_act_rc_form_v",status:ManpowerStatus.ACTIVE,nationality:"Egyptian",subcontractor:"Saudi Bin Ladin Group",date:"2025-08-14",hoursWorked:10.5,shift:Shift.DAY},
  {id:"rec_taawon_29",empId:"e4",name:"M. Ali",profession:"Mason",project:"p4_act_rc_form_v",status:ManpowerStatus.ACTIVE,nationality:"Pakistani",subcontractor:"BuildWell Inc.",date:"2025-08-02",hoursWorked:8.5,shift:Shift.DAY},
  {id:"rec_taawon_30",empId:"EMP008",name:"David Chen",profession:"Steel Fixer",project:"p4_act_rc_form_v",status:ManpowerStatus.ACTIVE,nationality:"Canadian",subcontractor:"BuildWell Inc.",date:"2025-08-08",hoursWorked:10.5,shift:Shift.DAY},
  {id:"rec_taawon_31",empId:"EMP008",name:"David Chen",profession:"Steel Fixer",project:"p4_act_rc_rebar_h",status:ManpowerStatus.ACTIVE,nationality:"Canadian",subcontractor:"BuildWell Inc.",date:"2025-08-07",hoursWorked:8,shift:Shift.NIGHT},
  {id:"rec_taawon_33",empId:"EMP009",name:"Omar Ibrahim",profession:"Carpenter",project:"p4_act_rc_pour_v",status:ManpowerStatus.ACTIVE,nationality:"Egyptian",subcontractor:"WoodCrafters",date:"2025-08-11",hoursWorked:8,shift:Shift.DAY},
  {id:"rec_taawon_34",empId:"EMP008",name:"David Chen",profession:"Steel Fixer",project:"p4_act_rc_pour_v",status:ManpowerStatus.ACTIVE,nationality:"Canadian",subcontractor:"BuildWell Inc.",date:"2025-08-15",hoursWorked:10,shift:Shift.DAY},
  {id:"rec_taawon_35",empId:"EMP008",name:"David Chen",profession:"Steel Fixer",project:"p4_act_rc_pour_v",status:ManpowerStatus.ACTIVE,nationality:"Canadian",subcontractor:"BuildWell Inc.",date:"2025-07-06",hoursWorked:10.5,shift:Shift.DAY},
  {id:"rec_taawon_36",empId:"EMP007",name:"Fatima Al-Fassi",profession:"General Laborer",project:"p4_act_rc_deshutter_h",status:ManpowerStatus.ACTIVE,nationality:"Saudi Arabian",subcontractor:"Saudi Bin Ladin Group",date:"2025-07-28",hoursWorked:8,shift:Shift.NIGHT},
  {id:"rec_taawon_37",empId:"EMP009",name:"Omar Ibrahim",profession:"Carpenter",project:"p4_act_rc_form_v",status:ManpowerStatus.ACTIVE,nationality:"Egyptian",subcontractor:"WoodCrafters",date:"2025-08-03",hoursWorked:9,shift:Shift.NIGHT},
  {id:"rec_taawon_38",empId:"e3",name:"Peter Jones",profession:"Carpenter",project:"p4_act_rc_form_v",status:ManpowerStatus.ACTIVE,nationality:"British",subcontractor:"WoodCrafters",date:"2025-07-21",hoursWorked:9,shift:Shift.DAY},
  {id:"rec_taawon_39",empId:"e1",name:"John Doe",profession:"Site Engineer",project:"p4_act_rc_rebar_h",status:ManpowerStatus.ACTIVE,nationality:"American",subcontractor:"BuildWell Inc.",date:"2025-07-20",hoursWorked:8.5,shift:Shift.NIGHT},
  {id:"rec_taawon_40",empId:"e4",name:"M. Ali",profession:"Mason",project:"p4_act_rc_form_v",status:ManpowerStatus.ACTIVE,nationality:"Pakistani",subcontractor:"BuildWell Inc.",date:"2025-07-16",hoursWorked:8,shift:Shift.DAY},
  {id:"rec_taawon_42",empId:"e4",name:"M. Ali",profession:"Mason",project:"p4_act_rc_deshutter_h",status:ManpowerStatus.IDLE,nationality:"Pakistani",subcontractor:"BuildWell Inc.",date:"2025-07-13",hoursWorked:0,shift:Shift.DAY},
  {id:"rec_taawon_44",empId:"e3",name:"Peter Jones",profession:"Carpenter",project:"p4_act_rc_deshutter_h",status:ManpowerStatus.ACTIVE,nationality:"British",subcontractor:"WoodCrafters",date:"2025-08-07",hoursWorked:8,shift:Shift.NIGHT},
  {id:"rec_taawon_45",empId:"e4",name:"M. Ali",profession:"Mason",project:"p4_act_rc_pour_v",status:ManpowerStatus.ACTIVE,nationality:"Pakistani",subcontractor:"BuildWell Inc.",date:"2025-08-12",hoursWorked:8.5,shift:Shift.DAY},
  {id:"rec_taawon_46",empId:"e4",name:"M. Ali",profession:"Mason",project:"p4_act_rc_pour_v",status:ManpowerStatus.ACTIVE,nationality:"Pakistani",subcontractor:"BuildWell Inc.",date:"2025-08-20",hoursWorked:10,shift:Shift.NIGHT},
  {id:"rec_taawon_47",empId:"EMP009",name:"Omar Ibrahim",profession:"Carpenter",project:"p4_act_rc_deshutter_h",status:ManpowerStatus.ACTIVE,nationality:"Egyptian",subcontractor:"WoodCrafters",date:"2025-08-05",hoursWorked:9.5,shift:Shift.DAY},
  {id:"rec_taawon_48",empId:"EMP007",name:"Fatima Al-Fassi",profession:"General Laborer",project:"p4_act_rc_rebar_h",status:ManpowerStatus.ACTIVE,nationality:"Saudi Arabian",subcontractor:"Saudi Bin Ladin Group",date:"2025-07-27",hoursWorked:11,shift:Shift.DAY},
  {id:"rec_taawon_49",empId:"e4",name:"M. Ali",profession:"Mason",project:"p4_act_rc_pour_v",status:ManpowerStatus.ACTIVE,nationality:"Pakistani",subcontractor:"BuildWell Inc.",date:"2025-07-16",hoursWorked:9.5,shift:Shift.DAY},
  {id:"rec_taawon_50",empId:"e1",name:"John Doe",profession:"Site Engineer",project:"p4_act_rc_deshutter_h",status:ManpowerStatus.ACTIVE,nationality:"American",subcontractor:"BuildWell Inc.",date:"2025-07-28",hoursWorked:8,shift:Shift.DAY},
  {id:"rec_taawon_51",empId:"EMP008",name:"David Chen",profession:"Steel Fixer",project:"p4_act_rc_rebar_h",status:ManpowerStatus.ACTIVE,nationality:"Canadian",subcontractor:"BuildWell Inc.",date:"2025-07-16",hoursWorked:9,shift:Shift.DAY},
  {id:"rec_taawon_52",empId:"e3",name:"Peter Jones",profession:"Carpenter",project:"p4_act_rc_form_v",status:ManpowerStatus.ACTIVE,nationality:"British",subcontractor:"WoodCrafters",date:"2025-07-06",hoursWorked:10,shift:Shift.DAY},
  {id:"rec_taawon_53",empId:"e3",name:"Peter Jones",profession:"Carpenter",project:"p4_act_rc_deshutter_h",status:ManpowerStatus.ACTIVE,nationality:"British",subcontractor:"WoodCrafters",date:"2025-08-16",hoursWorked:9,shift:Shift.DAY},
  {id:"rec_taawon_54",empId:"e4",name:"M. Ali",profession:"Mason",project:"p4_act_rc_rebar_h",status:ManpowerStatus.ACTIVE,nationality:"Pakistani",subcontractor:"BuildWell Inc.",date:"2025-07-06",hoursWorked:9,shift:Shift.NIGHT},
  {id:"rec_taawon_55",empId:"e4",name:"M. Ali",profession:"Mason",project:"p4_act_rc_deshutter_h",status:ManpowerStatus.ACTIVE,nationality:"Pakistani",subcontractor:"BuildWell Inc.",date:"2025-07-25",hoursWorked:10,shift:Shift.DAY},
  {id:"rec_taawon_56",empId:"EMP009",name:"Omar Ibrahim",profession:"Carpenter",project:"p4_act_rc_rebar_h",status:ManpowerStatus.ACTIVE,nationality:"Egyptian",subcontractor:"WoodCrafters",date:"2025-08-13",hoursWorked:11.5,shift:Shift.NIGHT},
  {id:"rec_taawon_57",empId:"e4",name:"M. Ali",profession:"Mason",project:"p4_act_rc_form_v",status:ManpowerStatus.ACTIVE,nationality:"Pakistani",subcontractor:"BuildWell Inc.",date:"2025-07-19",hoursWorked:8.5,shift:Shift.DAY},
  {id:"rec_taawon_58",empId:"e3",name:"Peter Jones",profession:"Carpenter",project:"p4_act_rc_form_v",status:ManpowerStatus.ACTIVE,nationality:"British",subcontractor:"WoodCrafters",date:"2025-08-01",hoursWorked:9.5,shift:Shift.DAY},
  {id:"rec_taawon_59",empId:"977098",name:"Mohamed Maged Yassin",profession:"Cost Control Section Head",project:"p4_act_rc_pour_v",status:ManpowerStatus.ACTIVE,nationality:"Egyptian",subcontractor:"Saudi Bin Ladin Group",date:"2025-08-13",hoursWorked:12,shift:Shift.NIGHT},
  {id:"rec_taawon_60",empId:"e1",name:"John Doe",profession:"Site Engineer",project:"p4_act_rc_pour_v",status:ManpowerStatus.ACTIVE,nationality:"American",subcontractor:"BuildWell Inc.",date:"2025-07-05",hoursWorked:10.5,shift:Shift.NIGHT},
  {id:"rec_taawon_61",empId:"EMP009",name:"Omar Ibrahim",profession:"Carpenter",project:"p4_act_rc_deshutter_h",status:ManpowerStatus.ACTIVE,nationality:"Egyptian",subcontractor:"WoodCrafters",date:"2025-08-10",hoursWorked:11.5,shift:Shift.DAY},
  {id:"rec_taawon_62",empId:"e4",name:"M. Ali",profession:"Mason",project:"p4_act_rc_pour_v",status:ManpowerStatus.ACTIVE,nationality:"Pakistani",subcontractor:"BuildWell Inc.",date:"2025-07-20",hoursWorked:8.5,shift:Shift.NIGHT},
  {id:"rec_taawon_64",empId:"977098",name:"Mohamed Maged Yassin",profession:"Cost Control Section Head",project:"p4_act_rc_form_v",status:ManpowerStatus.ACTIVE,nationality:"Egyptian",subcontractor:"Saudi Bin Ladin Group",date:"2025-07-16",hoursWorked:8.5,shift:Shift.DAY},
  {id:"rec_taawon_66",empId:"e1",name:"John Doe",profession:"Site Engineer",project:"p4_act_rc_form_v",status:ManpowerStatus.ACTIVE,nationality:"American",subcontractor:"BuildWell Inc.",date:"2025-07-23",hoursWorked:9,shift:Shift.DAY},
  {id:"rec_taawon_67",empId:"977098",name:"Mohamed Maged Yassin",profession:"Cost Control Section Head",project:"p4_act_rc_pour_v",status:ManpowerStatus.ACTIVE,nationality:"Egyptian",subcontractor:"Saudi Bin Ladin Group",date:"2025-07-27",hoursWorked:11,shift:Shift.NIGHT},
  {id:"rec_taawon_68",empId:"EMP009",name:"Omar Ibrahim",profession:"Carpenter",project:"p4_act_rc_pour_v",status:ManpowerStatus.ACTIVE,nationality:"Egyptian",subcontractor:"WoodCrafters",date:"2025-08-18",hoursWorked:10,shift:Shift.NIGHT},
  {id:"rec_taawon_69",empId:"e1",name:"John Doe",profession:"Site Engineer",project:"p4_act_rc_pour_v",status:ManpowerStatus.ACTIVE,nationality:"American",subcontractor:"BuildWell Inc.",date:"2025-08-01",hoursWorked:12,shift:Shift.DAY},
  {id:"rec_taawon_71",empId:"e3",name:"Peter Jones",profession:"Carpenter",project:"p4_act_rc_rebar_h",status:ManpowerStatus.ACTIVE,nationality:"British",subcontractor:"WoodCrafters",date:"2025-07-07",hoursWorked:11,shift:Shift.DAY},
  {id:"rec_taawon_73",empId:"977098",name:"Mohamed Maged Yassin",profession:"Cost Control Section Head",project:"p4_act_rc_rebar_h",status:ManpowerStatus.ACTIVE,nationality:"Egyptian",subcontractor:"Saudi Bin Ladin Group",date:"2025-08-05",hoursWorked:8,shift:Shift.NIGHT},
  {id:"rec_taawon_74",empId:"e3",name:"Peter Jones",profession:"Carpenter",project:"p4_act_rc_rebar_h",status:ManpowerStatus.ACTIVE,nationality:"British",subcontractor:"WoodCrafters",date:"2025-08-06",hoursWorked:9,shift:Shift.DAY},
  {id:"rec_taawon_75",empId:"EMP007",name:"Fatima Al-Fassi",profession:"General Laborer",project:"p4_act_rc_form_v",status:ManpowerStatus.ACTIVE,nationality:"Saudi Arabian",subcontractor:"Saudi Bin Ladin Group",date:"2025-08-16",hoursWorked:10,shift:Shift.NIGHT},
  {id:"rec_taawon_76",empId:"EMP007",name:"Fatima Al-Fassi",profession:"General Laborer",project:"p4_act_rc_pour_v",status:ManpowerStatus.ACTIVE,nationality:"Saudi Arabian",subcontractor:"Saudi Bin Ladin Group",date:"2025-07-16",hoursWorked:9.5,shift:Shift.DAY},
  {id:"rec_taawon_77",empId:"EMP008",name:"David Chen",profession:"Steel Fixer",project:"p4_act_rc_deshutter_h",status:ManpowerStatus.ON_LEAVE,nationality:"Canadian",subcontractor:"BuildWell Inc.",date:"2025-08-17",hoursWorked:0,shift:Shift.DAY},
  {id:"rec_taawon_80",empId:"e4",name:"M. Ali",profession:"Mason",project:"p4_act_rc_pour_v",status:ManpowerStatus.ACTIVE,nationality:"Pakistani",subcontractor:"BuildWell Inc.",date:"2025-08-01",hoursWorked:11,shift:Shift.DAY},
  {id:"rec_taawon_81",empId:"e3",name:"Peter Jones",profession:"Carpenter",project:"p4_act_rc_rebar_h",status:ManpowerStatus.ACTIVE,nationality:"British",subcontractor:"WoodCrafters",date:"2025-08-09",hoursWorked:8.5,shift:Shift.DAY},
  {id:"rec_taawon_82",empId:"977098",name:"Mohamed Maged Yassin",profession:"Cost Control Section Head",project:"p4_act_rc_rebar_h",status:ManpowerStatus.ACTIVE,nationality:"Egyptian",subcontractor:"Saudi Bin Ladin Group",date:"2025-07-06",hoursWorked:10,shift:Shift.NIGHT},
  {id:"rec_taawon_83",empId:"EMP007",name:"Fatima Al-Fassi",profession:"General Laborer",project:"p4_act_rc_form_v",status:ManpowerStatus.ACTIVE,nationality:"Saudi Arabian",subcontractor:"Saudi Bin Ladin Group",date:"2025-08-11",hoursWorked:8.5,shift:Shift.DAY},
  {id:"rec_taawon_84",empId:"e1",name:"John Doe",profession:"Site Engineer",project:"p4_act_rc_pour_v",status:ManpowerStatus.ACTIVE,nationality:"American",subcontractor:"BuildWell Inc.",date:"2025-07-24",hoursWorked:11.5,shift:Shift.DAY},
  {id:"rec_taawon_85",empId:"e1",name:"John Doe",profession:"Site Engineer",project:"p4_act_rc_pour_v",status:ManpowerStatus.ACTIVE,nationality:"American",subcontractor:"BuildWell Inc.",date:"2025-08-16",hoursWorked:9,shift:Shift.DAY},
  {id:"rec_taawon_86",empId:"e4",name:"M. Ali",profession:"Mason",project:"p4_act_rc_rebar_h",status:ManpowerStatus.ACTIVE,nationality:"Pakistani",subcontractor:"BuildWell Inc.",date:"2025-07-10",hoursWorked:9,shift:Shift.DAY},
  {id:"rec_taawon_87",empId:"e3",name:"Peter Jones",profession:"Carpenter",project:"p4_act_rc_pour_v",status:ManpowerStatus.ACTIVE,nationality:"British",subcontractor:"WoodCrafters",date:"2025-07-28",hoursWorked:11,shift:Shift.NIGHT},
  {id:"rec_taawon_88",empId:"e4",name:"M. Ali",profession:"Mason",project:"p4_act_rc_form_v",status:ManpowerStatus.ACTIVE,nationality:"Pakistani",subcontractor:"BuildWell Inc.",date:"2025-08-20",hoursWorked:11,shift:Shift.DAY},
  {id:"rec_taawon_90",empId:"EMP007",name:"Fatima Al-Fassi",profession:"General Laborer",project:"p4_act_rc_form_v",status:ManpowerStatus.ACTIVE,nationality:"Saudi Arabian",subcontractor:"Saudi Bin Ladin Group",date:"2025-08-19",hoursWorked:9,shift:Shift.DAY},
  {id:"rec_taawon_92",empId:"977098",name:"Mohamed Maged Yassin",profession:"Cost Control Section Head",project:"p4_act_rc_pour_v",status:ManpowerStatus.ACTIVE,nationality:"Egyptian",subcontractor:"Saudi Bin Ladin Group",date:"2025-07-26",hoursWorked:8.5,shift:Shift.DAY},
  {id:"rec_taawon_93",empId:"EMP008",name:"David Chen",profession:"Steel Fixer",project:"p4_act_rc_rebar_h",status:ManpowerStatus.ACTIVE,nationality:"Canadian",subcontractor:"BuildWell Inc.",date:"2025-07-06",hoursWorked:8.5,shift:Shift.DAY},
  {id:"rec_taawon_94",empId:"e3",name:"Peter Jones",profession:"Carpenter",project:"p4_act_rc_deshutter_h",status:ManpowerStatus.ACTIVE,nationality:"British",subcontractor:"WoodCrafters",date:"2025-07-13",hoursWorked:10,shift:Shift.NIGHT},
  {id:"rec_taawon_95",empId:"EMP007",name:"Fatima Al-Fassi",profession:"General Laborer",project:"p4_act_rc_form_v",status:ManpowerStatus.ACTIVE,nationality:"Saudi Arabian",subcontractor:"Saudi Bin Ladin Group",date:"2025-07-16",hoursWorked:9,shift:Shift.DAY},
  {id:"rec_taawon_96",empId:"EMP008",name:"David Chen",profession:"Steel Fixer",project:"p4_act_rc_deshutter_h",status:ManpowerStatus.ACTIVE,nationality:"Canadian",subcontractor:"BuildWell Inc.",date:"2025-07-09",hoursWorked:9.5,shift:Shift.NIGHT},
  {id:"rec_taawon_98",empId:"EMP009",name:"Omar Ibrahim",profession:"Carpenter",project:"p4_act_rc_form_v",status:ManpowerStatus.ACTIVE,nationality:"Egyptian",subcontractor:"WoodCrafters",date:"2025-08-16",hoursWorked:11,shift:Shift.DAY},
  {id:"rec_taawon_99",empId:"EMP008",name:"David Chen",profession:"Steel Fixer",project:"p4_act_rc_rebar_h",status:ManpowerStatus.ACTIVE,nationality:"Canadian",subcontractor:"BuildWell Inc.",date:"2025-07-28",hoursWorked:11.5,shift:Shift.DAY},
  {id:"rec_taawon_100",empId:"EMP007",name:"Fatima Al-Fassi",profession:"General Laborer",project:"p4_act_rc_deshutter_h",status:ManpowerStatus.ACTIVE,nationality:"Saudi Arabian",subcontractor:"Saudi Bin Ladin Group",date:"2025-07-26",hoursWorked:11,shift:Shift.DAY},
];

export let progressRecords: ProgressRecord[] = [
    // Progress for Taawon Project (qty is daily progress)
    { id: 'prog1', activityId: 'p4_act_rc_form_v', date: '2024-08-01', qty: 500 },
    { id: 'prog2', activityId: 'p4_act_rc_form_v', date: '2024-08-02', qty: 650 },
    { id: 'prog3', activityId: 'p4_act_rc_form_v', date: '2024-08-03', qty: 550 },
    { id: 'prog4', activityId: 'p4_act_rc_rebar_h', date: '2024-08-01', qty: 10 },
    { id: 'prog5', activityId: 'p4_act_rc_rebar_h', date: '2024-08-02', qty: 12 },
    { id: 'prog6', activityId: 'p4_act_rc_pour_v', date: '2024-08-03', qty: 80 },
    { id: 'prog7', activityId: 'p4_act_rc_pour_v', date: '2024-08-04', qty: 120 },
    // Generated Progress Records (300 records)
    {id:"prog_taawon_0",activityId:"p4_act_rc_rebar_h",date:"2025-07-01",qty:12.78},
    {id:"prog_taawon_1",activityId:"p4_act_rc_deshutter_h",date:"2025-07-01",qty:435.53},
    {id:"prog_taawon_2",activityId:"p4_act_rc_form_v",date:"2025-07-01",qty:415.82},
    {id:"prog_taawon_3",activityId:"p4_act_rc_deshutter_h",date:"2025-07-01",qty:362.46},
    {id:"prog_taawon_4",activityId:"p4_act_rc_rebar_h",date:"2025-07-01",qty:7.83},
    {id:"prog_taawon_5",activityId:"p4_act_rc_rebar_h",date:"2025-07-02",qty:14.48},
    {id:"prog_taawon_6",activityId:"p4_act_rc_deshutter_h",date:"2025-07-02",qty:344.25},
    {id:"prog_taawon_7",activityId:"p4_act_rc_form_v",date:"2025-07-02",qty:488.94},
    {id:"prog_taawon_8",activityId:"p4_act_rc_rebar_h",date:"2025-07-02",qty:14.05},
    {id:"prog_taawon_9",activityId:"p4_act_rc_deshutter_h",date:"2025-07-02",qty:261.35},
    {id:"prog_taawon_10",activityId:"p4_act_rc_pour_v",date:"2025-07-03",qty:148.88},
    {id:"prog_taawon_11",activityId:"p4_act_rc_deshutter_h",date:"2025-07-03",qty:498.81},
    {id:"prog_taawon_12",activityId:"p4_act_rc_deshutter_h",date:"2025-07-03",qty:353.94},
    {id:"prog_taawon_13",activityId:"p4_act_rc_form_v",date:"2025-07-03",qty:338.83},
    {id:"prog_taawon_14",activityId:"p4_act_rc_rebar_h",date:"2025-07-03",qty:5.26},
    {id:"prog_taawon_15",activityId:"p4_act_rc_form_v",date:"2025-07-04",qty:490.87},
    {id:"prog_taawon_16",activityId:"p4_act_rc_deshutter_h",date:"2025-07-04",qty:395.29},
    {id:"prog_taawon_17",activityId:"p4_act_rc_pour_v",date:"2025-07-04",qty:141.5},
    {id:"prog_taawon_18",activityId:"p4_act_rc_deshutter_h",date:"2025-07-04",qty:281.42},
    {id:"prog_taawon_19",activityId:"p4_act_rc_pour_v",date:"2025-07-04",qty:80.39},
    {id:"prog_taawon_20",activityId:"p4_act_rc_rebar_h",date:"2025-07-05",qty:11.83},
    {id:"prog_taawon_21",activityId:"p4_act_rc_pour_v",date:"2025-07-05",qty:104.14},
    {id:"prog_taawon_22",activityId:"p4_act_rc_form_v",date:"2025-07-05",qty:334.34},
    {id:"prog_taawon_23",activityId:"p4_act_rc_pour_v",date:"2025-07-05",qty:143.03},
    {id:"prog_taawon_24",activityId:"p4_act_rc_deshutter_h",date:"2025-07-05",qty:360.27},
    {id:"prog_taawon_25",activityId:"p4_act_rc_form_v",date:"2025-07-06",qty:212.87},
    {id:"prog_taawon_26",activityId:"p4_act_rc_form_v",date:"2025-07-06",qty:404.19},
    {id:"prog_taawon_27",activityId:"p4_act_rc_pour_v",date:"2025-07-06",qty:146.42},
    {id:"prog_taawon_28",activityId:"p4_act_rc_pour_v",date:"2025-07-06",qty:145.41},
    {id:"prog_taawon_29",activityId:"p4_act_rc_rebar_h",date:"2025-07-06",qty:11.97},
    {id:"prog_taawon_30",activityId:"p4_act_rc_deshutter_h",date:"2025-07-07",qty:498.54},
    {id:"prog_taawon_31",activityId:"p4_act_rc_form_v",date:"2025-07-07",qty:313.34},
    {id:"prog_taawon_32",activityId:"p4_act_rc_form_v",date:"2025-07-07",qty:260.1},
    {id:"prog_taawon_33",activityId:"p4_act_rc_rebar_h",date:"2025-07-07",qty:11.72},
    {id:"prog_taawon_34",activityId:"p4_act_rc_deshutter_h",date:"2025-07-07",qty:281.8},
    {id:"prog_taawon_35",activityId:"p4_act_rc_deshutter_h",date:"2025-07-08",qty:332.22},
    {id:"prog_taawon_36",activityId:"p4_act_rc_deshutter_h",date:"2025-07-08",qty:442.27},
    {id:"prog_taawon_37",activityId:"p4_act_rc_pour_v",date:"2025-07-08",qty:104.47},
    {id:"prog_taawon_38",activityId:"p4_act_rc_pour_v",date:"2025-07-08",qty:87.58},
    {id:"prog_taawon_39",activityId:"p4_act_rc_deshutter_h",date:"2025-07-09",qty:290.01},
    {id:"prog_taawon_40",activityId:"p4_act_rc_form_v",date:"2025-07-09",qty:474.34},
    {id:"prog_taawon_41",activityId:"p4_act_rc_rebar_h",date:"2025-07-09",qty:14.48},
    {id:"prog_taawon_42",activityId:"p4_act_rc_deshutter_h",date:"2025-07-09",qty:316.51},
    {id:"prog_taawon_43",activityId:"p4_act_rc_pour_v",date:"2025-07-09",qty:145.21},
    {id:"prog_taawon_44",activityId:"p4_act_rc_form_v",date:"2025-07-10",qty:437.38},
    {id:"prog_taawon_45",activityId:"p4_act_rc_rebar_h",date:"2025-07-10",qty:8.03},
    {id:"prog_taawon_46",activityId:"p4_act_rc_deshutter_h",date:"2025-07-10",qty:435.59},
    {id:"prog_taawon_47",activityId:"p4_act_rc_rebar_h",date:"2025-07-10",qty:14.54},
    {id:"prog_taawon_48",activityId:"p4_act_rc_form_v",date:"2025-07-10",qty:230.79},
    {id:"prog_taawon_49",activityId:"p4_act_rc_pour_v",date:"2025-07-11",qty:63.85},
    {id:"prog_taawon_50",activityId:"p4_act_rc_form_v",date:"2025-07-11",qty:456.96},
    {id:"prog_taawon_51",activityId:"p4_act_rc_deshutter_h",date:"2025-07-11",qty:294.02},
    {id:"prog_taawon_52",activityId:"p4_act_rc_form_v",date:"2025-07-11",qty:427.63},
    {id:"prog_taawon_53",activityId:"p4_act_rc_pour_v",date:"2025-07-12",qty:120.3},
    {id:"prog_taawon_54",activityId:"p4_act_rc_form_v",date:"2025-07-12",qty:255.8},
    {id:"prog_taawon_55",activityId:"p4_act_rc_pour_v",date:"2025-07-12",qty:114.39},
    {id:"prog_taawon_56",activityId:"p4_act_rc_rebar_h",date:"2025-07-12",qty:7.04},
    {id:"prog_taawon_57",activityId:"p4_act_rc_pour_v",date:"2025-07-12",qty:66.69},
    {id:"prog_taawon_58",activityId:"p4_act_rc_pour_v",date:"2025-07-13",qty:116.33},
    {id:"prog_taawon_59",activityId:"p4_act_rc_deshutter_h",date:"2025-07-13",qty:328.61},
    {id:"prog_taawon_60",activityId:"p4_act_rc_deshutter_h",date:"2025-07-13",qty:390.43},
    {id:"prog_taawon_61",activityId:"p4_act_rc_deshutter_h",date:"2025-07-13",qty:368.64},
    {id:"prog_taawon_62",activityId:"p4_act_rc_pour_v",date:"2025-07-13",qty:71.91},
    {id:"prog_taawon_63",activityId:"p4_act_rc_pour_v",date:"2025-07-14",qty:121.72},
    {id:"prog_taawon_64",activityId:"p4_act_rc_rebar_h",date:"2025-07-14",qty:12.79},
    {id:"prog_taawon_65",activityId:"p4_act_rc_rebar_h",date:"2025-07-14",qty:10.63},
    {id:"prog_taawon_66",activityId:"p4_act_rc_rebar_h",date:"2025-07-14",qty:6.96},
    {id:"prog_taawon_67",activityId:"p4_act_rc_rebar_h",date:"2025-07-14",qty:14.3},
    {id:"prog_taawon_68",activityId:"p4_act_rc_rebar_h",date:"2025-07-15",qty:9.74},
    {id:"prog_taawon_69",activityId:"p4_act_rc_rebar_h",date:"2025-07-15",qty:12.18},
    {id:"prog_taawon_70",activityId:"p4_act_rc_pour_v",date:"2025-07-15",qty:125.86},
    {id:"prog_taawon_71",activityId:"p4_act_rc_deshutter_h",date:"2025-07-15",qty:261.27},
    {id:"prog_taawon_72",activityId:"p4_act_rc_form_v",date:"2025-07-15",qty:317.8},
    {id:"prog_taawon_73",activityId:"p4_act_rc_pour_v",date:"2025-07-16",qty:50.81},
    {id:"prog_taawon_74",activityId:"p4_act_rc_rebar_h",date:"2025-07-16",qty:8.01},
    {id:"prog_taawon_75",activityId:"p4_act_rc_deshutter_h",date:"2025-07-16",qty:376.54},
    {id:"prog_taawon_76",activityId:"p4_act_rc_rebar_h",date:"2025-07-16",qty:8.99},
    {id:"prog_taawon_77",activityId:"p4_act_rc_form_v",date:"2025-07-17",qty:377.72},
    {id:"prog_taawon_78",activityId:"p4_act_rc_deshutter_h",date:"2025-07-17",qty:384.4},
    {id:"prog_taawon_79",activityId:"p4_act_rc_pour_v",date:"2025-07-17",qty:145.41},
    {id:"prog_taawon_80",activityId:"p4_act_rc_rebar_h",date:"2025-07-17",qty:12.7},
    {id:"prog_taawon_81",activityId:"p4_act_rc_deshutter_h",date:"2025-07-17",qty:245.89},
    {id:"prog_taawon_82",activityId:"p4_act_rc_pour_v",date:"2025-07-18",qty:76.99},
    {id:"prog_taawon_83",activityId:"p4_act_rc_pour_v",date:"2025-07-18",qty:104.97},
    {id:"prog_taawon_84",activityId:"p4_act_rc_rebar_h",date:"2025-07-18",qty:11.75},
    {id:"prog_taawon_85",activityId:"p4_act_rc_deshutter_h",date:"2025-07-18",qty:260.67},
    {id:"prog_taawon_86",activityId:"p4_act_rc_deshutter_h",date:"2025-07-18",qty:331.4},
    {id:"prog_taawon_87",activityId:"p4_act_rc_pour_v",date:"2025-07-19",qty:68.7},
    {id:"prog_taawon_88",activityId:"p4_act_rc_pour_v",date:"2025-07-19",qty:93.47},
    {id:"prog_taawon_89",activityId:"p4_act_rc_form_v",date:"2025-07-19",qty:498.4},
    {id:"prog_taawon_90",activityId:"p4_act_rc_form_v",date:"2025-07-19",qty:344.25},
    {id:"prog_taawon_91",activityId:"p4_act_rc_deshutter_h",date:"2025-07-19",qty:435.53},
    {id:"prog_taawon_92",activityId:"p4_act_rc_deshutter_h",date:"2025-07-20",qty:459.74},
    {id:"prog_taawon_93",activityId:"p4_act_rc_rebar_h",date:"2025-07-20",qty:7.01},
    {id:"prog_taawon_94",activityId:"p4_act_rc_pour_v",date:"2025-07-20",qty:140.73},
    {id:"prog_taawon_95",activityId:"p4_act_rc_form_v",date:"2025-07-20",qty:402.73},
    {id:"prog_taawon_96",activityId:"p4_act_rc_pour_v",date:"2025-07-20",qty:118.8},
    {id:"prog_taawon_97",activityId:"p4_act_rc_rebar_h",date:"2025-07-21",qty:10.97},
    {id:"prog_taawon_98",activityId:"p4_act_rc_deshutter_h",date:"2025-07-21",qty:456.91},
    {id:"prog_taawon_99",activityId:"p4_act_rc_form_v",date:"2025-07-21",qty:355.77},
    {id:"prog_taawon_100",activityId:"p4_act_rc_form_v",date:"2025-07-21",qty:499.71},
    {id:"prog_taawon_101",activityId:"p4_act_rc_rebar_h",date:"2025-07-21",qty:5.15},
    {id:"prog_taawon_102",activityId:"p4_act_rc_rebar_h",date:"2025-07-22",qty:10.66},
    {id:"prog_taawon_103",activityId:"p4_act_rc_pour_v",date:"2025-07-22",qty:132.32},
    {id:"prog_taawon_104",activityId:"p4_act_rc_pour_v",date:"2025-07-22",qty:93.9},
    {id:"prog_taawon_105",activityId:"p4_act_rc_rebar_h",date:"2025-07-22",qty:11.75},
    {id:"prog_taawon_106",activityId:"p4_act_rc_deshutter_h",date:"2025-07-23",qty:325.29},
    {id:"prog_taawon_107",activityId:"p4_act_rc_form_v",date:"2025-07-23",qty:360.29},
    {id:"prog_taawon_108",activityId:"p4_act_rc_pour_v",date:"2025-07-23",qty:113.84},
    {id:"prog_taawon_109",activityId:"p4_act_rc_form_v",date:"2025-07-23",qty:355.85},
    {id:"prog_taawon_110",activityId:"p4_act_rc_form_v",date:"2025-07-23",qty:493.59},
    {id:"prog_taawon_111",activityId:"p4_act_rc_rebar_h",date:"2025-07-24",qty:11.75},
    {id:"prog_taawon_112",activityId:"p4_act_rc_form_v",date:"2025-07-24",qty:328.71},
    {id:"prog_taawon_113",activityId:"p4_act_rc_form_v",date:"2025-07-24",qty:437.28},
    {id:"prog_taawon_114",activityId:"p4_act_rc_form_v",date:"2025-07-24",qty:260.62},
    {id:"prog_taawon_115",activityId:"p4_act_rc_form_v",date:"2025-07-24",qty:395.03},
    {id:"prog_taawon_116",activityId:"p4_act_rc_pour_v",date:"2025-07-25",qty:66.69},
    {id:"prog_taawon_117",activityId:"p4_act_rc_pour_v",date:"2025-07-25",qty:93.44},
    {id:"prog_taawon_118",activityId:"p4_act_rc_rebar_h",date:"2025-07-25",qty:9.19},
    {id:"prog_taawon_119",activityId:"p4_act_rc_rebar_h",date:"2025-07-25",qty:10.37},
    {id:"prog_taawon_120",activityId:"p4_act_rc_form_v",date:"2025-07-25",qty:376.54},
    {id:"prog_taawon_121",activityId:"p4_act_rc_deshutter_h",date:"2025-07-26",qty:235.8},
    {id:"prog_taawon_122",activityId:"p4_act_rc_rebar_h",date:"2025-07-26",qty:14.45},
    {id:"prog_taawon_123",activityId:"p4_act_rc_form_v",date:"2025-07-26",qty:284.14},
    {id:"prog_taawon_124",activityId:"p4_act_rc_deshutter_h",date:"2025-07-26",qty:427.36},
    {id:"prog_taawon_125",activityId:"p4_act_rc_deshutter_h",date:"2025-07-26",qty:302.43},
    {id:"prog_taawon_126",activityId:"p4_act_rc_pour_v",date:"2025-07-27",qty:141.06},
    {id:"prog_taawon_127",activityId:"p4_act_rc_deshutter_h",date:"2025-07-27",qty:356.92},
    {id:"prog_taawon_128",activityId:"p4_act_rc_pour_v",date:"2025-07-27",qty:88.75},
    {id:"prog_taawon_129",activityId:"p4_act_rc_pour_v",date:"2025-07-27",qty:53.7},
    {id:"prog_taawon_130",activityId:"p4_act_rc_deshutter_h",date:"2025-07-27",qty:257.47},
    {id:"prog_taawon_131",activityId:"p4_act_rc_deshutter_h",date:"2025-07-28",qty:372.58},
    {id:"prog_taawon_132",activityId:"p4_act_rc_pour_v",date:"2025-07-28",qty:114.39},
    {id:"prog_taawon_133",activityId:"p4_act_rc_pour_v",date:"2025-07-28",qty:56.55},
    {id:"prog_taawon_134",activityId:"p4_act_rc_rebar_h",date:"2025-07-28",qty:6.31},
    {id:"prog_taawon_135",activityId:"p4_act_rc_deshutter_h",date:"2025-07-28",qty:232.06},
    {id:"prog_taawon_136",activityId:"p4_act_rc_form_v",date:"2025-07-29",qty:212.86},
    {id:"prog_taawon_137",activityId:"p4_act_rc_form_v",date:"2025-07-29",qty:499.72},
    {id:"prog_taawon_138",activityId:"p4_act_rc_form_v",date:"2025-07-29",qty:404.14},
    {id:"prog_taawon_139",activityId:"p4_act_rc_deshutter_h",date:"2025-07-29",qty:357.25},
    {id:"prog_taawon_140",activityId:"p4_act_rc_rebar_h",date:"2025-07-30",qty:6.05},
    {id:"prog_taawon_141",activityId:"p4_act_rc_deshutter_h",date:"2025-07-30",qty:281.38},
    {id:"prog_taawon_142",activityId:"p4_act_rc_deshutter_h",date:"2025-07-30",qty:384.44},
    {id:"prog_taawon_143",activityId:"p4_act_rc_pour_v",date:"2025-07-30",qty:129.56},
    {id:"prog_taawon_144",activityId:"p4_act_rc_rebar_h",date:"2025-07-30",qty:12.79},
    {id:"prog_taawon_145",activityId:"p4_act_rc_form_v",date:"2025-07-31",qty:356.59},
    {id:"prog_taawon_146",activityId:"p4_act_rc_form_v",date:"2025-07-31",qty:440.35},
    {id:"prog_taawon_147",activityId:"p4_act_rc_form_v",date:"2025-07-31",qty:360.29},
    {id:"prog_taawon_148",activityId:"p4_act_rc_deshutter_h",date:"2025-07-31",qty:475.29},
    {id:"prog_taawon_149",activityId:"p4_act_rc_rebar_h",date:"2025-07-31",qty:7.77},
    {id:"prog_taawon_150",activityId:"p4_act_rc_pour_v",date:"2025-08-01",qty:93.44},
    {id:"prog_taawon_151",activityId:"p4_act_rc_deshutter_h",date:"2025-08-01",qty:382.72},
    {id:"prog_taawon_152",activityId:"p4_act_rc_form_v",date:"2025-08-01",qty:317.8},
    {id:"prog_taawon_153",activityId:"p4_act_rc_rebar_h",date:"2025-08-01",qty:13.79},
    {id:"prog_taawon_154",activityId:"p4_act_rc_rebar_h",date:"2025-08-01",qty:6.96},
    {id:"prog_taawon_155",activityId:"p4_act_rc_pour_v",date:"2025-08-02",qty:129.56},
    {id:"prog_taawon_156",activityId:"p4_act_rc_deshutter_h",date:"2025-08-02",qty:260.67},
    {id:"prog_taawon_157",activityId:"p4_act_rc_rebar_h",date:"2025-08-02",qty:14.05},
    {id:"prog_taawon_158",activityId:"p4_act_rc_form_v",date:"2025-08-02",qty:328.71},
    {id:"prog_taawon_159",activityId:"p4_act_rc_rebar_h",date:"2025-08-02",qty:11.83},
    {id:"prog_taawon_160",activityId:"p4_act_rc_pour_v",date:"2025-08-03",qty:88.75},
    {id:"prog_taawon_161",activityId:"p4_act_rc_form_v",date:"2025-08-03",qty:376.54},
    {id:"prog_taawon_162",activityId:"p4_act_rc_form_v",date:"2025-08-03",qty:498.4},
    {id:"prog_taawon_163",activityId:"p4_act_rc_rebar_h",date:"2025-08-03",qty:14.48},
    {id:"prog_taawon_164",activityId:"p4_act_rc_pour_v",date:"2025-08-04",qty:104.97},
    {id:"prog_taawon_165",activityId:"p4_act_rc_form_v",date:"2025-08-04",qty:355.77},
    {id:"prog_taawon_166",activityId:"p4_act_rc_form_v",date:"2025-08-04",qty:437.38},
    {id:"prog_taawon_167",activityId:"p4_act_rc_pour_v",date:"2025-08-04",qty:146.42},
    {id:"prog_taawon_168",activityId:"p4_act_rc_rebar_h",date:"2025-08-04",qty:11.97},
    {id:"prog_taawon_169",activityId:"p4_act_rc_pour_v",date:"2025-08-05",qty:141.06},
    {id:"prog_taawon_170",activityId:"p4_act_rc_deshutter_h",date:"2025-08-05",qty:360.27},
    {id:"prog_taawon_171",activityId:"p4_act_rc_rebar_h",date:"2025-08-05",qty:14.3},
    {id:"prog_taawon_172",activityId:"p4_act_rc_pour_v",date:"2025-08-05",qty:104.14},
    {id:"prog_taawon_173",activityId:"p4_act_rc_deshutter_h",date:"2025-08-05",qty:390.43},
    {id:"prog_taawon_174",activityId:"p4_act_rc_pour_v",date:"2025-08-06",qty:145.41},
    {id:"prog_taawon_175",activityId:"p4_act_rc_deshutter_h",date:"2025-08-06",qty:261.35},
    {id:"prog_taawon_176",activityId:"p4_act_rc_rebar_h",date:"2025-08-06",qty:12.78},
    {id:"prog_taawon_177",activityId:"p4_act_rc_pour_v",date:"2025-08-06",qty:93.9},
    {id:"prog_taawon_178",activityId:"p4_act_rc_rebar_h",date:"2025-08-06",qty:10.97},
    {id:"prog_taawon_179",activityId:"p4_act_rc_rebar_h",date:"2025-08-07",qty:11.72},
    {id:"prog_taawon_180",activityId:"p4_act_rc_pour_v",date:"2025-08-07",qty:118.8},
    {id:"prog_taawon_181",activityId:"p4_act_rc_pour_v",date:"2025-08-07",qty:80.39},
    {id:"prog_taawon_182",activityId:"p4_act_rc_deshutter_h",date:"2025-08-07",qty:498.81},
    {id:"prog_taawon_183",activityId:"p4_act_rc_pour_v",date:"2025-08-08",qty:148.88},
    {id:"prog_taawon_184",activityId:"p4_act_rc_form_v",date:"2025-08-08",qty:338.83},
    {id:"prog_taawon_185",activityId:"p4_act_rc_deshutter_h",date:"2025-08-08",qty:353.94},
    {id:"prog_taawon_186",activityId:"p4_act_rc_pour_v",date:"2025-08-08",qty:143.03},
    {id:"prog_taawon_187",activityId:"p4_act_rc_rebar_h",date:"2025-08-08",qty:5.26},
    {id:"prog_taawon_188",activityId:"p4_act_rc_pour_v",date:"2025-08-09",qty:71.91},
    {id:"prog_taawon_189",activityId:"p4_act_rc_rebar_h",date:"2025-08-09",qty:11.75},
    {id:"prog_taawon_190",activityId:"p4_act_rc_pour_v",date:"2025-08-09",qty:121.72},
    {id:"prog_taawon_191",activityId:"p4_act_rc_rebar_h",date:"2025-08-09",qty:7.83},
    {id:"prog_taawon_192",activityId:"p4_act_rc_pour_v",date:"2025-08-09",qty:50.81},
    {id:"prog_taawon_193",activityId:"p4_act_rc_pour_v",date:"2025-08-10",qty:56.55},
    {id:"prog_taawon_194",activityId:"p4_act_rc_form_v",date:"2025-08-10",qty:474.34},
    {id:"prog_taawon_195",activityId:"p4_act_rc_deshutter_h",date:"2025-08-10",qty:357.25},
    {id:"prog_taawon_196",activityId:"p4_act_rc_pour_v",date:"2025-08-10",qty:116.33},
    {id:"prog_taawon_197",activityId:"p4_act_rc_pour_v",date:"2025-08-10",qty:68.7},
    {id:"prog_taawon_198",activityId:"p4_act_rc_form_v",date:"2025-08-11",qty:493.59},
    {id:"prog_taawon_199",activityId:"p4_act_rc_rebar_h",date:"2025-08-11",qty:6.05},
    {id:"prog_taawon_200",activityId:"p4_act_rc_pour_v",date:"2025-08-11",qty:120.3},
    {id:"prog_taawon_201",activityId:"p4_act_rc_form_v",date:"2025-08-11",qty:490.87},
    {id:"prog_taawon_202",activityId:"p4_act_rc_deshutter_h",date:"2025-08-11",qty:257.47},
    {id:"prog_taawon_203",activityId:"p4_act_rc_pour_v",date:"2025-08-12",qty:104.47},
    {id:"prog_taawon_204",activityId:"p4_act_rc_deshutter_h",date:"2025-08-12",qty:281.42},
    {id:"prog_taawon_205",activityId:"p4_act_rc_form_v",date:"2025-08-12",qty:415.82},
    {id:"prog_taawon_206",activityId:"p4_act_rc_rebar_h",date:"2025-08-12",qty:14.48},
    {id:"prog_taawon_207",activityId:"p4_act_rc_pour_v",date:"2025-08-12",qty:132.32},
    {id:"prog_taawon_208",activityId:"p4_act_rc_form_v",date:"2025-08-13",qty:360.29},
    {id:"prog_taawon_209",activityId:"p4_act_rc_deshutter_h",date:"2025-08-13",qty:395.29},
    {id:"prog_taawon_210",activityId:"p4_act_rc_rebar_h",date:"2025-08-13",qty:9.19},
    {id:"prog_taawon_211",activityId:"p4_act_rc_form_v",date:"2025-08-13",qty:260.1},
    {id:"prog_taawon_212",activityId:"p4_act_rc_pour_v",date:"2025-08-14",qty:113.84},
    {id:"prog_taawon_213",activityId:"p4_act_rc_form_v",date:"2025-08-14",qty:255.8},
    {id:"prog_taawon_214",activityId:"p4_act_rc_pour_v",date:"2025-08-14",qty:63.85},
    {id:"prog_taawon_215",activityId:"p4_act_rc_pour_v",date:"2025-08-14",qty:125.86},
    {id:"prog_taawon_216",activityId:"p4_act_rc_rebar_h",date:"2025-08-14",qty:14.54},
    {id:"prog_taawon_217",activityId:"p4_act_rc_pour_v",date:"2025-08-15",qty:145.21},
    {id:"prog_taawon_218",activityId:"p4_act_rc_deshutter_h",date:"2025-08-15",qty:316.51},
    {id:"prog_taawon_219",activityId:"p4_act_rc_form_v",date:"2025-08-15",qty:355.85},
    {id:"prog_taawon_220",activityId:"p4_act_rc_form_v",date:"2025-08-15",qty:260.62},
    {id:"prog_taawon_221",activityId:"p4_act_rc_pour_v",date:"2025-08-15",qty:87.58},
    {id:"prog_taawon_222",activityId:"p4_act_rc_pour_v",date:"2025-08-16",qty:141.5},
    {id:"prog_taawon_223",activityId:"p4_act_rc_form_v",date:"2025-08-16",qty:499.71},
    {id:"prog_taawon_224",activityId:"p4_act_rc_form_v",date:"2025-08-16",qty:284.14},
    {id:"prog_taawon_225",activityId:"p4_act_rc_deshutter_h",date:"2025-08-16",qty:456.91},
    {id:"prog_taawon_226",activityId:"p4_act_rc_deshutter_h",date:"2025-08-16",qty:435.59},
    {id:"prog_taawon_227",activityId:"p4_act_rc_form_v",date:"2025-08-17",qty:395.03},
    {id:"prog_taawon_228",activityId:"p4_act_rc_rebar_h",date:"2025-08-17",qty:11.75},
    {id:"prog_taawon_229",activityId:"p4_act_rc_deshutter_h",date:"2025-08-17",qty:427.36},
    {id:"prog_taawon_230",activityId:"p4_act_rc_pour_v",date:"2025-08-17",qty:76.99},
    {id:"prog_taawon_231",activityId:"p4_act_rc_rebar_h",date:"2025-08-17",qty:10.66},
    {id:"prog_taawon_232",activityId:"p4_act_rc_rebar_h",date:"2025-08-18",qty:7.01},
    {id:"prog_taawon_233",activityId:"p4_act_rc_deshutter_h",date:"2025-08-18",qty:442.27},
    {id:"prog_taawon_234",activityId:"p4_act_rc_pour_v",date:"2025-08-18",qty:140.73},
    {id:"prog_taawon_235",activityId:"p4_act_rc_deshutter_h",date:"2025-08-18",qty:290.01},
    {id:"prog_taawon_236",activityId:"p4_act_rc_rebar_h",date:"2025-08-18",qty:6.31},
    {id:"prog_taawon_237",activityId:"p4_act_rc_pour_v",date:"2025-08-19",qty:93.47},
    {id:"prog_taawon_238",activityId:"p4_act_rc_deshutter_h",date:"2025-08-19",qty:372.58},
    {id:"prog_taawon_239",activityId:"p4_act_rc_deshutter_h",date:"2025-08-19",qty:302.43},
    {id:"prog_taawon_240",activityId:"p4_act_rc_rebar_h",date:"2025-08-19",qty:8.99},
    {id:"prog_taawon_241",activityId:"p4_act_rc_deshutter_h",date:"2025-08-19",qty:459.74},
    {id:"prog_taawon_242",activityId:"p4_act_rc_rebar_h",date:"2025-08-20",qty:10.37},
    {id:"prog_taawon_243",activityId:"p4_act_rc_pour_v",date:"2025-08-20",qty:53.7},
    {id:"prog_taawon_244",activityId:"p4_act_rc_deshutter_h",date:"2025-08-20",qty:362.46},
    {id:"prog_taawon_245",activityId:"p4_act_rc_pour_v",date:"2025-08-20",qty:114.39},
];

// --- USERS ---
export let users: User[] = JSON.parse(JSON.stringify([
  { id: 'user1', name: 'Admin User', username: 'admin', empId: 'ADM001', email: 'admin@company.com', password: 'admin123', role: 'Admin', assignedProjects: [] },
  { id: 'user2', name: 'Project Manager', username: 'pm', empId: 'PM001', email: 'pm@company.com', password: 'pm123', role: 'Project Manager', assignedProjects: [] },
  { id: 'user3', name: 'Data Entry Clerk', username: 'data', empId: 'DE001', email: 'data@company.com', password: 'data123', role: 'Data Entry', assignedProjects: [] },
]));