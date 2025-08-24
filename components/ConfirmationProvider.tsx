import React, { useState, createContext, useContext, useCallback, useMemo } from 'react';
import { XCircleIcon } from './icons/XCircleIcon';
import { InformationCircleIcon } from './icons/InformationCircleIcon';

type MessageType = 'confirmation' | 'error' | 'info';

type MessageContextType = {
  showConfirmation: (title: string, message: string, onConfirm: () => void) => void;
  showError: (title: string, message: string) => void;
  showMessage: (title: string, message: string) => void;
};

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const useMessage = () => {
    const context = useContext(MessageContext);
    if (!context) throw new Error('useMessage must be used within a MessageProvider');
    return context;
};

interface MessageModalProps {
    isOpen: boolean;
    type: MessageType;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const MessageModal: React.FC<MessageModalProps> = ({ isOpen, type, title, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;
    
    const isConfirmation = type === 'confirmation';
    const primaryButtonColor = isConfirmation ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : 'bg-[#28a745] hover:bg-green-700 focus:ring-[#28a745]';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[100] flex justify-center items-center p-4" aria-modal="true" role="dialog">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md animate-fade-in-up">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center space-x-3">
              {type === 'error' && <XCircleIcon className="h-6 w-6 text-red-500" />}
              {type === 'info' && <InformationCircleIcon className="h-6 w-6 text-blue-500" />}
              <h3 className="text-lg leading-6 font-medium text-slate-900 dark:text-white">{title}</h3>
            </div>
            <div className="p-6">
                <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{message}</p>
            </div>
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 flex justify-end items-center space-x-3">
                {isConfirmation && (
                  <button type="button" onClick={onCancel} className="inline-flex justify-center py-2 px-4 border border-slate-300 dark:border-slate-600 shadow-sm text-sm font-medium rounded-md text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500">
                      Cancel
                  </button>
                )}
                <button type="button" onClick={onConfirm} className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${primaryButtonColor}`}>
                    {isConfirmation ? 'Confirm' : 'OK'}
                </button>
            </div>
          </div>
           <style>{`
                @keyframes fade-in-up {
                    0% { opacity: 0; transform: translateY(20px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

interface MessageState {
    isOpen: boolean;
    type: MessageType;
    title: string;
    message: string;
    onConfirm: () => void;
}

export const MessageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<MessageState>({
        isOpen: false,
        type: 'info',
        title: '',
        message: '',
        onConfirm: () => {},
    });

    const resetState = () => {
        setState({ isOpen: false, type: 'info', title: '', message: '', onConfirm: () => {} });
    };

    const showConfirmation = useCallback((title: string, message: string, onConfirm: () => void) => {
        setState({ isOpen: true, type: 'confirmation', title, message, onConfirm });
    }, []);
    
    const showError = useCallback((title: string, message: string) => {
        setState({ isOpen: true, type: 'error', title, message, onConfirm: resetState });
    }, []);

    const showMessage = useCallback((title: string, message: string) => {
        setState({ isOpen: true, type: 'info', title, message, onConfirm: resetState });
    }, []);

    const handleCancel = () => {
        resetState();
    };

    const handleConfirm = () => {
        state.onConfirm();
        resetState();
    };

    const contextValue = useMemo(() => ({ showConfirmation, showError, showMessage }), [showConfirmation, showError, showMessage]);

    return (
        <MessageContext.Provider value={contextValue}>
            {children}
            <MessageModal 
                isOpen={state.isOpen}
                type={state.type}
                title={state.title}
                message={state.message}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        </MessageContext.Provider>
    );
};

// alias for backward compatibility
export const useConfirmation = useMessage;