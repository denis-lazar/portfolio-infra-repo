
import React, { useState } from 'react';
import { UserRole, User } from '../types';
import { api } from '../services/api';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('CUSTOMER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setEmail('');
    setName('');
    setPassword('');
    setError(null);
    setShowPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      if (isRegistering) {
        const user = await api.register(email, name || email.split('@')[0], password, role);
        onLoginSuccess(user);
      } else {
        const user = await api.login(email, password);
        onLoginSuccess(user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full px-5 py-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm font-medium placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all duration-200";
  const labelClasses = "block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 ml-1";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 font-['Inter']">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-fadeIn">
        <div className="bg-indigo-600 p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
            </svg>
          </div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl">
              <span className="text-3xl font-black text-indigo-600">M</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">MenuSync</h1>
            <p className="text-indigo-100 text-sm mt-2 font-medium">
              {isRegistering ? 'Create your platform account' : 'Welcome back to MenuSync'}
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-10 space-y-5">
          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold uppercase tracking-wide animate-shake">
              {error}
            </div>
          )}

          {isRegistering && (
            <div className="animate-fadeIn">
              <label className={labelClasses}>Full Name</label>
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className={inputClasses}
              />
            </div>
          )}

          <div>
            <label className={labelClasses}>Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className={inputClasses}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Password</label>
              {!isRegistering && (
                <button 
                  type="button" 
                  className="text-[10px] font-black text-indigo-600 uppercase tracking-wider hover:text-indigo-700"
                  onClick={() => alert("Forgot password functionality coming soon!")}
                >
                  Forgot?
                </button>
              )}
            </div>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                maxLength={128}
                className={`${inputClasses} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </button>
            </div>
            {isRegistering && (
              <div className="mt-2 p-4 rounded-2xl bg-indigo-50 border-2 border-indigo-100 shadow-sm animate-fadeIn">
                <p className="text-[11px] text-indigo-900 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  Security Requirements
                </p>
                <ul className="space-y-2">
                  <li className={`flex items-center gap-2.5 text-[11px] font-bold transition-colors duration-300 ${password.length >= 8 && password.length <= 128 ? 'text-green-600' : 'text-slate-500'}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${password.length >= 8 && password.length <= 128 ? 'bg-green-100 scale-110' : 'bg-slate-200'}`}>
                      {password.length >= 8 && password.length <= 128 ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      ) : <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />}
                    </div>
                    Between 8 and 128 characters
                  </li>
                  <li className={`flex items-center gap-2.5 text-[11px] font-bold transition-colors duration-300 ${/[0-9]/.test(password) ? 'text-green-600' : 'text-slate-500'}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${/[0-9]/.test(password) ? 'bg-green-100 scale-110' : 'bg-slate-200'}`}>
                      {/[0-9]/.test(password) ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      ) : <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />}
                    </div>
                    At least one number
                  </li>
                  <li className={`flex items-center gap-2.5 text-[11px] font-bold transition-colors duration-300 ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-green-600' : 'text-slate-500'}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'bg-green-100 scale-110' : 'bg-slate-200'}`}>
                      {/[!@#$%^&*(),.?":{}|<>]/.test(password) ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      ) : <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />}
                    </div>
                    One special character
                  </li>
                </ul>
              </div>
            )}
          </div>

            <div className="animate-fadeIn">
              <label className={labelClasses}>Account Type</label>
              <div className="relative flex p-1 bg-slate-100 rounded-2xl">
                <div 
                  className={`absolute top-1 bottom-1 w-[calc(33.33%-4px)] bg-white rounded-xl shadow-sm transition-transform duration-300 ease-out ${
                    role === 'MANAGER' ? 'translate-x-[calc(100%+4px)]' : 
                    role === 'ADMIN' ? 'translate-x-[calc(200%+8px)]' : 
                    'translate-x-0'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setRole('CUSTOMER')}
                  className={`relative flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors duration-200 z-10 ${role === 'CUSTOMER' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Customer
                </button>
                <button
                  type="button"
                  onClick={() => setRole('MANAGER')}
                  className={`relative flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors duration-200 z-10 ${role === 'MANAGER' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Manager
                </button>
                <button
                  type="button"
                  onClick={() => setRole('ADMIN')}
                  className={`relative flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors duration-200 z-10 ${role === 'ADMIN' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Admin
                </button>
              </div>
            </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full h-14 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] overflow-hidden transition-all duration-300 hover:bg-black hover:shadow-2xl hover:shadow-indigo-500/20 active:scale-[0.97] disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  <span className="relative z-10">
                    {isRegistering ? 'Create Account' : 'Sign In to Access'}
                  </span>
                  <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg] group-hover:left-full transition-all duration-1000"></div>
                </>
              )}
            </button>
          </div>
        </form>
        
        <div className="bg-slate-50 p-8 text-center border-t border-slate-100">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            {isRegistering ? 'Already have an account?' : "New to MenuSync?"}
            <button 
              onClick={toggleMode}
              className="ml-2 font-black text-indigo-600 hover:text-indigo-700 underline underline-offset-4 transition-colors"
            >
              {isRegistering ? 'Log In' : 'Join Now'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
