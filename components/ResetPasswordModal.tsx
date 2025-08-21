
import React, { useState } from 'react';
import { User } from '../types';
import Modal from './ui/Modal';

interface ResetPasswordModalProps {
  user: User | null;
  onClose: () => void;
  onReset: (userId: string, newPassword: string) => void;
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({ user, onClose, onReset }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  if (!user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Password cannot be empty.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    onReset(user.id, password);
    onClose();
  };

  const labelStyles = "block text-sm font-medium text-slate-700 dark:text-slate-300";
  const inputStyles = "mt-1 block w-full border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#28a745] focus:border-[#28a745] sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100";

  return (
    <Modal title={`Reset Password for ${user.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Enter a new password for the user. They will be required to use this new password at their next login.
          </p>
          <div>
            <label htmlFor="newPassword" className={labelStyles}>New Password</label>
            <input
              type="password"
              id="newPassword"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              className={inputStyles}
            />
          </div>
          <div>
            <label htmlFor="confirmNewPassword" className={labelStyles}>Confirm New Password</label>
            <input
              type="password"
              id="confirmNewPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className={inputStyles}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
           <p className="text-xs text-slate-500 dark:text-slate-400 text-center pt-2">
            An email notification will be sent to the user to inform them that their password has been reset by an administrator.
          </p>
        </div>
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 text-right space-x-3">
          <button type="button" onClick={onClose} className="inline-flex justify-center py-2 px-4 border border-slate-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700">
            Cancel
          </button>
          <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#28a745] hover:bg-green-700">
            Reset Password &amp; Notify User
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ResetPasswordModal;