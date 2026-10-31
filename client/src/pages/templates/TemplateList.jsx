import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../api/axios';
import { Table } from '../../components/common/Table';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { Pagination } from '../../components/common/Pagination';
import { FileSpreadsheet, Plus, Trash2, Layers, PlusCircle } from 'lucide-react';

const templateSchema = z.object({
  name: z.string().min(2, 'Template name is required'),
  validityDays: z.coerce.number().min(1, 'Validity days must be at least 1').default(30),
  plan: z.string().min(1, 'Please select a plan'),
  lines: z
    .array(
      z.object({
        product: z.string().min(1, 'Product is required'),
        quantity: z.coerce.number().min(1).default(1),
      })
    )
    .min(1, 'At least one product line is required'),
});

export const TemplateList = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState('');

  const { data: templatesData, isLoading } = useQuery({
    queryKey: ['templates', page],
    queryFn: () => api.get(`/templates?page=${page}&limit=10`),
  });

  const { data: plansData } = useQuery({
    queryKey: ['plans-list'],
    queryFn: () => api.get('/plans?status=active&limit=100'),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products-list'],
    queryFn: () => api.get('/products?activeOnly=true&limit=100'),
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      validityDays: 30,
      lines: [{ product: '', quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines',
  });

  const createTemplateMutation = useMutation({
    mutationFn: (newTemplate) => api.post('/templates', newTemplate),
    onSuccess: () => {
      queryClient.invalidateQueries(['templates']);
      setIsModalOpen(false);
      reset();
    },
    onError: (err) => {
      setFormError(err.message || 'Failed to create quotation template');
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id) => api.delete(`/templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['templates']);
    },
  });

  const onSubmit = (formData) => {
    setFormError('');
    createTemplateMutation.mutate(formData);
  };

  const columns = [
    {
      header: 'Template Name',
      accessor: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">{row.name}</p>
            <p className="text-xs text-slate-500">Expires in {row.validityDays} days</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Default Plan',
      accessor: (row) => (
        <div className="text-sm">
          <p className="font-medium text-slate-800">{row.plan?.name || '—'}</p>
          <p className="text-xs text-slate-500 capitalize">
            ${row.plan?.price || 0} / {row.plan?.billingPeriod || ''}
          </p>
        </div>
      ),
    },
    {
      header: 'Pre-configured Items',
      accessor: (row) => (
        <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
          {row.lines?.length || 0} item line(s)
        </span>
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
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
            onClick={() => {
              if (confirm(`Delete template '${row.name}'?`)) {
                deleteTemplateMutation.mutate(row._id);
              }
            }}
            icon={Trash2}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Quotation Templates
          </h1>
          <p className="text-sm text-slate-500">
            Speed up deals: pre-configure bundles, plan pricing, validity periods, and product packages
          </p>
        </div>
        <Button
          onClick={() => {
            setFormError('');
            reset({ validityDays: 30, lines: [{ product: '', quantity: 1 }] });
            setIsModalOpen(true);
          }}
          icon={Plus}
        >
          New Template
        </Button>
      </div>

      <Table
        columns={columns}
        data={templatesData?.data?.templates}
        isLoading={isLoading}
        emptyMessage="No quotation templates configured yet."
      />

      <Pagination
        page={page}
        totalPages={templatesData?.data?.pagination?.pages || 1}
        total={templatesData?.data?.pagination?.total || 0}
        onPageChange={setPage}
      />

      {/* Add Template Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Quotation Template"
        maxWidth="max-w-xl"
      >
        {formError && (
          <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-sm rounded-lg border border-rose-200">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Template Name *"
            placeholder="e.g. Standard SaaS Onboarding Pack"
            {...register('name')}
            error={errors.name?.message}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Default Recurring Plan *
              </label>
              <select
                {...register('plan')}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select Plan...</option>
                {plansData?.data?.plans?.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} (${p.price}/{p.billingPeriod})
                  </option>
                ))}
              </select>
              {errors.plan && (
                <p className="mt-1 text-xs text-rose-600">{errors.plan.message}</p>
              )}
            </div>

            <Input
              label="Quotation Validity (Days) *"
              type="number"
              min="1"
              placeholder="30"
              {...register('validityDays')}
              error={errors.validityDays?.message}
            />
          </div>

          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Included Products & Add-ons
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ product: '', quantity: 1 })}
                icon={PlusCircle}
              >
                Add Item
              </Button>
            </div>

            <div className="space-y-2">
              {fields.map((field, idx) => (
                <div key={field.id} className="flex items-center gap-2">
                  <select
                    {...register(`lines.${idx}.product`)}
                    className="flex-1 px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Choose item...</option>
                    {productsData?.data?.products?.map((prod) => (
                      <option key={prod._id} value={prod._id}>
                        {prod.name} (${prod.salesPrice})
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
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      className="p-2 text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {errors.lines && (
              <p className="mt-1 text-xs text-rose-600">{errors.lines.message}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting || createTemplateMutation.isPending}
            >
              Save Template
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
