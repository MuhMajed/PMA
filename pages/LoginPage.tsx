

import React, { useState, useMemo } from 'react';
import { EyeIcon } from '../components/icons/EyeIcon';
import { EyeSlashIcon } from '../components/icons/EyeSlashIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { XCircleIcon } from '../components/icons/XCircleIcon';
import { useStore } from '../store/appStore';

const PasswordCriteria: React.FC<{ password: string, onValidationChange: (isValid: boolean) => void }> = ({ password, onValidationChange }) => {
    const criteria = useMemo(() => ([
        { label: 'At least 8 characters', valid: password.length >= 8 },
        { label: 'Starts with a letter', valid: /^[a-zA-Z]/.test(password) || password.length === 0 },
        { label: 'Contains an uppercase letter', valid: /[A-Z]/.test(password) },
        { label: 'Contains a number', valid: /\d/.test(password) },
        { label: 'Contains a special character', valid: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    ]), [password]);

    React.useEffect(() => {
        onValidationChange(criteria.every(c => c.valid));
    }, [criteria, onValidationChange]);

    if (!password) return null;

    return (
        <ul className="space-y-1 text-xs text-slate-300">
            {criteria.map(item => (
                <li key={item.label} className="flex items-center">
                    {item.valid ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-400 mr-2" />
                    ) : (
                        <XCircleIcon className="h-4 w-4 text-red-400 mr-2" />
                    )}
                    <span>{item.label}</span>
                </li>
            ))}
        </ul>
    );
};


