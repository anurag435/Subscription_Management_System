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
import { Plus, PercentSquare, Trash2, Edit2 } from 'lucide-react';

const taxSchema = z.object({
  name: z.string().min(2, 'Tax name is required (e.g. GST 18%, VAT 10%)'),
  rate: z.coerce.number().min(0, 'Rate must be 0% or higher').max(100, 'Rate cannot exceed 100%'),
  appliesTo: z.enum(['all', 'products', 'services']),
});

export const TaxList = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTax, setEditingTax] = useState(null);
  const [formError, setFormError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['taxes'],
    queryFn: () => api.get('/taxes?activeOnly=false'),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(taxSchema),
    defaultValues: {
      appliesTo: 'all',
      rate: 0,
    },
  });

  const saveTaxMutation = useMutation({
    mutationFn: (taxData) => {
      if (editingTax) {
        return api.put(`/taxes/${editingTax._id}`, taxData);
      }
      return api.post('/taxes', taxData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['taxes']);
      setIsModalOpen(false);
      setEditingTax(null);
      reset();
    },
    onError: (err) => {
      setFormError(err.message || 'Failed to save tax rule');
    },
  });

  const deleteTaxMutation = useMutation({
    mutationFn: (id) => api.delete(`/taxes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['taxes']);
    },
  });

  const openCreateModal = () => {
    setEditingTax(null);
    setFormError('');
    reset({ name: '', rate: 0, appliesTo: 'all' });
    setIsModalOpen(true);
  };

  const openEditModal = (tax) => {
    setEditingTax(tax);
    setFormError('');
    reset({ name: tax.name, rate: tax.rate, appliesTo: tax.appliesTo });
    setIsModalOpen(true);
  };

  const onSubmit = (formData) => {
    setFormError('');
    saveTaxMutation.mutate(formData);
  };

  const columns = [
    {
      header: 'Tax Rule',
      accessor: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <PercentSquare className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">{row.name}</p>
            <p className="text-xs text-slate-500 capitalize">Target: {row.appliesTo}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Rate',
      accessor: (row) => (
        <span className="font-bold text-slate-900 text-base">{row.rate}%</span>
      ),
    },
    {
      header: 'Scope',
      accessor: (row) => (
        <span className="text-xs capitalize font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
          {row.appliesTo === 'all' ? 'All Lines' : row.appliesTo}
        </span>
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
                if (confirm(`Deactivate tax rule ${row.name}?`)) {
                  deleteTaxMutation.mutate(row._id);
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
            Tax Engine Configuration
          </h1>
          <p className="text-sm text-slate-500">
            Admin only: define automated sales taxes, VAT, and GST breakdown formulas
          </p>
        </div>
        <Button onClick={openCreateModal} icon={Plus}>
          Add Tax Rule
        </Button>
      </div>

      <Table
        columns={columns}
        data={data?.data}
        isLoading={isLoading}
        emptyMessage="No tax rules configured yet."
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTax ? 'Edit Tax Rule' : 'Add Tax Rule'}
      >
        {formError && (
          <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-sm rounded-lg border border-rose-200">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Tax Rule Name *"
            placeholder="e.g. GST 18% or VAT 10%"
            {...register('name')}
            error={errors.name?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Tax Rate (%) *"
              type="number"
              step="0.01"
              placeholder="18"
              {...register('rate')}
              error={errors.rate?.message}
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Applies To *
              </label>
              <select
                {...register('appliesTo')}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Products & Services</option>
                <option value="products">Physical Goods Only</option>
                <option value="services">Services Only</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting || saveTaxMutation.isPending}>
              {editingTax ? 'Update Tax' : 'Save Tax Rule'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
