export enum ManpowerStatus {
  ACTIVE = 'Active',
  IDLE = 'Idle',
  ON_LEAVE = 'On Leave',
  TRANSFERRED = 'Transferred',
}

export enum Shift {
  DAY = 'Day',
  NIGHT = 'Night',
}

export interface ManpowerRecord {
  id: string;
  empId: string;
  name: string;
  profession: string;
  project: string; // This will be the ID of a project node
  status: ManpowerStatus;
  nationality: string;
  subcontractor: string;
  date: string; // YYYY-MM-DD
  hoursWorked?: number;
  shift: Shift;
  createdBy?: string;
  modifiedDate?: string; // YYYY-MM-DD
  modifiedBy?: string;
}

export type ProjectNodeType = 'Project' | 'Level1' | 'Level2' | 'Level3' | 'Level4' | 'Level5' | 'Level6' | 'Level7' | 'Level8' | 'Level9' | 'Activity';

export interface Project {
  id: string;
  name: string;
  parentId: string | null;
  type: ProjectNodeType;
  totalQty?: number; // Total planned quantity for activities
  hierarchyLabels?: Partial<Record<ProjectNodeType, string>>; // For root projects
  // FIX: Add optional uom, rate, and currency for activities.
  uom?: string;
  rate?: number;
  currency?: string;
}

export type EmployeeType = 'Direct' | 'Indirect';

export interface Employee {
  id: string;
  empId: string; // ID
  name: string;
  profession: string;
  nationality: string;
  idIqama: string; // ID/Iqama
  department: string;
  email?: string;
  phone: string;
  type: EmployeeType;
  subcontractor: string;
  joiningDate?: string; // YYYY-MM-DD
  createdBy?: string;
  modifiedDate?: string; // YYYY-MM-DD
  modifiedBy?: string;
}

export interface Subcontractor {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  website: string;
  nationality: string;
  scope: string;
  mainContractorId?: string | null;
}

export interface ProgressRecord {
  id: string;
  activityId: string;
  activityGroupId: string;
  date: string; // YYYY-MM-DD
  // This now represents the CUMULATIVE quantity for the activity up to this specific record's date/shift.
  qty: number; 
  manualPercentage?: number; // Optional user-defined cumulative percentage
  shift?: Shift;
  progressPhotos?: string; // base64 encoded image
  highlightedLayoutPhotos?: string; // base64 encoded image
}

export type UserRole = 'Admin' | 'Project Manager' | 'Data Entry' | 'Safety';

export interface User {
  id: string;
  name: string;
  username: string;
  empId: string;
  email: string;
  password?: string; // Optional because we don't want to send it to the client
  role: UserRole;
  assignedProjects?: string[];
}

export interface Equipment {
  id: string;
  name: string;
  type: string;
  plateNo: string;
  operatorId: string; // Employee ID
  status: 'Active' | 'Under Maintenance' | 'Inactive';
}

export enum EquipmentStatus {
  WORKING = 'Working',
  IDLE = 'Idle',
  BREAKDOWN = 'Breakdown',
}

export interface EquipmentRecord {
  id: string;
  equipmentId: string;
  date: string;
  project: string;
  status: EquipmentStatus;
  hoursWorked?: number;
  shift: Shift;
  remarks?: string;
  operatorId?: string; // Daily operator can be different
  createdBy?: string;
  modifiedDate?: string; // YYYY-MM-DD
  modifiedBy?: string;
}

export type ViolationType =
  | 'No Helmet'
  | 'No Safety Vest'
  | 'Unsafe Scaffolding'
  | 'No Harness'
  | 'Improper Use of Tools'
  | 'Electrical Hazard'
  | 'Other';

export interface SafetyViolation {
  id: string;
  date: string; // YYYY-MM-DD
  projectId: string; // an activity or level id
  subcontractor: string;
  empId?: string; // Optional employee ID
  violationType: ViolationType;
  description: string;
  actionTaken: string;
  photo?: string; // Base64 encoded image string
  createdBy?: string;
}

export interface ActivityGroup {
  id: string;
  name: string;
  uom: string;
  universalNorm: number;
  companyNorm?: number;
  rate?: number;
}

export interface ActivityGroupMapping {
  activityId: string;
  activityGroupId: string;
}


export type Profession = string;
export type Department = string;

export type Page = 
  | 'dashboard'
  | 'manpower-records'
  | 'progress-record'
  | 'equipment-records'
  | 'safety-violations'
  | 'settings-employees'
  | 'settings-projects'
  | 'settings-professions'
  | 'settings-departments'
  | 'settings-subcontractors'
  | 'settings-users'
  | 'settings-equipment'
  | 'settings-activity-groups';
  
export type Theme = 'light' | 'dark';