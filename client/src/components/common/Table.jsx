import React from 'react';

export const Table = ({
  columns,
  data,
  isLoading,
  emptyMessage = 'No records found.',
  onRowClick,
}) => {
  return (
    <div className="w-full overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {columns.map((col, index) => (
              <th
                key={index}
                className={`py-3.5 px-4 ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, rIdx) => (
              <tr key={rIdx} className="animate-pulse">
                {columns.map((_, cIdx) => (
                  <td key={cIdx} className="py-4 px-4">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  </td>
                ))}
              </tr>
            ))
          ) : data && data.length > 0 ? (
            data.map((row, rowIdx) => (
              <tr
                key={row._id || rowIdx}
                onClick={() => onRowClick && onRowClick(row)}
                className={`transition-colors ${
                  onRowClick
                    ? 'cursor-pointer hover:bg-slate-50/80'
                    : 'hover:bg-slate-50/50'
                }`}
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={colIdx}
                    className={`py-3.5 px-4 text-slate-700 ${
                      col.cellClassName || ''
                    }`}
                  >
                    {col.accessor
                      ? typeof col.accessor === 'function'
                        ? col.accessor(row)
                        : row[col.accessor]
                      : null}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="py-12 px-4 text-center text-slate-400"
              >
                <p className="text-sm">{emptyMessage}</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
