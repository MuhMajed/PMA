import { ProjectNodeType, ViolationType } from './types';

export const HIERARCHY: ProjectNodeType[] = ['Project', 'Level1', 'Level2', 'Level3', 'Level4', 'Level5', 'Level6', 'Level7', 'Level8', 'Level9', 'Activity'];

export const DEFAULT_HIERARCHY_LABELS: Record<ProjectNodeType, string> = {
    Project: 'Project',
    Level1: 'Level 1',
    Level2: 'Level 2',
    Level3: 'Level 3',
    Level4: 'Level 4',
    Level5: 'Level 5',
    Level6: 'Level 6',
    Level7: 'Level 7',
    Level8: 'Level 8',
    Level9: 'Level 9',
    Activity: 'Activity',
};

export const NATIONALITIES: string[] = [
  'American', 'British', 'Canadian', 'Indian', 'Filipino', 'Pakistani', 'Bangladeshi',
  'Nepali', 'Egyptian', 'German', 'Qatari', 'Emirati', 'Saudi Arabian'
];

export const SCOPES: string[] = [
    'Civil Works', 'MEP Works', 'Finishing Works', 'General Contracting', 'Earthworks', 'HVAC'
];

export const VIOLATION_TYPES: ViolationType[] = [
  'No Helmet',
  'No Safety Vest',
  'Unsafe Scaffolding',
  'No Harness',
  'Improper Use of Tools',
  'Electrical Hazard',
  'Other',
];

export const UOM_OPTIONS: string[] = ['m', 'm²', 'm³', 'L', 'Ton', 'kg', 'pcs', 'LS'];
export const CURRENCY_OPTIONS: string[] = ['SAR', 'USD', 'EGP', 'AED'];
