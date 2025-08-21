import React, { useState, createContext, useContext, useCallback, useMemo } from 'react';

// Context Definition
type ConfirmationContextType = {
  showConfirmation: (title: string, message: string, onConfirm: () => void) => void;
};
const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);
export const useConfirmation = () => {
    const context = useContext(ConfirmationContext);
    if (!context) throw new Error('useConfirmation must be used within a ConfirmationProvider');
    return context;
};

// Modal Component
interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}
const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, title, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" aria-modal="true" role="dialog">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md animate-fade-in-up">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-white">{title}</h3>
            </div>
            <div className="p-6">
                <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{message}</p>
            </div>
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 flex justify-end items-center space-x-3">
                <button type="button" onClick={onCancel} className="inline-flex justify-center py-2 px-4 border border-slate-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#28a745]">
                    Cancel
                </button>
                <button type="button" onClick={onConfirm} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                    Confirm
                </button>
            </div>
          </div>
           <style>{`
                @keyframes fade-in-up {
                    0% {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};


// Provider Component
interface ConfirmationState {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
}
export const ConfirmationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [confirmationState, setConfirmationState] = useState<ConfirmationState>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
    });

    const showConfirmation = useCallback((title: string, message: string, onConfirm: () => void) => {
        setConfirmationState({ isOpen: true, title, message, onConfirm });
    }, []);

    const handleCancel = () => {
        setConfirmationState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
    };

    const handleConfirm = () => {
        confirmationState.onConfirm();
        handleCancel();
    };

    const contextValue = useMemo(() => ({ showConfirmation }), [showConfirmation]);

    return (
        <ConfirmationContext.Provider value={contextValue}>
            {children}
            <ConfirmationModal 
                isOpen={confirmationState.isOpen}
                title={confirmationState.title}
                message={confirmationState.message}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        </ConfirmationContext.Provider>
    );
};
