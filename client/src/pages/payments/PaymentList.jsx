import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Table } from '../../components/common/Table';
import { Pagination } from '../../components/common/Pagination';
import { CreditCard, Search, DollarSign, ArrowUpRight } from 'lucide-react';

export const PaymentList = () => {
  const [page, setPage] = useState(1);
  const [methodFilter, setMethodFilter] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['payments', page, methodFilter, search],
    queryFn: () =>
      api.get(
        `/payments?page=${page}&limit=10&method=${methodFilter}&search=${encodeURIComponent(
          search
        )}`
      ),
  });

  const methods = [
    { label: 'All Methods', value: '' },
    { label: 'Card', value: 'card' },
    { label: 'Bank Transfer', value: 'bank transfer' },
    { label: 'UPI', value: 'UPI' },
    { label: 'Cash', value: 'cash' },
    { label: 'Cheque', value: 'cheque' },
  ];

  const columns = [
    {
      header: 'Payment #',
      accessor: (row) => (
        <span className="font-semibold text-indigo-600 font-mono text-xs">
          {row.paymentNumber}
        </span>
      ),
    },
    {
      header: 'Invoice #',
      accessor: (row) => (
        <Link
          to={`/invoices/${row.invoice?._id}`}
          className="font-mono text-xs text-slate-800 hover:text-indigo-600 hover:underline inline-flex items-center gap-1"
        >
          <span>{row.invoice?.invoiceNumber}</span>
          <ArrowUpRight className="w-3 h-3 text-slate-400" />
        </Link>
      ),
    },
    {
      header: 'Customer',
      accessor: (row) => (
        <div>
          <p className="font-medium text-slate-900">
            {row.invoice?.customer?.name || '—'}
          </p>
          <p className="text-xs text-slate-500">
            {row.invoice?.customer?.company || row.invoice?.customer?.email}
          </p>
        </div>
      ),
    },
    {
      header: 'Method',
      accessor: (row) => (
        <span className="capitalize text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md">
          {row.method}
        </span>
      ),
    },
    {
      header: 'Payment Date',
      accessor: (row) => (
        <span className="text-xs text-slate-600">
          {new Date(row.paymentDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Recorded By',
      accessor: (row) => (
        <span className="text-xs text-slate-500">
          {row.recordedBy?.name || 'System / Auto'}
        </span>
      ),
    },
    {
      header: 'Amount Paid',
      className: 'text-right',
      cellClassName: 'text-right font-black text-emerald-600 text-sm',
      accessor: (row) => `$${row.amount.toFixed(2)}`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Payments & Collections
          </h1>
          <p className="text-sm text-slate-500">
            Audit trail of settled invoices, partial installments, transaction notes, and payment methods
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        {methods.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setMethodFilter(tab.value);
              setPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              methodFilter === tab.value
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
            placeholder="Search payment number (e.g. PAY-000001)..."
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
        data={data?.data?.payments}
        isLoading={isLoading}
        emptyMessage="No payment transactions found."
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
