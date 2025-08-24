
import React, { useState } from 'react';
import { EyeIcon } from '../components/icons/EyeIcon';
import { EyeSlashIcon } from '../components/icons/EyeSlashIcon';
import { useStore } from '../store/appStore';

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
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
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
            setMessage('If an account exists for this user, a reset code has been sent. For this demo, the code is 123456.');
            setMode('reset');
        } else {
            setError('If an account exists for this user, a reset code has been sent.'); // Generic message for security
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
        if (!password) {
            setError('Password cannot be empty.');
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
            // Keep emailOrEmpId for user convenience
        } else {
            setError('Invalid reset code. Please try again.');
        }
        setIsLoading(false);
    };

    const renderLogin = () => (
        <form className="mt-8 space-y-6" onSubmit={handleLoginSubmit}>
            <div className="rounded-md -space-y-px">
                <div>
                    <label htmlFor="emailOrEmpId" className="sr-only">Email or Employee ID</label>
                    <input
                        id="emailOrEmpId" name="emailOrEmpId" type="text" required
                        value={emailOrEmpId} onChange={(e) => setEmailOrEmpId(e.target.value)}
                        className="appearance-none rounded-none relative block w-full px-3 py-3 border border-white/20 placeholder-slate-300 text-white bg-white/10 rounded-t-md focus:outline-none focus:ring-[#28a745] focus:border-[#28a745] focus:z-10 sm:text-sm"
                        placeholder="Email or Employee ID"
                    />
                </div>
                <div className="relative">
                    <label htmlFor="password"className="sr-only">Password</label>
                    <input
                        id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        className="appearance-none rounded-none relative block w-full px-3 py-3 pr-10 border border-white/20 placeholder-slate-300 text-white bg-white/10 rounded-b-md focus:outline-none focus:ring-[#28a745] focus:border-[#28a745] focus:z-10 sm:text-sm"
                        placeholder="Password"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 z-20 pr-3 flex items-center text-slate-300 hover:text-white">
                        <span className="sr-only">Toggle password visibility</span>
                        {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                </div>
            </div>
            <div className="flex items-center justify-end">
                <div className="text-sm">
                    <button type="button" onClick={() => { setMode('forgot'); setError(''); setMessage(''); }} className="font-medium text-green-300 hover:text-green-200">
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
            <div>
                 <input
                    id="emailOrEmpId" name="emailOrEmpId" type="text" required
                    value={emailOrEmpId} onChange={(e) => setEmailOrEmpId(e.target.value)}
                    className="appearance-none relative block w-full px-3 py-3 border border-white/20 placeholder-slate-300 text-white bg-white/10 rounded-md focus:outline-none focus:ring-[#28a745] focus:border-[#28a745] focus:z-10 sm:text-sm"
                    placeholder="Email or Employee ID"
                />
            </div>
             <div>
                <button type="submit" disabled={isLoading} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#28a745] hover:bg-green-700 disabled:bg-green-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    {isLoading ? 'Sending...' : 'Send Reset Code'}
                </button>
            </div>
             <div className="text-sm text-center">
                <button type="button" onClick={() => { setMode('login'); setError(''); setMessage(''); }} className="font-medium text-green-300 hover:text-green-200">
                    Back to Sign In
                </button>
            </div>
        </form>
    );

    const renderReset = () => (
        <form className="mt-8 space-y-6" onSubmit={handleResetSubmit}>
             <div className="rounded-md -space-y-px">
                <div>
                    <label htmlFor="code" className="sr-only">Reset Code</label>
                    <input
                        id="code" name="code" type="text" required
                        value={code} onChange={(e) => setCode(e.target.value)}
                        className="appearance-none rounded-none relative block w-full px-3 py-3 border border-white/20 placeholder-slate-300 text-white bg-white/10 rounded-t-md focus:outline-none focus:ring-[#28a745] focus:border-[#28a745] focus:z-10 sm:text-sm"
                        placeholder="Reset Code"
                    />
                </div>
                <div className="relative">
                    <label htmlFor="new-password"className="sr-only">New Password</label>
                    <input
                        id="new-password" name="password" type={showNewPassword ? 'text' : 'password'} required
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        className="appearance-none rounded-none relative block w-full px-3 py-3 pr-10 border border-white/20 placeholder-slate-300 text-white bg-white/10 focus:outline-none focus:ring-[#28a745] focus:border-[#28a745] focus:z-10 sm:text-sm"
                        placeholder="New Password"
                    />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute inset-y-0 right-0 z-20 pr-3 flex items-center text-slate-300 hover:text-white">
                        <span className="sr-only">Toggle password visibility</span>
                        {showNewPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                </div>
                 <div className="relative">
                    <label htmlFor="confirm-password"className="sr-only">Confirm New Password</label>
                    <input
                        id="confirm-password" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} required
                        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                        className="appearance-none rounded-none relative block w-full px-3 py-3 pr-10 border border-white/20 placeholder-slate-300 text-white bg-white/10 rounded-b-md focus:outline-none focus:ring-[#28a745] focus:border-[#28a745] focus:z-10 sm:text-sm"
                        placeholder="Confirm New Password"
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 z-20 pr-3 flex items-center text-slate-300 hover:text-white">
                        <span className="sr-only">Toggle password visibility</span>
                        {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                </div>
            </div>
             <div>
                <button type="submit" disabled={isLoading} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#28a745] hover:bg-green-700 disabled:bg-green-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    {isLoading ? 'Resetting...' : 'Reset Password'}
                </button>
            </div>
            <div className="text-sm text-center">
                <button type="button" onClick={() => { setMode('login'); setError(''); setMessage(''); }} className="font-medium text-green-300 hover:text-green-200">
                    Back to Sign In
                </button>
            </div>
        </form>
    );


    return (
        <div 
          className="flex items-center justify-end min-h-screen bg-cover bg-center p-4 sm:p-8"
          style={{ backgroundImage: `url(${backgroundImageUrl})` }}
        >
            <div className="w-full max-w-md p-8 space-y-6 bg-black/30 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20">
                <div className="text-center">
                    <div className="flex justify-center mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#28a745]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-1a6 6 0 00-5.197-5.975M15 21v-2a4 4 0 00-4-4H9.828a4 4 0 00-3.564 2.339l-.828 1.656A4 4 0 005.279 8.586H4a2 2 0 00-2 2v2a2 2 0 002 2h1.279a4 4 0 013.564 2.339l.828 1.656A4 4 0 009.828 17h5.172a4 4 0 004-4v-2a2 2 0 00-2-2h-1.279a4 4 0 01-3.564-2.339l-.828-1.656A4 4 0 009.828 7H9a4 4 0 00-4 4v1" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white">Productivity Monitoring</h1>
                    <p className="mt-2 text-sm text-slate-200">
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
