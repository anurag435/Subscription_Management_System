import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../api/axios';
import { Table } from '../../components/common/Table';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Pagination } from '../../components/common/Pagination';
import { Plus, Percent, Edit2, Trash2 } from 'lucide-react';

const discountSchema = z.object({
  name: z.string().min(2, 'Discount name is required'),
  type: z.enum(['fixed', 'percentage']),
  value: z.coerce.number().min(0, 'Discount value must be 0 or more'),
  minPurchase: z.coerce.number().min(0).default(0),
  minQuantity: z.coerce.number().min(0).default(0),
  usageLimit: z
    .preprocess((val) => (val === '' ? null : val), z.coerce.number().nullable())
    .optional(),
  appliesTo: z.enum(['whole_subscription', 'specific_products']),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const DiscountList = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [formError, setFormError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['discounts', page],
    queryFn: () => api.get(`/discounts?page=${page}&limit=10&activeOnly=false`),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(discountSchema),
    defaultValues: {
      type: 'percentage',
      value: 10,
      minPurchase: 0,
      minQuantity: 0,
      appliesTo: 'whole_subscription',
    },
  });

  const saveDiscountMutation = useMutation({
    mutationFn: (discountData) => {
      if (editingDiscount) {
        return api.put(`/discounts/${editingDiscount._id}`, discountData);
      }
      return api.post('/discounts', discountData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['discounts']);
      setIsModalOpen(false);
      setEditingDiscount(null);
      reset();
    },
    onError: (err) => {
      setFormError(err.message || 'Failed to save discount rule');
    },
  });

  const deleteDiscountMutation = useMutation({
    mutationFn: (id) => api.delete(`/discounts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['discounts']);
    },
  });

  const openCreateModal = () => {
    setEditingDiscount(null);
    setFormError('');
    reset({
      name: '',
      type: 'percentage',
      value: 10,
      minPurchase: 0,
      minQuantity: 0,
      appliesTo: 'whole_subscription',
      usageLimit: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (d) => {
    setEditingDiscount(d);
    setFormError('');
    reset({
      name: d.name,
      type: d.type,
      value: d.value,
      minPurchase: d.minPurchase,
      minQuantity: d.minQuantity,
      appliesTo: d.appliesTo,
      usageLimit: d.usageLimit ?? '',
      startDate: d.startDate ? d.startDate.split('T')[0] : '',
      endDate: d.endDate ? d.endDate.split('T')[0] : '',
    });
    setIsModalOpen(true);
  };

  const onSubmit = (formData) => {
    setFormError('');
    saveDiscountMutation.mutate(formData);
  };

  const columns = [
    {
      header: 'Discount Rule',
      accessor: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
            <Percent className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">{row.name}</p>
            <p className="text-xs text-slate-500 capitalize">
              Applies to: {row.appliesTo.replace('_', ' ')}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Benefit',
      accessor: (row) => (
        <span className="font-bold text-slate-900 text-sm">
          {row.type === 'percentage' ? `${row.value}% OFF` : `\\$${row.value.toFixed(2)} OFF`}
        </span>
      ),
    },
    {
      header: 'Usage Limits',
      accessor: (row) => (
        <div className="text-xs text-slate-600">
          <p>
            Used: <span className="font-semibold">{row.usedCount || 0}</span>
            {row.usageLimit ? ` / ${row.usageLimit}` : ' (unlimited)'}
          </p>
          {row.minPurchase > 0 && (
            <p className="text-[11px] text-slate-400 mt-0.5">
              Min spend: ${row.minPurchase}
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => (
        <Badge status={row.isActive ? 'active' : 'closed'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
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
          {row.isActive && (
            <Button
              variant="ghost"
              size="sm"
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              onClick={() => {
                if (confirm(`Deactivate discount ${row.name}?`)) {
                  deleteDiscountMutation.mutate(row._id);
                }
              }}
              icon={Trash2}
            >
              Disable
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Discount & Promotional Engine
          </h1>
          <p className="text-sm text-slate-500">
            Admin only: define automated coupon rules, percentage discounts, minimum cart quotas, and caps
          </p>
        </div>
        <Button onClick={openCreateModal} icon={Plus}>
          New Discount Rule
        </Button>
      </div>

      <Table
        columns={columns}
        data={data?.data?.discounts}
        isLoading={isLoading}
        emptyMessage="No discount rules configured yet."
      />

      <Pagination
        page={page}
        totalPages={data?.data?.pagination?.pages || 1}
        total={data?.data?.pagination?.total || 0}
        onPageChange={setPage}
      />

      {/* Add / Edit Discount Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDiscount ? 'Edit Discount Rule' : 'Create Discount Rule'}
      >
        {formError && (
          <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-sm rounded-lg border border-rose-200">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Rule Name / Campaign Title *"
            placeholder="e.g. Early Bird 20% or Flat $50 Credit"
            {...register('name')}
            error={errors.name?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Discount Type *
              </label>
              <select
                {...register('type')}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>

            <Input
              label="Discount Value *"
              type="number"
              step="0.01"
              placeholder="e.g. 20 or 50"
              {...register('value')}
              error={errors.value?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Minimum Purchase ($)"
              type="number"
              step="0.01"
              placeholder="0 (no minimum)"
              {...register('minPurchase')}
              error={errors.minPurchase?.message}
            />
            <Input
              label="Usage Cap Limit"
              type="number"
              placeholder="Leave blank for unlimited"
              {...register('usageLimit')}
              error={errors.usageLimit?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Applies To *
            </label>
            <select
              {...register('appliesTo')}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
            >
              <option value="whole_subscription">Entire Subscription Order</option>
              <option value="specific_products">Specific Line Items</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting || saveDiscountMutation.isPending}
            >
              {editingDiscount ? 'Update Rule' : 'Save Rule'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
