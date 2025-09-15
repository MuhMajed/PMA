import * as XLSX from 'xlsx';
import { ManpowerStatus, Shift, Project, Equipment } from '../types';

export const exportToExcel = (data: any[], fileName: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

export const importFromExcel = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const bstr = event.target?.result;
                const workbook = XLSX.read(bstr, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);
                resolve(json);
            } catch (e) {
                reject(e);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsBinaryString(file);
    });
};

export const downloadManpowerTemplate = () => {
    const headers = [
        'empId', 'name', 'profession', 'status', 'shift', 'nationality', 'subcontractor', 'hoursWorked'
    ];
    const templateWorksheet = XLSX.utils.aoa_to_sheet([headers]);
    templateWorksheet['!cols'] = headers.map(() => ({ wch: 20 }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, templateWorksheet, 'Template');

    const notes = [
        ["Notes & Guidelines"],
        [], // Empty row for spacing
        ["Field", "Description", "Valid Options / Example"],
        ["empId", "Required. Employee's unique ID. Must exist in the employee master list.", "EMP001"],
        ["name", "Optional. Will be auto-filled based on Employee ID.", "John Doe"],
        ["profession", "Optional. Will be auto-filled based on Employee ID.", "Site Engineer"],
        ["status", `Required. The employee's status for the day.`, `Options: ${Object.values(ManpowerStatus).join(', ')}`],
        ["shift", "Required only if status is 'Active'. Leave blank otherwise.", `Options: ${Object.values(Shift).join(', ')}`],
        ["nationality", "Optional. Will be auto-filled based on Employee ID.", "American"],
        ["subcontractor", "Optional. Will be auto-filled based on Employee ID.", "BuildWell Inc."],
        ["hoursWorked", "Required only if status is 'Active'. Must be a number (e.g., 8 or 8.5). Leave blank otherwise.", "8.5"],
    ];
    const notesWorksheet = XLSX.utils.aoa_to_sheet(notes);
    
    notesWorksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];
    notesWorksheet['!cols'] = [{ wch: 15 }, { wch: 70 }, { wch: 40 }];
    
    XLSX.utils.book_append_sheet(workbook, notesWorksheet, 'Notes');
    workbook.SheetNames = ['Template', 'Notes'];

    XLSX.writeFile(workbook, 'Manpower_Upload_Template.xlsx');
};

