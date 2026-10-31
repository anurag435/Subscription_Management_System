import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import api from '../../api/axios';
import { Table } from '../../components/common/Table';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Pagination } from '../../components/common/Pagination';
import {
  Repeat,
  Plus,
  Search,
  Filter,
  Calendar,
  FileSpreadsheet,
  PlusCircle,
  Trash2,
} from 'lucide-react';

export const SubscriptionList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['subscriptions', page, statusFilter, search],
    queryFn: () =>
      api.get(
        `/subscriptions?page=${page}&limit=10&status=${statusFilter}&search=${encodeURIComponent(
          search
        )}`
      ),
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => api.get('/customers?limit=100'),
  });

  const { data: plansData } = useQuery({
    queryKey: ['plans-list'],
    queryFn: () => api.get('/plans?status=active&limit=100'),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products-list'],
    queryFn: () => api.get('/products?activeOnly=true&limit=100'),
  });

  const { data: templatesData } = useQuery({
    queryKey: ['templates-list'],
    queryFn: () => api.get('/templates?limit=100'),
  });

  const { register, handleSubmit, control, watch, setValue, reset, formState: { isSubmitting } } =
    useForm({
      defaultValues: {
        customerId: '',
        planId: '',
        templateId: '',
        paymentTerms: 'immediate',
        startDate: new Date().toISOString().split('T')[0],
        status: 'Draft',
        lines: [],
      },
    });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines',
  });

  const selectedTemplateId = watch('templateId');

  // Handle template selection auto-fill
  const handleTemplateChange = (e) => {
    const tId = e.target.value;
    setValue('templateId', tId);
    if (!tId) return;

    const t = templatesData?.data?.templates?.find((tmpl) => tmpl._id === tId);
    if (t) {
      if (t.plan?._id) setValue('planId', t.plan._id);
      setValue('status', 'Quotation');

      // Autofill lines
      const newLines = (t.lines || []).map((l) => ({
        product: l.product?._id || l.product,
        quantity: l.quantity,
        unitPrice: l.product?.salesPrice || 0,
      }));
      setValue('lines', newLines);
    }
  };

  const createSubscriptionMutation = useMutation({
    mutationFn: (newSub) => api.post('/subscriptions', newSub),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['subscriptions']);
      setIsModalOpen(false);
      reset();
      navigate(`/subscriptions/${res.data._id}`);
    },
    onError: (err) => {
      setFormError(err.message || 'Failed to create subscription');
    },
  });

  const onSubmit = (formData) => {
    setFormError('');
    if (!formData.customerId) {
      setFormError('Please select a customer');
      return;
    }
    if (!formData.planId) {
      setFormError('Please select a billing plan');
      return;
    }
    createSubscriptionMutation.mutate(formData);
  };

  const statuses = [
    { label: 'All Subscriptions', value: '' },
    { label: 'Draft', value: 'Draft' },
    { label: 'Quotation', value: 'Quotation' },
    { label: 'Confirmed', value: 'Confirmed' },
    { label: 'Active', value: 'Active' },
    { label: 'Paused', value: 'Paused' },
    { label: 'Closed', value: 'Closed' },
  ];

  const columns = [
    {
      header: 'Subscription #',
      accessor: (row) => (
        <span className="font-semibold text-indigo-600 font-mono text-xs">
          {row.subscriptionNumber}
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
      header: 'Plan',
      accessor: (row) => (
        <span className="capitalize text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
          {row.plan?.name} ({row.plan?.billingPeriod})
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => <Badge status={row.status} />,
    },
    {
      header: 'Next Billing',
      accessor: (row) => (
        <span className="text-xs text-slate-600">
          {row.nextBillingDate
            ? new Date(row.nextBillingDate).toLocaleDateString()
            : '—'}
        </span>
      ),
    },
    {
      header: 'Recurring Subtotal',
      className: 'text-right',
      cellClassName: 'text-right font-bold text-slate-900',
      accessor: (row) => `$${(row.recurringSubtotal || 0).toFixed(2)}`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Subscriptions
          </h1>
          <p className="text-sm text-slate-500">
            Track active subscriber agreements, recurring billing dates, and quotation approvals
          </p>
        </div>
        <Button
          onClick={() => {
            setFormError('');
            reset();
            setIsModalOpen(true);
          }}
          icon={Plus}
        >
          New Subscription
        </Button>
      </div>

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
            placeholder="Search by subscription number (e.g. SUB-000001)..."
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
        data={data?.data?.subscriptions}
        isLoading={isLoading}
        onRowClick={(row) => navigate(`/subscriptions/${row._id}`)}
        emptyMessage="No subscriptions match your search or filter."
      />

      <Pagination
        page={page}
        totalPages={data?.data?.pagination?.pages || 1}
        total={data?.data?.pagination?.total || 0}
        onPageChange={setPage}
      />

      {/* Create Subscription Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Subscription or Quotation"
        maxWidth="max-w-2xl"
      >
        {formError && (
          <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-sm rounded-lg border border-rose-200">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-medium text-indigo-900">
                Optional: Autofill from Quotation Template
              </span>
            </div>
            <select
              value={selectedTemplateId}
              onChange={handleTemplateChange}
              className="text-xs px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg focus:outline-none"
            >
              <option value="">No template (manual entry)</option>
              {templatesData?.data?.templates?.map((tmpl) => (
                <option key={tmpl._id} value={tmpl._id}>
                  {tmpl.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Customer *
              </label>
              <select
                {...register('customerId')}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select Customer...</option>
                {customersData?.data?.customers?.map((cust) => (
                  <option key={cust._id} value={cust._id}>
                    {cust.name} {cust.company ? `(${cust.company})` : ''} - {cust.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Recurring Billing Plan *
              </label>
              <select
                {...register('planId')}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select Plan...</option>
                {plansData?.data?.plans?.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} (${p.price}/{p.billingPeriod})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Start Date *"
              type="date"
              {...register('startDate')}
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Payment Terms
              </label>
              <select
                {...register('paymentTerms')}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
              >
                <option value="immediate">Immediate</option>
                <option value="net15">Net 15 Days</option>
                <option value="net30">Net 30 Days</option>
                <option value="net60">Net 60 Days</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Initial Status
              </label>
              <select
                {...register('status')}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
              >
                <option value="Draft">Draft</option>
                <option value="Quotation">Quotation</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Active">Active</option>
              </select>
            </div>
          </div>

          {/* Product Lines */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Product Lines & Add-ons
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ product: '', quantity: 1, unitPrice: 0 })}
                icon={PlusCircle}
              >
                Add Item
              </Button>
            </div>

            {fields.map((field, idx) => (
              <div key={field.id} className="flex items-center gap-2 mb-2">
                <select
                  {...register(`lines.${idx}.product`)}
                  onChange={(e) => {
                    const prodId = e.target.value;
                    const prod = productsData?.data?.products?.find((p) => p._id === prodId);
                    if (prod) {
                      setValue(`lines.${idx}.unitPrice`, prod.salesPrice);
                    }
                  }}
                  className="flex-1 px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none"
                >
                  <option value="">Select item...</option>
                  {productsData?.data?.products?.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} (${p.salesPrice})
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  min="1"
                  placeholder="Qty"
                  {...register(`lines.${idx}.quantity`)}
                  containerClassName="w-20"
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Unit $"
                  {...register(`lines.${idx}.unitPrice`)}
                  containerClassName="w-24"
                />
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="p-2 text-rose-500 hover:text-rose-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting || createSubscriptionMutation.isPending}
            >
              Create Subscription
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
