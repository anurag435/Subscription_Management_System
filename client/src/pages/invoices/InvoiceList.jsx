import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Table } from '../../components/common/Table';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Pagination } from '../../components/common/Pagination';
import { Receipt, Search, Play, CheckCircle2, AlertCircle } from 'lucide-react';

export const InvoiceList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [bulkMsg, setBulkMsg] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', page, statusFilter, search],
    queryFn: () =>
      api.get(
        `/invoices?page=${page}&limit=10&status=${statusFilter}&search=${encodeURIComponent(
          search
        )}`
      ),
  });

  const bulkGenerateMutation = useMutation({
    mutationFn: () => api.post('/invoices/generate-due'),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['invoices']);
      setBulkMsg(res.message);
      setTimeout(() => setBulkMsg(''), 6000);
    },
  });

  const statuses = [
    { label: 'All Invoices', value: '' },
    { label: 'Draft', value: 'Draft' },
    { label: 'Confirmed', value: 'Confirmed' },
    { label: 'Paid', value: 'Paid' },
    { label: 'Overdue', value: 'Overdue' },
    { label: 'Cancelled', value: 'Cancelled' },
  ];

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
      header: 'Customer',
      accessor: (row) => (
        <div>
          <p className="font-medium text-slate-900">{row.customer?.name || '—'}</p>
          <p className="text-xs text-slate-500">{row.customer?.company || row.customer?.email}</p>
        </div>
      ),
    },
    {
      header: 'Subscription #',
      accessor: (row) => (
        <span className="font-mono text-xs text-slate-600">
          {row.subscription?.subscriptionNumber || '—'}
        </span>
      ),
    },
    {
      header: 'Due Date',
      accessor: (row) => (
        <span className="text-xs text-slate-600">
          {row.dueDate ? new Date(row.dueDate).toLocaleDateString() : '—'}
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
      cellClassName: 'text-right text-slate-900',
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
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Invoices & Billing Statements
          </h1>
          <p className="text-sm text-slate-500">
            Automated invoice generation, tax & discount breakdowns, and settlement tracking
          </p>
        </div>
        <Button
          onClick={() => bulkGenerateMutation.mutate()}
          isLoading={bulkGenerateMutation.isPending}
          icon={Play}
        >
          Run Billing Cycle Now
        </Button>
      </div>

      {bulkMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{bulkMsg}</span>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        {statuses.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setStatusFilter(tab.value);
              setPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              statusFilter === tab.value
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice number (e.g. INV-000001)..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      <Table
        columns={columns}
        data={data?.data?.invoices}
        isLoading={isLoading}
        onRowClick={(row) => navigate(`/invoices/${row._id}`)}
        emptyMessage="No invoices match your search or filter."
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
