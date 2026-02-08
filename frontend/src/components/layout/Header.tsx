
import React from 'react';
import { User } from '../../types';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  onHome: () => void;
  view: string;
  setView: (v: any) => void;
  onProfile: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, onHome, view, setView, onProfile }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div 
          className="flex items-center space-x-2 cursor-pointer"
          onClick={onHome}
        >
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
            M
          </div>
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-600">
            MenuSync
          </span>
        </div>

        <div className="flex items-center space-x-4 md:space-x-6">
          {user && (
            <>
              <div 
                onClick={onProfile}
                className="flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-full border hover:bg-slate-200 cursor-pointer transition-all"
              >
                <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white uppercase">
                  {user.name[0]}
                </div>
                <div className="hidden md:flex flex-col leading-none">
                  <span className="text-xs font-bold text-slate-700">{user.name}</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-tighter">View Profile</span>
                </div>
              </div>

              <button 
                onClick={onLogout}
                className="text-sm font-semibold text-red-500 hover:text-red-600 transition flex items-center space-x-1"
              >
                <span className="hidden sm:inline">Logout</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
