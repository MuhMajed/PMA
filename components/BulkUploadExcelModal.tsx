import React, { useState, useCallback } from 'react';
import { ManpowerRecord, ManpowerStatus, Shift } from '../types';
import { UploadIcon } from './icons/UploadIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { downloadManpowerTemplate, importFromExcel } from '../utils/excel';

interface BulkUploadExcelModalProps {
    onClose: () => void;
    onUpload: (records: Omit<ManpowerRecord, 'id' | 'project' | 'date'>[]) => void;
}

const REQUIRED_HEADERS = ['empId', 'status'];

const BulkUploadExcelModal: React.FC<BulkUploadExcelModalProps> = ({ onClose, onUpload }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleFileParse = async (file: File) => {
        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            alert('Invalid file type. Please upload an Excel file (.xlsx, .xls).');
            return;
        }

        try {
            const results = await importFromExcel(file);
            if (results.length === 0) {
                alert('The uploaded Excel file is empty.');
                return;
            }

            const headers = Object.keys(results[0]);
            if (!REQUIRED_HEADERS.every(h => headers.includes(h))) {
                alert(`Excel headers are missing or incorrect. Required headers: ${REQUIRED_HEADERS.join(', ')}`);
                return;
            }

            const validRecords: Omit<ManpowerRecord, 'id' | 'project' | 'date'>[] = [];
            const parseErrors: string[] = [];

            results.forEach((row: any, index: number) => {
                const rowNum = index + 2;
                if (!row.empId || !row.status) {
                    parseErrors.push(`Row ${rowNum}: 'empId' and 'status' are required fields.`);
                    return;
                }
                
                const status = row.status as ManpowerStatus;
                if (!Object.values(ManpowerStatus).includes(status)) {
                    parseErrors.push(`Row ${rowNum}: Invalid status "${row.status}".`);
                    return;
                }

                let hoursWorked = 0;
                let shift = Shift.DAY; // Default value if not active

                if (status === ManpowerStatus.ACTIVE) {
                    if (!row.hoursWorked) {
                        parseErrors.push(`Row ${rowNum}: 'hoursWorked' is required for 'Active' status.`);
                        return;
                    }
                    const parsedHours = parseFloat(row.hoursWorked);
                    if (isNaN(parsedHours) || parsedHours <= 0 || parsedHours > 24) {
                        parseErrors.push(`Row ${rowNum}: 'hoursWorked' must be a number > 0 and <= 24 for 'Active' status. Found: "${row.hoursWorked}".`);
                        return;
                    }
                    hoursWorked = parsedHours;
                    
                    if (!row.shift) {
                        parseErrors.push(`Row ${rowNum}: 'shift' is required for 'Active' status.`);
                        return;
                    }
                    const parsedShift = row.shift as Shift;
                    if (!Object.values(Shift).includes(parsedShift)) {
                        parseErrors.push(`Row ${rowNum}: Invalid shift "${row.shift}". Must be 'Day' or 'Night'.`);
                        return;
                    }
                    shift = parsedShift;
                }

                validRecords.push({
                    empId: String(row.empId),
                    name: String(row.name || ''),
                    profession: String(row.profession || ''),
                    status: status,
                    shift: shift,
                    nationality: String(row.nationality || ''),
                    subcontractor: String(row.subcontractor || ''),
                    hoursWorked: hoursWorked,
                });
            });
            
            if (parseErrors.length > 0) {
                alert(`Errors found during parsing:\n- ${parseErrors.slice(0, 5).join('\n- ')}`);
            } else if (validRecords.length > 0) {
                onUpload(validRecords);
                onClose();
            } else {
                alert('No valid records found in the uploaded file.');
            }
        } catch (err) {
            alert(`An error occurred during parsing: ${err instanceof Error ? err.message : String(err)}`);
        }
    };

    const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileParse(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    }, [handleFileParse]);
    
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFileParse(e.target.files[0]);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-white">Bulk Upload Manpower (Excel)</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-6">
                    <div
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragging ? 'border-green-500 bg-green-50 dark:bg-slate-700' : 'border-slate-300 dark:border-slate-600 hover:border-green-400 dark:hover:border-green-500'}`}
                    >
                        <input type="file" id="excel-upload" className="hidden" accept=".xlsx, .xls" onChange={handleFileSelect} />
                        <label htmlFor="excel-upload" className="flex flex-col items-center justify-center space-y-2 cursor-pointer">
                            <UploadIcon className="h-12 w-12 text-slate-400 dark:text-slate-500" />
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                <span className="font-semibold text-[#28a745]">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Excel file (.xlsx or .xls)</p>
                        </label>
                    </div>

                    <div className="mt-4 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 p-4 rounded-md">
                        <h4 className="font-semibold text-slate-800 dark:text-white">Required Excel Format:</h4>
                        <p className="mt-1">Please refer to the "Notes" tab in the template for detailed instructions.</p>
                        <button onClick={downloadManpowerTemplate} className="mt-3 flex items-center text-sm font-medium text-[#28a745] hover:text-green-700">
                            <DownloadIcon className="h-4 w-4 mr-1" />
                            Download Template
                        </button>
                    </div>
                </div>
                 <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 text-right">
                    <button type="button" onClick={onClose} className="inline-flex justify-center py-2 px-4 border border-slate-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700">
                      Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BulkUploadExcelModal;