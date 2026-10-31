import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User as UserIcon } from 'lucide-react';
import { Badge } from '../common/Badge';

export const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">
          Brightloop <span className="text-indigo-600 font-medium text-sm">Subscriptions</span>
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
            {user?.name ? user.name[0].toUpperCase() : <UserIcon className="w-4 h-4" />}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-tight">
              {user?.name}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge status={user?.role} className="text-[10px] py-0 px-1.5" />
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          title="Sign out"
          className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
