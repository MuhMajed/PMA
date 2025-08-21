import * as XLSX from 'xlsx';
import { ManpowerStatus, Shift, Project } from '../types';

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
    // Main template sheet with headers and an example row
    const headers = [
        'empId', 'name', 'profession', 'status', 'shift', 'nationality', 'subcontractor', 'hoursWorked'
    ];
    const templateData = [
      {
        empId: 'EMP001',
        name: 'John Doe',
        profession: 'Site Engineer',
        status: ManpowerStatus.ACTIVE,
        shift: Shift.DAY,
        nationality: 'American',
        subcontractor: 'BuildWell Inc.',
        hoursWorked: 8
      },
      {
        empId: 'EMP003',
        name: 'Peter Jones',
        profession: 'Carpenter',
        status: ManpowerStatus.ON_LEAVE,
        shift: '',
        nationality: 'British',
        subcontractor: 'WoodCrafters',
        hoursWorked: ''
      }
    ];
    const templateWorksheet = XLSX.utils.json_to_sheet(templateData, { header: headers });
    templateWorksheet['!cols'] = headers.map(() => ({ wch: 20 }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, templateWorksheet, 'Template');

    // Instructions sheet
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
    
    // Formatting for notes sheet
    notesWorksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }]; // Merge title row
    notesWorksheet['!cols'] = [{ wch: 15 }, { wch: 70 }, { wch: 40 }];
    
    XLSX.utils.book_append_sheet(workbook, notesWorksheet, 'Notes');

    // Reorder sheets so Template is first
    workbook.SheetNames = ['Template', 'Notes'];

    XLSX.writeFile(workbook, 'Manpower_Upload_Template.xlsx');
};

export const downloadEmployeeTemplate = () => {
    const headers = [
        'empId', 'name', 'idIqama', 'profession', 'department', 'email', 'phone', 'nationality', 'type', 'subcontractor', 'joiningDate'
    ];
    const data = [
      {
        empId: 'EMP006',
        name: 'Jane Smith',
        idIqama: '9876543210',
        profession: 'Project Manager',
        department: 'Management',
        email: 'j.smith@example.com',
        phone: '555-0106',
        nationality: 'Canadian',
        type: 'Direct',
        subcontractor: 'BuildWell Inc.',
        joiningDate: '2024-01-10',
      }
    ];
    const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    XLSX.writeFile(workbook, 'Employee_Upload_Template.xlsx');
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
            'Unit': isActivity ? project.uom || '' : '',
            'Quantity': isActivity ? project.totalQty ?? '' : '',
            'Rate': isActivity ? project.rate ?? '' : '',
            'Amount': isActivity && typeof project.totalQty === 'number' && typeof project.rate === 'number' 
                ? project.totalQty * project.rate 
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