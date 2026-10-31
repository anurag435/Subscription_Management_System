import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export const Pagination = ({
  page = 1,
  totalPages = 1,
  total = 0,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-slate-200 sm:px-6">
      <div className="text-xs text-slate-500">
        Showing page <span className="font-semibold text-slate-700">{page}</span> of{' '}
        <span className="font-semibold text-slate-700">{totalPages}</span> ({total} items)
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          icon={ChevronLeft}
        >
          Previous
        </Button>
        <span className="text-sm font-medium text-slate-600 px-2">{page}</span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          icon={ChevronRight}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
