

import React, { useState, useEffect } from 'react';
import { User, UserRole, Employee, Project } from '../types';
import Modal from './ui/Modal';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { ProjectMultiSelectFilter } from './ProjectMultiSelectFilter';

interface AddUserModalProps {
  onClose: () => void;
  onAdd: (user: Omit<User, 'id'>) => void;
  onEdit: (user: User) => void;
  userToEdit: User | null;
  allUsers: User[];
  employees: Employee[];
  projects: Project[];
}

const AddUserModal: React.FC<AddUserModalProps> = ({ onClose, onAdd, onEdit, userToEdit, allUsers, employees, projects }) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('Data Entry');
  const [empId, setEmpId] = useState('');
  const [email, setEmail] = useState('');
  const [employeeStatus, setEmployeeStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [assignedProjects, setAssignedProjects] = useState<string[]>([]);

  const isEditMode = !!userToEdit;

  useEffect(() => {
    if (isEditMode) {
      setName(userToEdit.name);
      setUsername(userToEdit.username);
      setRole(userToEdit.role);
      setEmpId(userToEdit.empId);
      setEmail(userToEdit.email);
      setPassword('');
      setConfirmPassword('');
      setAssignedProjects(userToEdit.assignedProjects || []);
      // Since it's edit mode, we assume the employee is valid
      setEmployeeStatus('valid');
    }
  }, [userToEdit, isEditMode]);

  const handleFindEmployee = (searchId: string) => {
      if (!searchId) {
          setEmployeeStatus('idle');
          setName('');
          setEmail('');
          return;
      }

      const employee = employees.find(e => e.empId.toLowerCase() === searchId.toLowerCase());
      if (employee) {
          const userAlreadyExists = allUsers.some(u => u.empId.toLowerCase() === searchId.toLowerCase() && u.id !== userToEdit?.id);
          if (userAlreadyExists) {
              setEmployeeStatus('invalid');
              setName('');
              setEmail('');
              alert('An application user account already exists for this Employee ID.');
          } else {
              setEmployeeStatus('valid');
              setName(employee.name);
              setEmail(employee.email || '');
          }
      } else {
          setEmployeeStatus('invalid');
          setName('');
          setEmail('');
      }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (employeeStatus !== 'valid') {
        alert('Please enter a valid Employee ID that is registered in the employee master list.');
        return;
    }
    
    const usernameExists = allUsers.some(
        u => u.username.toLowerCase() === username.toLowerCase() && u.id !== userToEdit?.id
    );
    if (usernameExists) {
        alert('This username is already taken. Please choose another.');
        return;
    }

    if (!isEditMode) { // Adding a new user
        if (!password) {
            alert('Password is required for new users.');
            return;
        }
        if (password !== confirmPassword) {
            alert('Passwords do not match.');
            return;
        }
    } else { // Editing an existing user
        if (password && password !== confirmPassword) {
            alert('Passwords do not match.');
            return;
        }
    }

    const userData = { name, username, empId, email, role, password: password || undefined, assignedProjects };
    
    if (isEditMode) {
        onEdit({ ...userToEdit, ...userData });
    } else {
        onAdd(userData as Omit<User, 'id'>);
    }
    onClose();
  };
  
  const inputStyles = "mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#28a745] focus:border-[#28a745] sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100";
  const labelStyles = "block text-sm font-medium text-slate-700 dark:text-slate-300";
  const RequiredIndicator = () => <span className="text-red-500 ml-1">*</span>;

  return (
    <Modal title={isEditMode ? 'Edit User' : 'Add New User'} onClose={onClose} size="3xl">
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
             <div>
                <label htmlFor="empId" className={labelStyles}>Employee ID<RequiredIndicator /></label>
                <div className="relative">
                    <input 
                        type="text" 
                        id="empId" 
                        value={empId} 
                        onChange={(e) => setEmpId(e.target.value)}
                        onBlur={(e) => handleFindEmployee(e.target.value)}
                        required 
                        disabled={isEditMode}
                        className={`${inputStyles} pr-10`} 
                    />
                    <div className="absolute inset-y-0 right-0 top-0 pr-3 flex items-center pointer-events-none">
                        {employeeStatus === 'valid' && <CheckCircleIcon className="h-5 w-5 text-green-500" />}
                        {employeeStatus === 'invalid' && <XCircleIcon className="h-5 w-5 text-red-500" />}
                    </div>
                </div>
                {employeeStatus === 'invalid' && <p className="text-xs text-red-500 mt-1">Employee not found. Please define them in the Settings first.</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="name" className={labelStyles}>Full Name</label>
                    <input type="text" id="name" value={name} readOnly className={`${inputStyles} bg-slate-100 dark:bg-slate-800 cursor-not-allowed`} />
                </div>
                 <div>
                    <label htmlFor="email" className={labelStyles}>Email</label>
                    <input type="email" id="email" value={email} readOnly className={`${inputStyles} bg-slate-100 dark:bg-slate-800 cursor-not-allowed`} />
                </div>
            </div>
            
            <hr className="border-slate-200 dark:border-slate-700" />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="username" className={labelStyles}>Username<RequiredIndicator /></label>
                    <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} required className={inputStyles} />
                </div>
                <div>
                    <label htmlFor="role" className={labelStyles}>Role<RequiredIndicator /></label>
                    <select id="role" value={role} onChange={(e) => setRole(e.target.value as UserRole)} required className={inputStyles}>
                        <option value="Admin">Admin</option>
                        <option value="Project Manager">Project Manager</option>
                        <option value="Data Entry">Data Entry</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="password" className={labelStyles}>
                        Password {isEditMode ? '(leave blank to keep unchanged)' : <RequiredIndicator />}
                    </label>
                    <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputStyles} />
                </div>
                <div>
                    <label htmlFor="confirmPassword" className={labelStyles}>
                        Confirm Password { !isEditMode && <RequiredIndicator />}
                    </label>
                    <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputStyles} />
                </div>
            </div>
            
            <hr className="border-slate-200 dark:border-slate-700" />

            <div>
                <label className={labelStyles}>Assigned Projects</label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-2">Assign user to specific projects. Leave empty to grant access to all projects.</p>
                <ProjectMultiSelectFilter 
                    projects={projects}
                    selectedIds={assignedProjects}
                    onSelectionChange={setAssignedProjects}
                />
            </div>


          </div>
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 text-right space-x-3">
            <button type="button" onClick={onClose} className="inline-flex justify-center py-2 px-4 border border-slate-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700">
              Cancel
            </button>
            <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#28a745] hover:bg-green-700">
              {isEditMode ? 'Save Changes' : 'Add User'}
            </button>
          </div>
        </form>
    </Modal>
  );
};

export default AddUserModal;