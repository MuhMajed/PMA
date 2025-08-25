import React, { useState, useMemo } from 'react';
import { EyeIcon } from '../components/icons/EyeIcon';
import { EyeSlashIcon } from '../components/icons/EyeSlashIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { XCircleIcon } from '../components/icons/XCircleIcon';
import { useStore } from '../store/appStore';

const PasswordCriteria: React.FC<{ password: string, onValidationChange: (isValid: boolean) => void }> = ({ password, onValidationChange }) => {
    const criteria = useMemo(() => ([
        { label: 'At least 8 characters', valid: password.length >= 8 },
        { label: 'Starts with a letter', valid: /^[a-zA-Z]/.test(password) },
        { label: 'Contains an uppercase letter', valid: /[A-Z]/.test(password) },
        { label: 'Contains a number', valid: /\d/.test(password) },
        { label: 'Contains a special character', valid: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    ]), [password]);

    React.useEffect(() => {
        onValidationChange(criteria.every(c => c.valid));
    }, [criteria, onValidationChange]);

    return (
        <ul className="space-y-1 text-xs text-slate-600">
            {criteria.map(item => (
                <li key={item.label} className="flex items-center">
                    {item.valid ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-600 mr-2" />
                    ) : (
                        <XCircleIcon className="h-4 w-4 text-red-600 mr-2" />
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
            setMessage('If an account with that identifier exists, a password reset code has been sent to the associated email address.');
            setMode('reset');
        } else {
            // For security, show the same message even if the user doesn't exist.
            setMessage('If an account with that identifier exists, a password reset code has been sent to the associated email address.');
            setMode('reset');
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
    
    const inputWrapperClass = "relative border-b border-slate-400 focus-within:border-green-500 transition-colors duration-200";
    const inputClass = "appearance-none block w-full px-1 py-3 bg-transparent placeholder-slate-500 text-slate-900 focus:outline-none sm:text-sm";


    const renderLogin = () => (
        <form className="mt-8 space-y-6" onSubmit={handleLoginSubmit}>
            <div className="space-y-4">
                <div className={inputWrapperClass}>
                    <input
                        id="emailOrEmpId" name="emailOrEmpId" type="text" required
                        value={emailOrEmpId} onChange={(e) => setEmailOrEmpId(e.target.value)}
                        className={inputClass}
                        placeholder="Username, Email, or Employee ID"
                    />
                </div>
                <div className={inputWrapperClass}>
                    <input
                        id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        className={`${inputClass} pr-10`}
                        placeholder="Password"
                    />
                     <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 z-20 pr-3 flex items-center text-slate-500 hover:text-slate-800">
                        <span className="sr-only">Toggle password visibility</span>
                        {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                </div>
            </div>
            <div className="flex items-center justify-end">
                <div className="text-sm">
                    <button type="button" onClick={() => { setMode('forgot'); setError(''); setMessage(''); }} className="font-medium text-green-600 hover:text-green-500">
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
            <p className="text-sm text-center text-slate-600">Enter your Username, Email, or Employee ID to receive a password reset code.</p>
            <div className={inputWrapperClass}>
                <input
                    id="emailOrEmpId" name="emailOrEmpId" type="text" required
                    value={emailOrEmpId} onChange={(e) => setEmailOrEmpId(e.target.value)}
                    className={inputClass}
                    placeholder="Username, Email, or Employee ID"
                />
            </div>
             <div>
                <button type="submit" disabled={isLoading} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#28a745] hover:bg-green-700 disabled:bg-green-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    {isLoading ? 'Sending...' : 'Send Reset Code'}
                </button>
            </div>
             <div className="text-sm text-center">
                <button type="button" onClick={() => { setMode('login'); setError(''); setMessage(''); }} className="font-medium text-green-600 hover:text-green-500">
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
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute inset-y-0 right-0 z-20 pr-3 flex items-center text-slate-500 hover:text-slate-800">
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
                <button type="button" onClick={() => { setMode('login'); setError(''); setMessage(''); }} className="font-medium text-green-600 hover:text-green-500">
                    Back to Sign In
                </button>
            </div>
        </form>
    );


    return (
        <div
            className="min-h-screen bg-cover bg-center bg-fixed"
            style={{ backgroundImage: "url('https://thesaudiboom.com/wp-content/uploads/2024/06/1-Jeddah-Tower_-Everything-to-Know-About-The-Worlds-Tallest-Skyscraper-.png')" }}
        >
            <div className="min-h-screen flex items-center justify-center sm:justify-end p-4">
                <div className="w-full max-w-md p-8 space-y-6 bg-white/20 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 sm:mr-8 md:mr-16 lg:mr-32">
                    <div className="text-center">
                        <svg xmlns="http://www.w.org/2000/svg" className="mx-auto h-12 w-12 text-[#28a745]" fill="currentColor" viewBox="0 0 64 64">
                            <path d="M37.36 32L24 20.33v23.34L37.36 32z"/>
                            <path d="M50.64 32L37.28 20.33v23.34L50.64 32z"/>
                        </svg>
                        <h1 className="text-3xl font-bold text-slate-800 mt-4">Productivity Monitoring</h1>
                        <p className="mt-2 text-sm text-slate-600">
                            {mode === 'login' && 'Sign in to your account'}
                            {mode === 'forgot' && 'Reset your password'}
                            {mode === 'reset' && 'Create a new password'}
                        </p>
                    </div>
                    
                    {error && <p className="text-sm text-center text-red-800 bg-red-100 rounded-md py-2 px-3">{error}</p>}
                    {message && <p className="text-sm text-center text-green-800 bg-green-100 rounded-md py-2 px-3">{message}</p>}

                    {mode === 'login' && renderLogin()}
                    {mode === 'forgot' && renderForgot()}
                    {mode === 'reset' && renderReset()}
                </div>
            </div>
        </div>
    );
};

export default LoginPage;