export const downloadEmployeeTemplate = () => {
    const headers = [
        'empId', 'name', 'idIqama', 'profession', 'department', 'email', 'phone', 'nationality', 'type', 'subcontractor', 'joiningDate'
    ];
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);
    worksheet['!cols'] = headers.map(() => ({ wch: 20 }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    
    const notes = [
        ["Notes & Guidelines"],
        [],
        ["Field", "Description", "Example / Valid Options"],
        ["empId", "Required. Must be a unique ID for the employee.", "EMP10234"],
        ["name", "Required. Full name of the employee.", "Jane Smith"],
        ["idIqama", "Required. National ID or Iqama number.", "1234567890"],
        ["profession", "Required. Job title. Should match an existing profession in Settings.", "Plumber"],
        ["department", "Required. Department name. Should match an existing department in Settings.", "Construction & Field Operations"],
        ["email", "Optional. Employee's email address.", "jane.s@example.com"],
        ["phone", "Required. Employee's phone number.", "555-123-4567"],
        ["nationality", "Required. Employee's nationality.", "Filipino"],
        ["type", "Required. Employee type.", "Options: Direct, Indirect"],
        ["subcontractor", "Required. The name of the subcontractor company. Must match an existing subcontractor in Settings.", "BuildWell Inc."],
        ["joiningDate", "Optional. The date the employee joined. Format: YYYY-MM-DD", "2023-05-20"],
    ];
    const notesWorksheet = XLSX.utils.aoa_to_sheet(notes);
    notesWorksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];
    notesWorksheet['!cols'] = [{ wch: 15 }, { wch: 70 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(workbook, notesWorksheet, 'Notes');
    workbook.SheetNames = ['Template', 'Notes'];

    XLSX.writeFile(workbook, 'Employee_Upload_Template.xlsx');
};

export const downloadSubcontractorTemplate = () => {
    const headers = ['name', 'contactPerson', 'email', 'website', 'nationality', 'scope', 'mainContractorId'];
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);
    worksheet['!cols'] = headers.map(() => ({ wch: 20 }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

    const notes = [
        ["Notes & Guidelines"],
        [],
        ["Field", "Description", "Example"],
        ["name", "Required. The unique name of the subcontractor company.", "Spark Electricals"],
        ["contactPerson", "Optional. Name of the primary contact person.", "Mr. Khan"],
        ["email", "Optional. Contact email address.", "admin@spark.com"],
        ["website", "Optional. Company website.", "spark.com"],
        ["nationality", "Required. The nationality of the company.", "Indian"],
        ["scope", "Required. The primary scope of work.", "MEP Works"],
        ["mainContractorId", "Optional. This is an advanced field. If this is a sub-subcontractor, this should be the ID of the main contractor. You can find this ID by exporting the current subcontractors list. Leave blank if this is a main contractor.", "sub1"],
    ];
    const notesWorksheet = XLSX.utils.aoa_to_sheet(notes);
    notesWorksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];
    notesWorksheet['!cols'] = [{ wch: 20 }, { wch: 100 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(workbook, notesWorksheet, 'Notes');
    workbook.SheetNames = ['Template', 'Notes'];
    
    XLSX.writeFile(workbook, 'Subcontractor_Upload_Template.xlsx');
};

export const downloadProjectsTemplate = () => {
    const headers = ['id', 'name', 'parentId', 'type', 'uom', 'totalQty', 'universalNorm', 'companyNorm', 'rate'];
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);
    worksheet['!cols'] = headers.map(() => ({ wch: 20 }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

    const notes = [
        ["Notes & Guidelines"],
        [],
        ["Field", "Description"],
        ["id", "Required. A unique identifier for this project item. E.g., 'proj_tower_l1'"],
        ["name", "Required. The display name of the item. E.g., 'Level 1'"],
        ["parentId", "The 'id' of the parent item. Leave blank for a top-level project."],
        ["type", "Required. The hierarchy level of the item. Options: Project, Level1, Level2, Level3, Level4, Level5, Level6, Level7, Level8, Level9, Activity"],
        ["uom", "For 'Activity' type only. Unit of Measurement. E.g., 'm³', 'ton'"],
        ["totalQty", "For 'Activity' type only. The total planned quantity."],
        ["universalNorm", "Required for 'Activity' type only. The universal norm in 'uom / Man-hour'."],
        ["companyNorm", "For 'Activity' type only. The company norm in 'uom / Man-hour'."],
        ["rate", "For 'Activity' type only. The rate per unit of measure."],
    ];
    const notesWorksheet = XLSX.utils.aoa_to_sheet(notes);
    notesWorksheet['!cols'] = [{ wch: 20 }, { wch: 80 }];
    XLSX.utils.book_append_sheet(workbook, notesWorksheet, 'Notes');
    workbook.SheetNames = ['Template', 'Notes'];

    XLSX.writeFile(workbook, 'Projects_Hierarchy_Template.xlsx');
};

export const downloadProfessionsTemplate = () => {
    const headers = ['professionName'];
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);
    worksheet['!cols'] = [{ wch: 30 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

    const notes = [
        ["Notes & Guidelines"],
        [],
        ["This file is for bulk-adding new professions to the system."],
        ["Enter each new profession name in the 'professionName' column."],
        ["Each name must be unique. The system will ignore any names that already exist."],
    ];
    const notesWorksheet = XLSX.utils.aoa_to_sheet(notes);
    notesWorksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
    notesWorksheet['!cols'] = [{ wch: 70 }];
    XLSX.utils.book_append_sheet(workbook, notesWorksheet, 'Notes');
    workbook.SheetNames = ['Template', 'Notes'];

    XLSX.writeFile(workbook, 'Professions_Upload_Template.xlsx');
};

export const downloadDepartmentsTemplate = () => {
    const headers = ['departmentName'];
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);
    worksheet['!cols'] = [{ wch: 30 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    
    const notes = [
        ["Notes & Guidelines"],
        [],
        ["This file is for bulk-adding new departments to the system."],
        ["Enter each new department name in the 'departmentName' column."],
        ["Each name must be unique. The system will ignore any names that already exist."],
    ];
    const notesWorksheet = XLSX.utils.aoa_to_sheet(notes);
    notesWorksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
    notesWorksheet['!cols'] = [{ wch: 70 }];
    XLSX.utils.book_append_sheet(workbook, notesWorksheet, 'Notes');
    workbook.SheetNames = ['Template', 'Notes'];

    XLSX.writeFile(workbook, 'Departments_Upload_Template.xlsx');
};

export const downloadEquipmentTemplate = () => {
    const headers = ['name', 'type', 'plateNo', 'operatorId', 'status'];
    const worksheet = XLSX.utils.aoa_to_sheet([headers]);
    worksheet['!cols'] = headers.map(() => ({ wch: 25 }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    
    const notes = [
        ["Notes & Guidelines"],
        [],
        ["Field", "Description", "Example / Valid Options"],
        ["name", "Required. The unique name/description of the equipment.", "Excavator CAT 320"],
        ["type", "Required. The general type of equipment.", "Excavator"],
        ["plateNo", "Required. The unique license plate or serial number.", "EX-001"],
        ["operatorId", "Required. The Employee ID of the default operator. Must exist in the employee master list.", "EMP001"],
        ["status", "Required. The current status of the equipment.", "Options: Active, Under Maintenance, Inactive"],
    ];
    const notesWorksheet = XLSX.utils.aoa_to_sheet(notes);
    notesWorksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];
    notesWorksheet['!cols'] = [{ wch: 15 }, { wch: 70 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(workbook, notesWorksheet, 'Notes');
    workbook.SheetNames = ['Template', 'Notes'];

    XLSX.writeFile(workbook, 'Equipment_Upload_Template.xlsx');
};

export const exportToBoqExcel = (projects: Project[], fileName: string) => {
    const boqData: any[] = [];
    const projectsById = new Map(projects.map(p => [p.id, p]));

    const processNode = (projectId: string, itemNumber: string) => {
        const project = projectsById.get(projectId);
        if (!project) return;

        const isActivity = project.type === 'Activity';
        boqData.push({
            'Item No.': itemNumber,
            'Description': project.name,
            // FIX: Cast project to any to access optional properties that only exist on 'Activity' types.
            'Unit': isActivity ? (project as any).uom || '' : '',
            'Quantity': isActivity ? project.totalQty ?? '' : '',
            'Rate': isActivity ? (project as any).rate ?? '' : '',
            'Amount': isActivity && typeof project.totalQty === 'number' && typeof (project as any).rate === 'number' 
                ? project.totalQty * (project as any).rate 
                : ''
        });

        const children = projects.filter(p => p.parentId === projectId).sort((a, b) => a.name.localeCompare(b.name));
        children.forEach((child, index) => {
            processNode(child.id, `${itemNumber}.${index + 1}`);
        });
    };

    const rootProjects = projects.filter(p => p.parentId === null).sort((a, b) => a.name.localeCompare(b.name));
    rootProjects.forEach((project, index) => {
        processNode(project.id, `${index + 1}`);
    });

    const worksheet = XLSX.utils.json_to_sheet(boqData);
    worksheet['!cols'] = [
        { wch: 15 }, // Item No.
        { wch: 50 }, // Description
        { wch: 10 }, // Unit
        { wch: 15 }, // Quantity
        { wch: 15 }, // Rate
        { wch: 15 }, // Amount
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'BOQ');
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
};