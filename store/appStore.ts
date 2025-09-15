import { create } from 'zustand';
import { User, Page, Theme } from '../types';
import * as api from '../utils/api';

export interface AppState {
  currentPage: Page;
  theme: Theme;
  currentUser: User | null;
  sharedFilters: {
    selectedProjects: string[];
    dateRange: { start: string, end: string };
    selectedActivityGroups: string[];
  };
  isFilterInitialized: boolean;

  setCurrentPage: (page: Page) => void;
  setTheme: (theme: Theme) => void;
  setSharedFilters: (filters: Partial<AppState['sharedFilters']>) => void;
  setIsFilterInitialized: (isInitialized: boolean) => void;
  
  login: (credentials: { emailOrEmpId: string, password: string }) => Promise<boolean>;
  logout: () => void;
  forgotPasswordRequest: (emailOrEmpId: string) => Promise<boolean>;
  passwordResetWithCode: (emailOrEmpId: string, code: string, newPassword: string) => Promise<boolean>;
}

const getInitialDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 29); // Last 30 days
    return {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
    };
};

export const useStore = create<AppState>((set) => ({
  // State
  currentPage: 'dashboard',
  theme: (() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    return (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) ? 'dark' : 'light';
  })(),
  currentUser: null,
  sharedFilters: {
    selectedProjects: [], // Initialized in App.tsx after projects load
    dateRange: getInitialDateRange(),
    selectedActivityGroups: [],
  },
  isFilterInitialized: false,


  // Actions
  setCurrentPage: (page) => set({ currentPage: page }),
  setTheme: (theme) => set({ theme }),
  setSharedFilters: (filters) => set(state => ({ sharedFilters: { ...state.sharedFilters, ...filters } })),
  setIsFilterInitialized: (isInitialized) => set({ isFilterInitialized: isInitialized }),

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