const LoginPage: React.FC = () => {
    const login = useStore((state) => state.login);
    const forgotPasswordRequest = useStore((state) => state.forgotPasswordRequest);
    const passwordResetWithCode = useStore((state) => state.passwordResetWithCode);
    
    const [mode, setMode] = useState<'login' | 'forgot' | 'reset'>('login');
    
    // Form fields
    const [emailOrEmpId, setEmailOrEmpId] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [code, setCode] = useState('');

    // UI state
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [isPasswordValid, setIsPasswordValid] = useState(false);
    
    const backgroundImageUrl = 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=2070&auto=format&fit=crop';

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        const success = await login({ emailOrEmpId, password });
        if (!success) {
            setError('Invalid credentials. Please try again.');
        }
        setIsLoading(false);
    };

    const handleForgotSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);
        const success = await forgotPasswordRequest(emailOrEmpId);
        if (success) {
            setMessage('If an account exists, a reset code has been sent. For this demo, the code is 123456.');
            setMode('reset');
        } else {
            setError('If an account exists, a reset code has been sent.'); // Generic message for security
        }
        setIsLoading(false);
    };

    const handleResetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (!isPasswordValid) {
            setError('Password does not meet all the required criteria.');
            return;
        }

        setIsLoading(true);
        const success = await passwordResetWithCode(emailOrEmpId, code, password);
        if (success) {
            setMessage('Password has been reset successfully. Please log in.');
            setMode('login');
            setPassword('');
            setConfirmPassword('');
            setCode('');
        } else {
            setError('Invalid reset code. Please try again.');
        }
        setIsLoading(false);
    };
    
    const inputWrapperClass = "relative border-b border-slate-600 focus-within:border-[#28a745] transition-colors duration-200";
    const inputClass = "appearance-none block w-full px-1 py-3 bg-transparent placeholder-slate-300 text-white focus:outline-none sm:text-sm";


    const renderLogin = () => (
        <form className="mt-8 space-y-6" onSubmit={handleLoginSubmit}>
            <div className="space-y-4">
                <div className={inputWrapperClass}>
                    <input
                        id="emailOrEmpId" name="emailOrEmpId" type="text" required
                        value={emailOrEmpId} onChange={(e) => setEmailOrEmpId(e.target.value)}
                        className={inputClass}
                        placeholder="Username"
                    />
                </div>
                <div className={inputWrapperClass}>
                    <input
                        id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        className={`${inputClass} pr-10`}
                        placeholder="Password"
                    />
                     <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 z-20 pr-3 flex items-center text-slate-400 hover:text-white">
                        <span className="sr-only">Toggle password visibility</span>
                        {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                </div>
            </div>
            <div className="flex items-center justify-end">
                <div className="text-sm">
                    <button type="button" onClick={() => { setMode('forgot'); setError(''); setMessage(''); }} className="font-medium text-[#28a745] hover:text-green-400">
                        Forgot your password?
                    </button>
                </div>
            </div>
            <div>
                <button type="submit" disabled={isLoading} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#28a745] hover:bg-green-700 disabled:bg-green-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
            </div>
        </form>
    );
    
    const renderForgot = () => (
        <form className="mt-8 space-y-6" onSubmit={handleForgotSubmit}>
            <p className="text-sm text-center text-slate-300">Enter your email or employee ID to receive a password reset code.</p>
            <div className={inputWrapperClass}>
                <input
                    id="emailOrEmpId" name="emailOrEmpId" type="text" required
                    value={emailOrEmpId} onChange={(e) => setEmailOrEmpId(e.target.value)}
                    className={inputClass}
                    placeholder="Email or Employee ID"
                />
            </div>
             <div>
                <button type="submit" disabled={isLoading} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#28a745] hover:bg-green-700 disabled:bg-green-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    {isLoading ? 'Sending...' : 'Send Reset Code'}
                </button>
            </div>
             <div className="text-sm text-center">
                <button type="button" onClick={() => { setMode('login'); setError(''); setMessage(''); }} className="font-medium text-[#28a745] hover:text-green-400">
                    Back to Sign In
                </button>
            </div>
        </form>
    );

    const renderReset = () => (
        <form className="mt-8 space-y-6" onSubmit={handleResetSubmit}>
             <div className="space-y-4">
                <div className={inputWrapperClass}>
                    <input
                        id="code" name="code" type="text" required
                        value={code} onChange={(e) => setCode(e.target.value)}
                        className={inputClass}
                        placeholder="Reset Code"
                    />
                </div>
                <div className={inputWrapperClass}>
                    <input
                        id="new-password" name="password" type={showNewPassword ? 'text' : 'password'} required
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        className={`${inputClass} pr-10`}
                        placeholder="New Password"
                    />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute inset-y-0 right-0 z-20 pr-3 flex items-center text-slate-400 hover:text-white">
                        {showNewPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                </div>
                <PasswordCriteria password={password} onValidationChange={setIsPasswordValid} />
                 <div className={inputWrapperClass}>
                    <input
                        id="confirm-password" name="confirmPassword" type="password" required
                        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                        className={inputClass}
                        placeholder="Confirm New Password"
                    />
                </div>
            </div>
             <div>
                <button type="submit" disabled={isLoading || !isPasswordValid || password !== confirmPassword} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#28a745] hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    {isLoading ? 'Resetting...' : 'Reset Password'}
                </button>
            </div>
            <div className="text-sm text-center">
                <button type="button" onClick={() => { setMode('login'); setError(''); setMessage(''); }} className="font-medium text-[#28a745] hover:text-green-400">
                    Back to Sign In
                </button>
            </div>
        </form>
    );


    return (
        <div 
          className="flex items-center justify-center min-h-screen bg-cover bg-center p-4 sm:p-8"
          style={{ backgroundImage: `url(${backgroundImageUrl})` }}
        >
            <div className="w-full max-w-md p-8 space-y-3 bg-black/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20">
                <div className="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-[#28a745]" fill="currentColor" viewBox="0 0 64 64">
                        <path d="M37.36 32L24 20.33v23.34L37.36 32z"/>
                        <path d="M50.64 32L37.28 20.33v23.34L50.64 32z"/>
                    </svg>
                    <h1 className="text-3xl font-bold text-white mt-4">Productivity Monitoring</h1>
                    <p className="mt-2 text-sm text-slate-300">
                        {mode === 'login' && 'Sign in to your account'}
                        {mode === 'forgot' && 'Reset your password'}
                        {mode === 'reset' && 'Create a new password'}
                    </p>
                </div>
                
                {error && <p className="text-sm text-center text-white bg-red-500/50 rounded-md py-2 px-3">{error}</p>}
                {message && <p className="text-sm text-center text-white bg-green-500/50 rounded-md py-2 px-3">{message}</p>}

                {mode === 'login' && renderLogin()}
                {mode === 'forgot' && renderForgot()}
                {mode === 'reset' && renderReset()}
            </div>
        </div>
    );
};

export default LoginPage;