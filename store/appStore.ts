import { create } from 'zustand';
import { User, Page, Theme } from '../types';
import * as api from '../utils/api';

export interface AppState {
  currentPage: Page;
  theme: Theme;
  currentUser: User | null;

  setCurrentPage: (page: Page) => void;
  setTheme: (theme: Theme) => void;
  
  login: (credentials: { emailOrEmpId: string, password: string }) => Promise<boolean>;
  logout: () => void;
  forgotPasswordRequest: (emailOrEmpId: string) => Promise<boolean>;
  passwordResetWithCode: (emailOrEmpId: string, code: string, newPassword: string) => Promise<boolean>;
}

export const useStore = create<AppState>((set) => ({
  // State
  currentPage: 'dashboard',
  theme: (() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    return (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) ? 'dark' : 'light';
  })(),
  currentUser: null,

  // Actions
  setCurrentPage: (page) => set({ currentPage: page }),
  setTheme: (theme) => set({ theme }),

  login: async ({ emailOrEmpId, password }) => {
    const user = await api.findUserForLogin({ emailOrEmpId, password });
    if (user) {
        const { password, ...userToStore } = user;
        set({
            currentUser: userToStore,
            currentPage: user.role === 'Data Entry' ? 'manpower-records' : 'dashboard'
        });
        return true;
    }
    return false;
  },
  logout: () => set({ currentUser: null }),
  forgotPasswordRequest: async (emailOrEmpId) => {
    return api.findUserForPasswordReset(emailOrEmpId);
  },
  passwordResetWithCode: async (emailOrEmpId, code, newPassword) => {
    return api.userResetPassword({ emailOrEmpId, code, newPassword });
  },
}));