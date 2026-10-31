import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Table } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { Pagination } from '../../components/common/Pagination';
import { Receipt, Eye } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const PortalInvoices = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['portal-invoices', page],
    queryFn: () => api.get(`/invoices?page=${page}&limit=10`),
  });

  const columns = [
    {
      header: 'Invoice #',
      accessor: (row) => (
        <span className="font-semibold text-indigo-600 font-mono text-xs">
          {row.invoiceNumber}
        </span>
      ),
    },
    {
      header: 'Date',
      accessor: (row) => (
        <span className="text-xs text-slate-600">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Due Date',
      accessor: (row) => (
        <span className="text-xs text-slate-600">
          {new Date(row.dueDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => <Badge status={row.status} />,
    },
    {
      header: 'Total',
      className: 'text-right',
      cellClassName: 'text-right font-medium text-slate-900',
      accessor: (row) => `$${row.total.toFixed(2)}`,
    },
    {
      header: 'Balance Due',
      className: 'text-right',
      cellClassName: 'text-right font-bold',
      accessor: (row) => (
        <span
          className={row.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}
        >
          ${row.balanceDue.toFixed(2)}
        </span>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cellClassName: 'text-right',
      accessor: (row) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/invoices/${row._id}`)}
          icon={Eye}
        >
          View / Print
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          My Invoices
        </h1>
        <p className="text-sm text-slate-500">
          Review payment histories, print official receipts, and check outstanding balances
        </p>
      </div>

      <Table
        columns={columns}
        data={data?.data?.invoices}
        isLoading={isLoading}
        onRowClick={(row) => navigate(`/invoices/${row._id}`)}
        emptyMessage="You have no invoices on file."
      />

      <Pagination
        page={page}
        totalPages={data?.data?.pagination?.pages || 1}
        total={data?.data?.pagination?.total || 0}
        onPageChange={setPage}
      />
    </div>
  );
};
