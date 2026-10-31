import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Badge = ({ children, status = 'default', variant, className = '' }) => {
  // Normalize status text
  const key = (variant || status || 'default').toLowerCase();

  const styles = {
    // Subscription & Invoice lifecycle statuses
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
    quotation: 'bg-amber-50 text-amber-700 border-amber-200',
    confirmed: 'bg-sky-50 text-sky-700 border-sky-200',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    closed: 'bg-slate-100 text-slate-600 border-slate-300',
    paused: 'bg-purple-50 text-purple-700 border-purple-200',
    paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    overdue: 'bg-rose-50 text-rose-700 border-rose-200',
    cancelled: 'bg-rose-50 text-rose-600 border-rose-200',
    // User roles
    admin: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    staff: 'bg-blue-50 text-blue-700 border-blue-200',
    customer: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    // Default
    default: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const selectedStyle = styles[key] || styles.default;

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize',
          selectedStyle,
          className
        )
      )}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-70" />
      {children || status}
    </span>
  );
};
