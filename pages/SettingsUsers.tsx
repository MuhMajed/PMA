

import React, { useState, useMemo } from 'react';
import { User, UserRole, Employee, Project } from '../types';
import PageHeader from '../components/ui/PageHeader';
import { PlusIcon } from '../components/icons/PlusIcon';
import { PencilIcon } from '../components/icons/PencilIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { KeyIcon } from '../components/icons/KeyIcon';
import AddUserModal from '../components/AddUserModal';
import ResetPasswordModal from '../components/ResetPasswordModal';
import { useMessage } from '../components/ConfirmationProvider';
import Tooltip from '../components/ui/Tooltip';
import { ChevronUpDownIcon } from '../components/icons/ChevronUpDownIcon';

interface SettingsUsersProps {
    users: User[];
    employees: Employee[];
    projects: Project[];
    onAdd: (user: Omit<User, 'id'>) => void;
    onUpdate: (user: User) => void;
    onDelete: (id: string) => void;
    onAdminResetPassword: (userId: string, newPassword: string) => void;
    currentUser: User;
}

const roleColors: Record<UserRole, string> = {
    Admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    'Project Manager': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    'Data Entry': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    // FIX: Add missing 'Safety' role to satisfy the UserRole type.
    Safety: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
};

type SortDirection = 'ascending' | 'descending';
interface SortConfig {
  key: keyof User;
  direction: SortDirection;
}

const useSortableData = (items: User[], config: SortConfig | null = null) => {
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(config);
  const sortedItems = useMemo(() => {
    let sortableItems = [...items];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [items, sortConfig]);
  const requestSort = (key: keyof User) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
    setSortConfig({ key, direction });
  };
  return { items: sortedItems, requestSort, sortConfig };
};

const SortableHeader: React.FC<{ sortKey: keyof User, title: string, requestSort: (key: any) => void, sortConfig: SortConfig | null }> = ({ sortKey, title, requestSort, sortConfig }) => {
    const isSorted = sortConfig?.key === sortKey;
    return (
        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort(sortKey)}>
            <div className="flex items-center">
                <span>{title}</span>
                <ChevronUpDownIcon className={`h-4 w-4 ml-1.5 ${isSorted ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`} />
            </div>
        </th>
    );
};


const SettingsUsers: React.FC<SettingsUsersProps> = ({ users, employees, projects, onAdd, onUpdate, onDelete, onAdminResetPassword, currentUser }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [userToReset, setUserToReset] = useState<User | null>(null);
    const [filter, setFilter] = useState('');
    const { showConfirmation, showError } = useMessage();
    
    const openModal = (user: User | null) => { setUserToEdit(user); setIsModalOpen(true); };
    const closeModal = () => { setIsModalOpen(false); setUserToEdit(null); };
    const openResetModal = (user: User) => { setUserToReset(user); setIsResetModalOpen(true); };
    const closeResetModal = () => { setIsResetModalOpen(false); setUserToReset(null); };
    
    const handleDelete = (user: User) => {
        if (user.id === currentUser.id) {
            showError("Action Denied", "You cannot delete your own account.");
            return;
        }
        showConfirmation(
            'Delete User',
            `Are you sure you want to delete the user "${user.name}"?\nThis action cannot be undone.`,
            () => onDelete(user.id)
        );
    };

    const filteredUsers = useMemo(() => users.filter(user => 
        user.name.toLowerCase().includes(filter.toLowerCase()) ||
        user.username.toLowerCase().includes(filter.toLowerCase()) ||
        user.role.toLowerCase().includes(filter.toLowerCase()) ||
        user.empId.toLowerCase().includes(filter.toLowerCase()) ||
        user.email.toLowerCase().includes(filter.toLowerCase())
    ), [users, filter]);
    
    const { items: sortedUsers, requestSort, sortConfig } = useSortableData(filteredUsers, { key: 'name', direction: 'ascending'});

    const projectsById = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Settings: Users"
                subtitle="Manage application users and their access levels."
            >
                <button onClick={() => openModal(null)} className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#28a745] hover:bg-green-700">
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add User
                </button>
            </PageHeader>

             <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                <input 
                    type="text" 
                    placeholder="Filter by name, Emp ID, email, username, or role..." 
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="block w-full max-w-lg border-slate-300 dark:border-slate-600 rounded-md shadow-sm bg-white dark:bg-slate-700 focus:ring-[#28a745] focus:border-[#28a745] sm:text-sm" />
            </div>

            <div className="bg-white dark:bg-slate-800 shadow-sm rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-700">
                            <tr>
                                <SortableHeader sortKey="name" title="Name" requestSort={requestSort} sortConfig={sortConfig} />
                                <SortableHeader sortKey="empId" title="Emp ID" requestSort={requestSort} sortConfig={sortConfig} />
                                <SortableHeader sortKey="email" title="Email" requestSort={requestSort} sortConfig={sortConfig} />
                                <SortableHeader sortKey="username" title="Username" requestSort={requestSort} sortConfig={sortConfig} />
                                <SortableHeader sortKey="role" title="Role" requestSort={requestSort} sortConfig={sortConfig} />
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Assigned Projects</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                            {sortedUsers.map((user) => {
                                const assignedProjectNames = (user.assignedProjects || [])
                                    .map(id => projectsById.get(id)?.name)
                                    .filter(Boolean)
                                    .join(', ');
                                
                                const assignedIdsSet = new Set(user.assignedProjects || []);
                                const topLevelAssignmentCount = (user.assignedProjects || []).filter(id => {
                                    const project = projectsById.get(id);
                                    return !project?.parentId || !assignedIdsSet.has(project.parentId);
                                }).length;

                                return (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">{user.name}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{user.empId}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{user.email}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{user.username}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${roleColors[user.role]}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                        {(!user.assignedProjects || user.assignedProjects.length === 0) ? (
                                             <span className="italic">All Projects</span>
                                        ) : (
                                            <Tooltip content={assignedProjectNames}>
                                                <span>{topLevelAssignmentCount} assignment(s)</span>
                                            </Tooltip>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-medium space-x-4">
                                        <button onClick={() => openResetModal(user)} className="text-yellow-600 hover:text-yellow-800" title="Reset Password"><KeyIcon className="h-5 w-5 pointer-events-none" /></button>
                                        <button onClick={() => openModal(user)} className="text-[#28a745] hover:text-green-700" title="Edit User"><PencilIcon className="h-5 w-5 pointer-events-none" /></button>
                                        <Tooltip content={user.id === currentUser.id ? "You cannot delete your own account" : ''}>
                                            <button 
                                                onClick={() => handleDelete(user)}
                                                disabled={user.id === currentUser.id}
                                                className="text-red-600 hover:text-red-900 disabled:text-slate-300 dark:disabled:text-slate-600 disabled:cursor-not-allowed"
                                            >
                                                <TrashIcon className="h-5 w-5 pointer-events-none" />
                                            </button>
                                        </Tooltip>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <AddUserModal
                    onClose={closeModal}
                    onAdd={onAdd}
                    onEdit={onUpdate}
                    userToEdit={userToEdit}
                    allUsers={users}
                    employees={employees}
                    projects={projects}
                />
            )}
            {isResetModalOpen && (
                <ResetPasswordModal
                    user={userToReset}
                    onClose={closeResetModal}
                    onReset={onAdminResetPassword}
                />
            )}
        </div>
    );
};

export default SettingsUsers;