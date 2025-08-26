


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
  date: string; // YYYY-MM-DD format
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
  uom?: string; // Unit of Measurement
  totalQty?: number; // Total planned quantity for activities
  universalNorm?: number; // Universal Norm in uom / Man-hour
  companyNorm?: number; // Company Norm in uom / Man-hour
  rate?: number; // Rate per uom for BOQ
  hierarchyLabels?: Partial<Record<ProjectNodeType, string>>; // For root projects
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
  date: string; // YYYY-MM-DD
  qty: number; // Represents daily progress quantity
  manualPercentage?: number; // Optional user-defined cumulative percentage
  shift?: Shift;
}

export type UserRole = 'Admin' | 'Project Manager' | 'Data Entry';

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


export type Profession = string;
export type Department = string;

export type Page = 
  | 'dashboard'
  | 'manpower-records'
  | 'progress-record'
  | 'equipment-records'
  | 'settings-employees'
  | 'settings-projects'
  | 'settings-professions'
  | 'settings-departments'
  | 'settings-subcontractors'
  | 'settings-users'
  | 'settings-equipment';
  
export type Theme = 'light' | 'dark';