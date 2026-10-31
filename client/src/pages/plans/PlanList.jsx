import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Table } from '../../components/common/Table';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Pagination } from '../../components/common/Pagination';
import { Plus, Edit2, Archive, Check, Layers, Calendar } from 'lucide-react';

const planSchema = z.object({
  name: z.string().min(2, 'Plan name is required'),
  price: z.coerce.number().min(0, 'Price must be 0 or more'),
  billingPeriod: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  minQuantity: z.coerce.number().min(1, 'Min quantity must be at least 1').default(1),
  availableFrom: z.string().optional(),
  availableTo: z.string().optional(),
  options: z
    .object({
      autoCloseOnEnd: z.boolean().default(false),
      allowEarlyClose: z.boolean().default(true),
      allowPause: z.boolean().default(true),
      allowRenew: z.boolean().default(true),
    })
    .default({}),
});

export const PlanList = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formError, setFormError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['plans', page],
    queryFn: () => api.get(`/plans?page=${page}&limit=10`),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(planSchema),
    defaultValues: {
      billingPeriod: 'monthly',
      minQuantity: 1,
      options: {
        autoCloseOnEnd: false,
        allowEarlyClose: true,
        allowPause: true,
        allowRenew: true,
      },
    },
  });

  const savePlanMutation = useMutation({
    mutationFn: (planData) => {
      if (editingPlan) {
        return api.put(`/plans/${editingPlan._id}`, planData);
      }
      return api.post('/plans', planData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['plans']);
      setIsModalOpen(false);
      setEditingPlan(null);
      reset();
    },
    onError: (err) => {
      setFormError(err.message || 'Failed to save billing plan');
    },
  });

  const archivePlanMutation = useMutation({
    mutationFn: (id) => api.delete(`/plans/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['plans']);
    },
  });

  const openCreateModal = () => {
    setEditingPlan(null);
    setFormError('');
    reset({
      name: '',
      price: 0,
      billingPeriod: 'monthly',
      minQuantity: 1,
      options: {
        autoCloseOnEnd: false,
        allowEarlyClose: true,
        allowPause: true,
        allowRenew: true,
      },
    });
    setIsModalOpen(true);
  };

  const openEditModal = (plan) => {
    setEditingPlan(plan);
    setFormError('');
    reset({
      name: plan.name,
      price: plan.price,
      billingPeriod: plan.billingPeriod,
      minQuantity: plan.minQuantity,
      availableFrom: plan.availableFrom ? plan.availableFrom.split('T')[0] : '',
      availableTo: plan.availableTo ? plan.availableTo.split('T')[0] : '',
      options: {
        autoCloseOnEnd: plan.options?.autoCloseOnEnd ?? false,
        allowEarlyClose: plan.options?.allowEarlyClose ?? true,
        allowPause: plan.options?.allowPause ?? true,
        allowRenew: plan.options?.allowRenew ?? true,
      },
    });
    setIsModalOpen(true);
  };

  const onSubmit = (formData) => {
    setFormError('');
    savePlanMutation.mutate(formData);
  };

  const columns = [
    {
      header: 'Plan Name',
      accessor: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">{row.name}</p>
            <p className="text-xs text-slate-500 capitalize">{row.billingPeriod} recurring</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Price / Cycle',
      accessor: (row) => (
        <span className="font-bold text-slate-900">
          ${row.price.toFixed(2)}
          <span className="text-xs font-normal text-slate-500"> / {row.billingPeriod}</span>
        </span>
      ),
    },
    {
      header: 'Min Qty',
      accessor: (row) => <span className="text-slate-700">{row.minQuantity} unit(s)</span>,
    },
    {
      header: 'Configured Rules',
      accessor: (row) => (
        <div className="flex flex-wrap gap-1 text-[11px]">
          {row.options?.autoCloseOnEnd && (
            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
              Auto-Close
            </span>
          )}
          {row.options?.allowEarlyClose && (
            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              Early Close
            </span>
          )}
          {row.options?.allowPause && (
            <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
              Pauseable
            </span>
          )}
          {row.options?.allowRenew && (
            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              Renewable
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => (
        <Badge status={row.status === 'active' ? 'active' : 'closed'}>
          {row.status}
        </Badge>
      ),
    },
    ...(isAdmin
      ? [
          {
            header: 'Actions',
            className: 'text-right',
            cellClassName: 'text-right',
            accessor: (row) => (
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditModal(row)}
                  icon={Edit2}
                >
                  Edit
                </Button>
                {row.status === 'active' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    onClick={() => {
                      if (confirm(`Archive plan ${row.name}?`)) {
                        archivePlanMutation.mutate(row._id);
                      }
                    }}
                    icon={Archive}
                  >
                    Archive
                  </Button>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Recurring Billing Plans
          </h1>
          <p className="text-sm text-slate-500">
            Configure recurring cadences (daily, weekly, monthly, yearly), minimum quotas, and lifecycle policies
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openCreateModal} icon={Plus}>
            New Billing Plan
          </Button>
        )}
      </div>

      <Table
        columns={columns}
        data={data?.data?.plans}
        isLoading={isLoading}
        emptyMessage="No billing plans created yet."
      />

      <Pagination
        page={page}
        totalPages={data?.data?.pagination?.pages || 1}
        total={data?.data?.pagination?.total || 0}
        onPageChange={setPage}
      />

      {/* Add / Edit Plan Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPlan ? 'Edit Billing Plan' : 'Create Billing Plan'}
      >
        {formError && (
          <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-sm rounded-lg border border-rose-200">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Plan Name *"
            placeholder="e.g. Enterprise Monthly"
            {...register('name')}
            error={errors.name?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Recurring Price ($) *"
              type="number"
              step="0.01"
              placeholder="199.00"
              {...register('price')}
              error={errors.price?.message}
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Billing Cadence *
              </label>
              <select
                {...register('billingPeriod')}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <Input
            label="Minimum Quantity Required"
            type="number"
            min="1"
            placeholder="1"
            {...register('minQuantity')}
            error={errors.minQuantity?.message}
          />

          <div className="pt-2 border-t border-slate-200">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Plan Lifecycle Options
            </label>
            <div className="space-y-2.5">
              <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                  {...register('options.autoCloseOnEnd')}
                />
                <span>Auto-Close on end date</span>
              </label>
              <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                  {...register('options.allowEarlyClose')}
                />
                <span>Allow early cancellation/closing</span>
              </label>
              <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                  {...register('options.allowPause')}
                />
                <span>Allow pausing subscription</span>
              </label>
              <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                  {...register('options.allowRenew')}
                />
                <span>Allow renewal</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting || savePlanMutation.isPending}>
              {editingPlan ? 'Update Plan' : 'Save Plan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
