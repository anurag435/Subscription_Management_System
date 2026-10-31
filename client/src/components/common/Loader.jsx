import React from 'react';
import { Loader2 } from 'lucide-react';

export const Loader = ({ size = 'md', text = 'Loading...' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-slate-500">
      <Loader2 className={`${sizes[size]} animate-spin text-indigo-600 mb-2`} />
      {text && <p className="text-sm font-medium">{text}</p>}
    </div>
  );
};

export const TableSkeleton = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="animate-pulse space-y-3 p-4">
      {Array.from({ length: rows }).map((_, rIndex) => (
        <div key={rIndex} className="flex space-x-4">
          {Array.from({ length: cols }).map((_, cIndex) => (
            <div
              key={cIndex}
              className="h-4 bg-slate-200 rounded flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
};
