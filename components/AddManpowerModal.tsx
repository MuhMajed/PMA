import React, { useState, useEffect, useMemo } from 'react';
import { ManpowerRecord, ManpowerStatus, Project, Subcontractor, Shift, Employee } from '../types';
import { ProjectTreeSelect } from './ProjectTreeSelect';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';

interface AddManpowerModalProps {
  onClose: () => void;
  onAdd: (record: Omit<ManpowerRecord, 'id'>) => void;
  onEdit: (record: ManpowerRecord) => void;
  recordToEdit?: ManpowerRecord | null;
  projects: Project[];
  allRecords: ManpowerRecord[];
  employees: Employee[];
  subcontractors: Subcontractor[];
  defaultDate: string;
}

const getDescendantIds = (projectId: string, projects: Project[]): string[] => {
  let descendants: string[] = [];
  const children = projects.filter(p => p.parentId === projectId);
  children.forEach(child => {
    descendants.push(child.id);
    descendants = [...descendants, ...getDescendantIds(child.id, projects)];
  });
  return descendants;
};

const AddManpowerModal: React.FC<AddManpowerModalProps> = ({ 
    onClose, 
    onAdd, 
    onEdit, 
    recordToEdit, 
    projects,
    allRecords,
    employees,
    subcontractors = [],
    defaultDate,
}) => {
  const [activeTab, setActiveTab] = useState<'direct' | 'staff'>('direct');
  
  // Common state
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [foundEmployee, setFoundEmployee] = useState<Employee | null>(null);
  const [employeeStatus, setEmployeeStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [name, setName] = useState('');
  const [profession, setProfession] = useState('');
  const [status, setStatus] = useState<ManpowerStatus>(ManpowerStatus.ACTIVE);
  const [subcontractor, setSubcontractor] = useState('');
  const [hoursWorked, setHoursWorked] = useState<number | ''>('');
  const [date, setDate] = useState(defaultDate || '');
  const [shift, setShift] = useState<Shift>(Shift.DAY);

  // Direct Manpower state
  const [isSupporting, setIsSupporting] = useState(false);
  const [directActivityId, setDirectActivityId] = useState<string | null>(null);
  const [directRootProjectId, setDirectRootProjectId] = useState<string | null>(null);
  
  // Staff Attendance state
  const [staffProjectId, setStaffProjectId] = useState<string | null>(null);
  const [staffLevel1Id, setStaffLevel1Id] = useState<string | null>(null);
  const [staffLevel2Id, setStaffLevel2Id] = useState<string | null>(null);

  const isEditMode = !!recordToEdit;
  
  const rootProjects = useMemo(() => projects.filter(p => p.parentId === null), [projects]);

  // --- Memos for Direct Manpower Form ---
  const projectsForTree = useMemo(() => {
    if (!directRootProjectId) return [];
    const descendantIds = getDescendantIds(directRootProjectId, projects);
    const allIdsInSubtree = new Set([directRootProjectId, ...descendantIds]);
    const subTreeProjects = projects.filter(p => allIdsInSubtree.has(p.id));
    return subTreeProjects.map(p => p.id === directRootProjectId ? { ...p, parentId: null } : p);
  }, [directRootProjectId, projects]);

  const supportingSubcontractorList = useMemo(() => {
    if (!foundEmployee) return [];
    return subcontractors.filter(s => s.name !== foundEmployee.subcontractor && s.name !== 'Saudi Bin Ladin Group');
  }, [subcontractors, foundEmployee]);
  
  // --- Memos for Staff Attendance Form ---
  const level1Options = useMemo(() => projects.filter(p => p.parentId === staffProjectId), [projects, staffProjectId]);
  const level2Options = useMemo(() => projects.filter(p => p.parentId === staffLevel1Id), [projects, staffLevel1Id]);


  // Effect to handle editing mode initialization
  useEffect(() => {
    if (isEditMode && recordToEdit) {
      const employee = employees.find(e => e.empId === recordToEdit.empId);
      if (employee) {
        setFoundEmployee(employee);
        setEmployeeSearch(employee.empId);
        setEmployeeStatus('valid');
        setName(employee.name);
        setProfession(employee.profession);
        if (recordToEdit.subcontractor !== employee.subcontractor) setIsSupporting(true);
      }
      
      setStatus(recordToEdit.status);
      setSubcontractor(recordToEdit.subcontractor);
      setHoursWorked(recordToEdit.hoursWorked ?? '');
      setDate(recordToEdit.date);
      setShift(recordToEdit.shift);
      
      const projectNode = projects.find(p => p.id === recordToEdit.project);
      if (projectNode) {
          const isSupportingRecord = projectNode.parentId === null && employee && recordToEdit.subcontractor !== employee.subcontractor;
          if(projectNode.type === 'Activity' || isSupportingRecord) {
            setActiveTab('direct');
            setDirectActivityId(recordToEdit.project);
            let root = projectNode;
            while(root.parentId) root = projects.find(p => p.id === root.parentId) || root;
            setDirectRootProjectId(root.id);
          } else {
            setActiveTab('staff');
            let path = [projectNode];
            let current = projectNode;
            while(current.parentId) {
                current = projects.find(p => p.id === current.parentId) || current;
                path.unshift(current);
            }
            setStaffProjectId(path[0]?.id || null);
            setStaffLevel1Id(path[1]?.id || null);
            setStaffLevel2Id(path[2]?.id || null);
          }
      }
    }
  }, [recordToEdit, isEditMode, employees, projects]);
  
  const findEmployee = () => {
      if (!employeeSearch) {
          setEmployeeStatus('idle');
          setFoundEmployee(null);
          setName('');
          setProfession('');
          setSubcontractor('');
          return;
      }
      const searchTerm = employeeSearch.toLowerCase();
      const employee = employees.find(e => e.empId.toLowerCase() === searchTerm || e.idIqama.toLowerCase() === searchTerm);

      if (employee) {
          setFoundEmployee(employee);
          setEmployeeStatus('valid');
          setName(employee.name);
          setProfession(employee.profession);
          setSubcontractor(employee.subcontractor);
          setIsSupporting(false);
      } else {
          setFoundEmployee(null);
          setEmployeeStatus('invalid');
          setName('');
          setProfession('');
          setSubcontractor('');
      }
  };
  
  const handleDirectRootProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newRootId = e.target.value;
      setDirectRootProjectId(newRootId);
      if (directActivityId) {
          const descendantIds = getDescendantIds(newRootId, projects);
          const allIds = [newRootId, ...descendantIds];
          if (!allIds.includes(directActivityId)) setDirectActivityId(null);
      }
  };
  
  const handleToggleSupporting = (checked: boolean) => {
    setIsSupporting(checked);
    if (checked) {
        setSubcontractor(supportingSubcontractorList[0]?.name || '');
        setDirectActivityId(null);
    } else if (foundEmployee) {
        setSubcontractor(foundEmployee.subcontractor);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (employeeStatus !== 'valid' || !foundEmployee) {
        alert('Please select a valid employee.');
        return;
    }

    let projectIdToSave: string | null = null;
    if (activeTab === 'direct') {
      projectIdToSave = isSupporting ? directRootProjectId : directActivityId;
      if (!projectIdToSave) {
          alert(isSupporting ? 'Please select a project.' : 'Please select an activity.');
          return;
      }
      if (isSupporting && !subcontractor) {
          alert('Please select the supporting subcontractor.');
          return;
      }
    } else { // Staff tab
      projectIdToSave = staffLevel2Id;
       if (!staffProjectId || !staffLevel1Id || !staffLevel2Id) {
          alert('Please select a Project, Level 1, and Level 2 location.');
          return;
      }
    }
    
    const hours = status === ManpowerStatus.ACTIVE ? Number(hoursWorked) : 0;
    if (status === ManpowerStatus.ACTIVE) {
        if (hoursWorked === '' || isNaN(Number(hoursWorked))) {
            alert('Hours Worked is mandatory and must be a number for Active status.');
            return;
        }
        if (hours <= 0 || hours > 24) {
          alert('Working hours must be greater than 0 and no more than 24.');
          return;
        }
    }
    
    const recordsForEmployeeOnDate = allRecords.filter(r => 
        r.empId === foundEmployee.empId && r.date === date && r.id !== recordToEdit?.id
    );
    const existingHours = recordsForEmployeeOnDate.reduce((sum, r) => sum + (r.hoursWorked || 0), 0);

    if (existingHours + hours > 24) {
        alert(`This record exceeds the 24-hour limit for this employee on this date. They have already worked ${existingHours} hours.`);
        return;
    }

    const recordData = {
      empId: foundEmployee.empId,
      name: foundEmployee.name,
      profession: foundEmployee.profession,
      nationality: foundEmployee.nationality,
      status, 
      subcontractor,
      hoursWorked: hours, 
      date, 
      project: projectIdToSave!, 
      shift,
    };

    if (isEditMode && recordToEdit) {
        onEdit({ ...recordData, id: recordToEdit.id });
    } else {
        onAdd(recordData);
    }
  };
  
  const inputStyles = "mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#28a745] focus:border-[#28a745] sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100";
  const labelStyles = "block text-sm font-medium text-slate-700 dark:text-slate-300";
  const RequiredIndicator = () => <span className="text-red-500 ml-1">*</span>;

  const tabClass = (tabName: 'direct' | 'staff') => 
    `whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm cursor-pointer ${
    activeTab === tabName
      ? 'border-[#28a745] text-[#28a745]'
      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:border-slate-600'
  }`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl">
        <div className="px-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center">
             <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-white">{isEditMode ? 'Edit Manpower Record' : 'Add New Manpower Record'}</h3>
             <button onClick={onClose} className="text-slate-400 hover:text-slate-500 p-2 -mr-2">
                <XCircleIcon className="h-6 w-6" />
             </button>
          </div>
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            <button onClick={() => setActiveTab('direct')} className={tabClass('direct')}>Direct Manpower</button>
            <button onClick={() => setActiveTab('staff')} className={tabClass('staff')}>Staff Attendance</button>
          </nav>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
            {/* Common Fields */}
            <div>
                <label htmlFor="date" className={labelStyles}>Date<RequiredIndicator /></label>
                <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} required className={inputStyles} max={new Date().toISOString().split('T')[0]}/>
            </div>
             <div className="relative">
                <label htmlFor="empId" className={labelStyles}>Employee ID / Iqama<RequiredIndicator /></label>
                <input type="text" id="empId" value={employeeSearch} onChange={(e) => setEmployeeSearch(e.target.value)} onBlur={findEmployee} required className={`${inputStyles} pr-10`} disabled={isEditMode} />
                <div className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center pointer-events-none">
                    {employeeStatus === 'valid' && <CheckCircleIcon className="h-5 w-5 text-green-500" />}
                    {employeeStatus === 'invalid' && <XCircleIcon className="h-5 w-5 text-red-500" />}
                </div>
            </div>
             {employeeStatus === 'invalid' && <p className="text-xs text-red-500 -mt-2">Employee not found. Please define them in the settings first.</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                <label htmlFor="name" className={labelStyles}>Name</label>
                <input type="text" id="name" value={name} readOnly className={`${inputStyles} bg-slate-100 dark:bg-slate-800 cursor-not-allowed`} />
              </div>
               <div>
                <label htmlFor="profession" className={labelStyles}>Profession</label>
                <input type="text" id="profession" value={profession} readOnly className={`${inputStyles} bg-slate-100 dark:bg-slate-800 cursor-not-allowed`} />
              </div>
            </div>

            {/* Tab-specific fields */}
            {activeTab === 'direct' && (
                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div>
                        <label htmlFor="project" className={labelStyles}>Project<RequiredIndicator /></label>
                        <select id="project" value={directRootProjectId || ''} onChange={handleDirectRootProjectChange} required className={inputStyles}>
                            <option value="" disabled>Select a project</option>
                            {rootProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="originalSubcontractor" className={labelStyles}>Original Subcontractor</label>
                        <input type="text" id="originalSubcontractor" value={foundEmployee?.subcontractor || ''} readOnly className={`${inputStyles} bg-slate-100 dark:bg-slate-800 cursor-not-allowed`} />
                     </div>
                    <div className="flex items-center space-x-4 pt-2">
                        <label className={labelStyles}>Supporting Another Subcontractor?</label>
                        <label htmlFor="supporting-toggle" className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="supporting-toggle" className="sr-only peer" checked={isSupporting} onChange={(e) => handleToggleSupporting(e.target.checked)} disabled={!foundEmployee} />
                            <div className="w-11 h-6 bg-slate-200 dark:bg-slate-600 rounded-full peer peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-500 peer-checked:bg-[#28a745]"></div>
                        </label>
                    </div>
                    {isSupporting && (
                    <div>
                        <label htmlFor="subcontractor" className={labelStyles}>Supporting Subcontractor<RequiredIndicator /></label>
                        <select id="subcontractor" value={subcontractor} onChange={(e) => setSubcontractor(e.target.value)} required className={inputStyles}>
                            <option value="" disabled>Select a subcontractor</option>
                            {supportingSubcontractorList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                    </div>
                    )}
                    {!isSupporting && (
                        <div>
                            <label htmlFor="activity" className={labelStyles}>Activity<RequiredIndicator /></label>
                            <ProjectTreeSelect projects={projectsForTree} selectedId={directActivityId} onSelect={setDirectActivityId} placeholder="Select an activity..." selectableNodeTypes={['Activity']} className="mt-1"/>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'staff' && (
                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className={labelStyles}>Project <RequiredIndicator/></label>
                            <select value={staffProjectId || ''} onChange={e => { setStaffProjectId(e.target.value); setStaffLevel1Id(null); setStaffLevel2Id(null); }} className={inputStyles}>
                                <option value="" disabled>Select Project</option>
                                {rootProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelStyles}>Level 1 <RequiredIndicator/></label>
                            <select value={staffLevel1Id || ''} onChange={e => { setStaffLevel1Id(e.target.value); setStaffLevel2Id(null); }} disabled={!staffProjectId} className={inputStyles}>
                                <option value="" disabled>Select Level 1</option>
                                {level1Options.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelStyles}>Level 2 <RequiredIndicator/></label>
                            <select value={staffLevel2Id || ''} onChange={e => setStaffLevel2Id(e.target.value)} disabled={!staffLevel1Id} className={inputStyles}>
                                <option value="" disabled>Select Level 2</option>
                                {level2Options.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Common Status/Hours Fields */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <label htmlFor="status" className={labelStyles}>Status<RequiredIndicator /></label>
                <select id="status" value={status} onChange={(e) => setStatus(e.target.value as ManpowerStatus)} required className={inputStyles}>
                  {Object.values(ManpowerStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
            {status === ManpowerStatus.ACTIVE && (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="hoursWorked" className={labelStyles}>Hours Worked<RequiredIndicator /></label>
                        <input type="number" id="hoursWorked" value={hoursWorked} onChange={(e) => setHoursWorked(e.target.value === '' ? '' : parseFloat(e.target.value))} className={inputStyles} step="0.5" min="0.5" max="24" required />
                    </div>
                    <div>
                        <label htmlFor="shift" className={labelStyles}>Shift<RequiredIndicator /></label>
                        <select id="shift" value={shift} onChange={(e) => setShift(e.target.value as Shift)} required className={inputStyles}>
                        {Object.values(Shift).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
            )}
          </div>
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 text-right space-x-3">
            <button type="button" onClick={onClose} className="inline-flex justify-center py-2 px-4 border border-slate-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700">
              Cancel
            </button>
            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#28a745] hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#28a745]">
              {isEditMode ? 'Save Changes' : 'Add Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddManpowerModal;