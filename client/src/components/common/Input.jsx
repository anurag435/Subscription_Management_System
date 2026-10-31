import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      type = 'text',
      className = '',
      containerClassName = '',
      id,
      name,
      ...props
    },
    ref
  ) => {
    const inputId = id || name;

    return (
      <div className={twMerge('w-full', containerClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-700 mb-1"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          name={name}
          type={type}
          className={twMerge(
            clsx(
              'w-full px-3.5 py-2 text-sm bg-white border rounded-lg transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-slate-50 disabled:text-slate-500',
              error
                ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200 text-rose-900'
                : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200 text-slate-900',
              className
            )
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
        {!error && helperText && (
          <p className="mt-1 text-xs text-slate-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
