

import React, { useState, useMemo } from 'react';
import { User, UserRole, Employee } from '../types';
import PageHeader from '../components/ui/PageHeader';
import { PlusIcon } from '../components/icons/PlusIcon';
import { PencilIcon } from '../components/icons/PencilIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { KeyIcon } from '../components/icons/KeyIcon';
import AddUserModal from '../components/AddUserModal';
import ResetPasswordModal from '../components/ResetPasswordModal';
import { useConfirmation } from '../components/ConfirmationProvider';
import Tooltip from '../components/ui/Tooltip';

interface SettingsUsersProps {
    users: User[];
    employees: Employee[];
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
};

const SettingsUsers: React.FC<SettingsUsersProps> = ({ users, employees, onAdd, onUpdate, onDelete, onAdminResetPassword, currentUser }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [userToReset, setUserToReset] = useState<User | null>(null);
    const [filter, setFilter] = useState('');
    const { showConfirmation } = useConfirmation();
    
    const openModal = (user: User | null) => {
        setUserToEdit(user);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setUserToEdit(null);
    };

    const openResetModal = (user: User) => {
        setUserToReset(user);
        setIsResetModalOpen(true);
    };

    const closeResetModal = () => {
        setIsResetModalOpen(false);
        setUserToReset(null);
    };
    
    const handleDelete = (user: User) => {
        if (user.id === currentUser.id) {
            alert("You cannot delete your own account.");
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Emp ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Username</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-300 uppercase">Role</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredUsers.map((user) => (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">{user.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{user.empId}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{user.username}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${roleColors[user.role]}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
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
                            ))}
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
