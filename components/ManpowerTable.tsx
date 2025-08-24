

import React, { useMemo, useCallback } from 'react';
import { ManpowerRecord, Shift, Project, ProjectNodeType, User } from '../types';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { useConfirmation } from './ConfirmationProvider';
import { DEFAULT_HIERARCHY_LABELS, HIERARCHY } from '../constants';

interface ManpowerTableProps {
  records: ManpowerRecord[];
  projects: Project[];
  onEdit: (record: ManpowerRecord) => void;
  onDelete: (id: string) => void;
  currentUser: User;
}

const getProjectHierarchyLabels = (projectId: string, allProjects: Project[]): Record<ProjectNodeType, string> => {
    let current = allProjects.find(p => p.id === projectId);
    if (!current) return DEFAULT_HIERARCHY_LABELS;
    
    while (current.parentId) {
        const parent = allProjects.find(p => p.id === current.parentId);
        if (!parent) break;
        current = parent;
    }
    
    return { ...DEFAULT_HIERARCHY_LABELS, ...current.hierarchyLabels };
}

const ManpowerTable: React.FC<ManpowerTableProps> = ({ records, projects, onEdit, onDelete, currentUser }) => {
  const { showConfirmation } = useConfirmation();

  const canDelete = currentUser.role === 'Admin' || currentUser.role === 'Project Manager';

  const projectsById = useMemo(() => {
    const map = new Map<string, Project>();
    projects.forEach(p => map.set(p.id, p));
    return map;
  }, [projects]);

  const getProjectPath = useCallback((activityId: string): Record<ProjectNodeType, string> => {
      const path: Partial<Record<ProjectNodeType, string>> = {};
      let current = projectsById.get(activityId);

      while (current) {
          path[current.type] = current.name;
          current = current.parentId ? projectsById.get(current.parentId) : undefined;
      }
      
      const result: any = {};
      HIERARCHY.forEach(level => {
          result[level] = path[level] || '';
      });
      
      return result as Record<ProjectNodeType, string>;
  }, [projectsById]);
  
  const getFullPathString = useCallback((activityId: string): string => {
      const path = getProjectPath(activityId);
      return HIERARCHY.slice(1) // Exclude 'Project' name
          .map(level => path[level])
          .filter(Boolean)
          .join(' / ');
  }, [getProjectPath]);

  
  const handleDelete = (record: ManpowerRecord) => {
      showConfirmation(
          'Confirm Deletion',
          `Are you sure you want to delete the record for ${record.name} on ${record.date}?\nThis action cannot be undone.`,
          () => onDelete(record.id)
      );
  };

  if (records.length === 0) {
    return (
      <div className="text-center py-10 px-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg">
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-slate-900 dark:text-white">No records found</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">No manpower has been recorded for the selected filters.</p>
      </div>
    );
  }
  
  const renderShift = (shift: Shift) => (
    <span className="flex items-center">
        {shift === Shift.DAY ? <SunIcon className="h-5 w-5 text-yellow-500 mr-1" /> : <MoonIcon className="h-5 w-5 text-blue-500 mr-1" />}
        {shift}
    </span>
  );

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
        <thead className="bg-slate-50 dark:bg-slate-700">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Emp ID</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Name</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Date</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Profession</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Subcontractor</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Activity / Location</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Shift</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider">Hours Worked</th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
          {records.map((record) => {
            const fullPath = getFullPathString(record.project);
            return (
                <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{record.empId}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{record.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{record.date}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{record.profession}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{record.subcontractor}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 max-w-xs" title={fullPath}>{fullPath || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{renderShift(record.shift)}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 text-center">{record.hoursWorked ?? 'N/A'}</td>
                  <td className="px-6 py-4 text-right text-sm font-medium space-x-4">
                    <button onClick={() => onEdit(record)} className="text-[#28a745] hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                        <PencilIcon className="h-5 w-5" />
                    </button>
                    {canDelete && (
                        <button onClick={() => handleDelete(record)} className="text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                            <TrashIcon className="h-5 w-5" />
                        </button>
                    )}
                  </td>
                </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ManpowerTable;