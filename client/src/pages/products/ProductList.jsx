import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Package, Plus, Trash2, Edit2, Search, PlusCircle, Tag } from 'lucide-react';

const productSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  type: z.enum(['service', 'goods', 'digital']),
  salesPrice: z.coerce.number().min(0, 'Price must be 0 or more'),
  costPrice: z.coerce.number().min(0, 'Cost must be 0 or more').default(0),
  notes: z.string().optional(),
  variants: z
    .array(
      z.object({
        attribute: z.string().min(1, 'Attribute is required'),
        value: z.string().min(1, 'Value is required'),
        extraPrice: z.coerce.number().min(0).default(0),
      })
    )
    .optional(),
});

export const ProductList = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formError, setFormError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, search],
    queryFn: () =>
      api.get(`/products?page=${page}&limit=10&search=${encodeURIComponent(search)}`),
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      type: 'service',
      salesPrice: 0,
      costPrice: 0,
      variants: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants',
  });

  const saveProductMutation = useMutation({
    mutationFn: (productData) => {
      if (editingProduct) {
        return api.put(`/products/${editingProduct._id}`, productData);
      }
      return api.post('/products', productData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      setIsModalOpen(false);
      setEditingProduct(null);
      reset();
    },
    onError: (err) => {
      setFormError(err.message || 'Failed to save product');
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
    },
  });

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormError('');
    reset({
      name: '',
      type: 'service',
      salesPrice: 0,
      costPrice: 0,
      notes: '',
      variants: [],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormError('');
    reset({
      name: product.name,
      type: product.type || 'service',
      salesPrice: product.salesPrice,
      costPrice: product.costPrice || 0,
      notes: product.notes || '',
      variants: product.variants || [],
    });
    setIsModalOpen(true);
  };

  const onSubmit = (formData) => {
    setFormError('');
    saveProductMutation.mutate(formData);
  };

  const columns = [
    {
      header: 'Product',
      accessor: (row) => (
        <div>
          <p className="font-semibold text-slate-800">{row.name}</p>
          {row.notes && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{row.notes}</p>}
        </div>
      ),
    },
    {
      header: 'Type',
      accessor: (row) => (
        <span className="capitalize text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
          {row.type}
        </span>
      ),
    },
    {
      header: 'Sales Price',
      accessor: (row) => (
        <span className="font-semibold text-slate-900">${row.salesPrice.toFixed(2)}</span>
      ),
    },
    {
      header: 'Cost Price',
      accessor: (row) => (
        <span className="text-slate-500 text-xs">${(row.costPrice || 0).toFixed(2)}</span>
      ),
    },
    {
      header: 'Variants',
      accessor: (row) =>
        row.variants && row.variants.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {row.variants.map((v, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-[11px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100"
              >
                <Tag className="w-2.5 h-2.5" />
                <span>
                  {v.attribute}: {v.value}
                  {v.extraPrice > 0 ? ` (+\\$${v.extraPrice})` : ''}
                </span>
              </span>
            ))}
          </div>
        ) : (
          <span className="text-xs text-slate-400">None</span>
        ),
    },
    {
      header: 'Status',
      accessor: (row) => (
        <Badge status={row.isActive ? 'active' : 'closed'}>
          {row.isActive ? 'Active' : 'Archived'}
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
                {row.isActive && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    onClick={() => {
                      if (confirm(`Deactivate product ${row.name}?`)) {
                        deleteProductMutation.mutate(row._id);
                      }
                    }}
                    icon={Trash2}
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
            Products & Variants
          </h1>
          <p className="text-sm text-slate-500">
            Define catalog items, billable add-ons, software licenses, and variant pricing
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openCreateModal} icon={Plus}>
            Add Product
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search products by title or description..."
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
        data={data?.data?.products}
        isLoading={isLoading}
        emptyMessage="No products configured yet."
      />

      <Pagination
        page={page}
        totalPages={data?.data?.pagination?.pages || 1}
        total={data?.data?.pagination?.total || 0}
        onPageChange={setPage}
      />

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Product & Variants' : 'Create New Product'}
        maxWidth="max-w-2xl"
      >
        {formError && (
          <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-sm rounded-lg border border-rose-200">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Product Name *"
              placeholder="e.g. Cloud Hosting Pro"
              {...register('name')}
              error={errors.name?.message}
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Product Type *
              </label>
              <select
                {...register('type')}
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
              >
                <option value="service">Service</option>
                <option value="digital">Digital Product</option>
                <option value="goods">Physical Goods</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Sales Price ($) *"
              type="number"
              step="0.01"
              placeholder="99.00"
              {...register('salesPrice')}
              error={errors.salesPrice?.message}
            />
            <Input
              label="Cost Price ($)"
              type="number"
              step="0.01"
              placeholder="25.00"
              {...register('costPrice')}
              error={errors.costPrice?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description / Internal Notes
            </label>
            <textarea
              {...register('notes')}
              rows={2}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
              placeholder="Optional notes or technical details..."
            />
          </div>

          {/* Variants section */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Product Variants (e.g. Attribute: Brand, Value: Odoo, Extra: $560)
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ attribute: '', value: '', extraPrice: 0 })}
                icon={PlusCircle}
              >
                Add Variant
              </Button>
            </div>

            {fields.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                No variants configured. Product will be sold as a single standard item.
              </p>
            ) : (
              <div className="space-y-2">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <Input
                      placeholder="Attribute (e.g. Brand)"
                      {...register(`variants.${index}.attribute`)}
                      containerClassName="flex-1"
                    />
                    <Input
                      placeholder="Value (e.g. Odoo / AWS)"
                      {...register(`variants.${index}.value`)}
                      containerClassName="flex-1"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Extra $"
                      {...register(`variants.${index}.extraPrice`)}
                      containerClassName="w-24"
                    />
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="p-2 text-rose-500 hover:text-rose-700 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting || saveProductMutation.isPending}>
              {editingProduct ? 'Update Product' : 'Save Product'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
