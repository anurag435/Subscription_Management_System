import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Package,
  Layers,
  FileSpreadsheet,
  Repeat,
  Receipt,
  CreditCard,
  Percent,
  PercentSquare,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

export const Sidebar = () => {
  const { user, isAdmin, isStaff, isCustomer } = useAuth();

  // Navigation config based on role
  const navigation = [
    // Dashboard (Admin & Staff)
    {
      name: 'Finance Dashboard',
      to: '/dashboard',
      icon: LayoutDashboard,
      show: isAdmin || isStaff,
    },
    // Customer Portal (Customer only)
    {
      name: 'My Subscriptions',
      to: '/portal/subscriptions',
      icon: Repeat,
      show: isCustomer,
    },
    {
      name: 'My Invoices',
      to: '/portal/invoices',
      icon: Receipt,
      show: isCustomer,
    },
    // Subscriptions management (Admin & Staff)
    {
      name: 'Subscriptions',
      to: '/subscriptions',
      icon: Repeat,
      show: isAdmin || isStaff,
    },
    {
      name: 'Quotation Templates',
      to: '/templates',
      icon: FileSpreadsheet,
      show: isAdmin || isStaff,
    },
    {
      name: 'Invoices',
      to: '/invoices',
      icon: Receipt,
      show: isAdmin || isStaff,
    },
    {
      name: 'Payments',
      to: '/payments',
      icon: CreditCard,
      show: isAdmin || isStaff,
    },
    {
      name: 'Customers',
      to: '/customers',
      icon: Users,
      show: isAdmin || isStaff,
    },
    // Catalog & Rules (Admin only)
    {
      name: 'Products & Variants',
      to: '/products',
      icon: Package,
      show: isAdmin || isStaff,
    },
    {
      name: 'Billing Plans',
      to: '/plans',
      icon: Layers,
      show: isAdmin || isStaff,
    },
    {
      name: 'Discount Rules',
      to: '/discounts',
      icon: Percent,
      show: isAdmin, // Admin only
    },
    {
      name: 'Tax Rates',
      to: '/taxes',
      icon: PercentSquare,
      show: isAdmin, // Admin only
    },
    {
      name: 'Staff Accounts',
      to: '/staff',
      icon: ShieldCheck,
      show: isAdmin, // Admin only
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 min-h-screen">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-500/30">
          B
        </div>
        <div>
          <h1 className="text-sm font-bold text-white tracking-wide">
            BRIGHTLOOP
          </h1>
          <p className="text-[11px] text-slate-400 uppercase tracking-widest font-semibold">
            {isCustomer ? 'Customer Portal' : 'Admin Console'}
          </p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation
          .filter((item) => item.show)
          .map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
      </nav>

      <div className="p-4 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-between">
        <span>v1.0.0</span>
        <span className="flex items-center gap-1.5 text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Online
        </span>
      </div>
    </aside>
  );
};
