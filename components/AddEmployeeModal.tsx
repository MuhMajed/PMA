import React, { useState, useEffect, useMemo } from 'react';
import { Employee, EmployeeType, Subcontractor } from '../types';
import { NATIONALITIES } from '../constants';
import Modal from './ui/Modal';
import { useMessage } from './ConfirmationProvider';

interface AddEmployeeModalProps {
  onClose: () => void;
  onAdd: (employee: Omit<Employee, 'id'>) => void;
  onEdit: (employee: Employee) => void;
  employeeToEdit: Employee | null;
  professions: string[];
  subcontractors: Subcontractor[];
  departments: string[];
}

const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ 
    onClose, onAdd, onEdit, employeeToEdit, professions, subcontractors, departments
}) => {
  const [empId, setEmpId] = useState('');
  const [name, setName] = useState('');
  const [idIqama, setIdIqama] = useState('');
  const [department, setDepartment] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState<EmployeeType>('Direct');
  const [profession, setProfession] = useState(professions[0] || '');
  const [nationality, setNationality] = useState(NATIONALITIES[0] || '');
  const [subcontractor, setSubcontractor] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [isSbgEmployee, setIsSbgEmployee] = useState(false);
  const { showError } = useMessage();

  const isEditMode = !!employeeToEdit;

  const otherSubcontractors = useMemo(() => 
    subcontractors.filter(s => s.name !== 'Saudi Bin Ladin Group'),
    [subcontractors]
  );

  useEffect(() => {
    if (isEditMode) {
      setEmpId(employeeToEdit.empId);
      setName(employeeToEdit.name);
      setIdIqama(employeeToEdit.idIqama);
      setDepartment(employeeToEdit.department);
      setEmail(employeeToEdit.email || '');
      setPhone(employeeToEdit.phone);
      setType(employeeToEdit.type);
      setProfession(employeeToEdit.profession);
      setNationality(employeeToEdit.nationality);
      setSubcontractor(employeeToEdit.subcontractor);
      setJoiningDate(employeeToEdit.joiningDate || '');
      setIsSbgEmployee(employeeToEdit.subcontractor === 'Saudi Bin Ladin Group');
    } else {
      // Set default for new employee
      setSubcontractor(otherSubcontractors[0]?.name || '');
      setDepartment(departments[0] || '');
    }
  }, [employeeToEdit, isEditMode, otherSubcontractors, departments]);


  const handleToggleSbg = (checked: boolean) => {
    setIsSbgEmployee(checked);
    if (checked) {
        setSubcontractor('Saudi Bin Ladin Group');
    } else {
        setSubcontractor(otherSubcontractors[0]?.name || '');
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empId || !name || !profession || !nationality || !idIqama || !department || !phone || !type || !subcontractor) {
      showError('Missing Information', 'Please fill all mandatory fields marked with an asterisk (*).');
      return;
    }

    const employeeData = { 
        empId, name, profession, nationality, idIqama, department, 
        email: email || undefined, 
        phone, type, subcontractor, 
        joiningDate: joiningDate || undefined 
    };
    if (isEditMode) {
        onEdit({ ...employeeData, id: employeeToEdit.id, createdBy: employeeToEdit.createdBy });
    } else {
        onAdd(employeeData);
    }
    onClose();
  };
  
  const inputStyles = "mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#28a745] focus:border-[#28a745] sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100";
  const labelStyles = "block text-sm font-medium text-slate-700 dark:text-slate-300";
  const RequiredIndicator = () => <span className="text-red-500 ml-1">*</span>;

  return (
    <Modal title={isEditMode ? 'Edit Employee' : 'Add New Employee'} onClose={onClose} size="4xl">
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="empId" className={labelStyles}>Employee ID<RequiredIndicator /></label>
                <input type="text" id="empId" value={empId} onChange={(e) => setEmpId(e.target.value)} required className={inputStyles} />
              </div>
              <div>
                <label htmlFor="name" className={labelStyles}>Name<RequiredIndicator /></label>
                <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className={inputStyles} />
              </div>
               <div>
                <label htmlFor="joiningDate" className={labelStyles}>Joining Date</label>
                <input type="date" id="joiningDate" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} className={inputStyles} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="idIqama" className={labelStyles}>ID/Iqama<RequiredIndicator /></label>
                <input type="text" id="idIqama" value={idIqama} onChange={(e) => setIdIqama(e.target.value)} required className={inputStyles} />
              </div>
              <div>
                <label htmlFor="department" className={labelStyles}>Department<RequiredIndicator /></label>
                <input type="text" id="department" value={department} onChange={(e) => setDepartment(e.target.value)} required className={inputStyles} list="department-list" />
                 <datalist id="department-list">
                    {departments.map(d => <option key={d} value={d} />)}
                </datalist>
              </div>
              <div>
                <label htmlFor="email" className={labelStyles}>Email</label>
                <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputStyles} />
              </div>
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                    <label htmlFor="phone" className={labelStyles}>Phone<RequiredIndicator /></label>
                    <input type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required className={inputStyles} />
                </div>
                <div>
                    <label htmlFor="profession" className={labelStyles}>Profession<RequiredIndicator /></label>
                    <select id="profession" value={profession} onChange={(e) => setProfession(e.target.value)} required className={inputStyles}>
                    {professions.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="nationality" className={labelStyles}>Nationality<RequiredIndicator /></label>
                    <input type="text" id="nationality" value={nationality} onChange={(e) => setNationality(e.target.value)} required className={inputStyles} list="nationality-list" />
                    <datalist id="nationality-list">
                        {NATIONALITIES.map(n => <option key={n} value={n} />)}
                    </datalist>
                </div>
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                    <label htmlFor="type" className={labelStyles}>Type<RequiredIndicator /></label>
                    <select id="type" value={type} onChange={(e) => setType(e.target.value as EmployeeType)} required className={inputStyles}>
                        <option value="Direct">Direct</option>
                        <option value="Indirect">Indirect</option>
                    </select>
                </div>
                 <div>
                    <label className={labelStyles}>SBG Employee</label>
                    <div className="mt-1 flex items-center h-[38px]">
                        <label htmlFor="sbg-toggle" className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="sbg-toggle" className="sr-only peer" checked={isSbgEmployee} onChange={(e) => handleToggleSbg(e.target.checked)} />
                            <div className="w-11 h-6 bg-slate-200 dark:bg-slate-600 rounded-full peer peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-500 peer-checked:bg-[#28a745]"></div>
                            <span className="ml-3 text-sm font-medium text-slate-900 dark:text-slate-300">{isSbgEmployee ? 'Yes' : 'No'}</span>
                        </label>
                    </div>
                </div>
                {!isSbgEmployee ? (
                    <div>
                        <label htmlFor="subcontractor" className={labelStyles}>Subcontractor<RequiredIndicator /></label>
                        <select id="subcontractor" value={subcontractor} onChange={(e) => setSubcontractor(e.target.value)} required className={inputStyles}>
                        <option value="" disabled>Select Subcontractor</option>
                        {otherSubcontractors.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                    </div>
                ) : <div />}
            </div>
          </div>
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 text-right space-x-3">
            <button type="button" onClick={onClose} className="inline-flex justify-center py-2 px-4 border border-slate-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700">
              Cancel
            </button>
            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#28a745] hover:bg-green-700">
              {isEditMode ? 'Save Changes' : 'Add Employee'}
            </button>
          </div>
        </form>
    </Modal>
  );
};

export default AddEmployeeModal;