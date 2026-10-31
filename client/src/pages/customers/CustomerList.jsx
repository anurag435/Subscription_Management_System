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
import { UserPlus, Search, Building, Mail, Phone } from 'lucide-react';

const customerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  company: z.string().optional(),
  phone: z.string().optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
});

export const CustomerList = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, search],
    queryFn: () =>
      api.get(`/customers?page=${page}&limit=10&search=${encodeURIComponent(search)}`),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(customerSchema),
  });

  const createCustomerMutation = useMutation({
    mutationFn: (newCustomer) => api.post('/customers', newCustomer),
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      setIsModalOpen(false);
      reset();
    },
    onError: (err) => {
      setFormError(err.message || 'Failed to create customer');
    },
  });

  const onSubmit = (formData) => {
    setFormError('');
    createCustomerMutation.mutate(formData);
  };

  const columns = [
    {
      header: 'Customer',
      accessor: (row) => (
        <div>
          <p className="font-semibold text-slate-800">{row.name}</p>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
            <Mail className="w-3 h-3" />
            <span>{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Company',
      accessor: (row) => (
        <div className="flex items-center gap-1.5 text-slate-700">
          <Building className="w-3.5 h-3.5 text-slate-400" />
          <span>{row.company || '—'}</span>
        </div>
      ),
    },
    {
      header: 'Phone',
      accessor: (row) => (
        <div className="flex items-center gap-1.5 text-slate-700">
          {row.phone ? (
            <>
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{row.phone}</span>
            </>
          ) : (
            '—'
          )}
        </div>
      ),
    },
    {
      header: 'Location',
      accessor: (row) =>
        row.address?.city || row.address?.country
          ? `${row.address.city ? row.address.city + ', ' : ''}${row.address.country || ''}`
          : '—',
    },
    {
      header: 'Status',
      accessor: (row) => (
        <Badge
          status={row.isActive ? 'active' : 'closed'}
          variant={row.isActive ? 'active' : 'default'}
        >
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Customer Directory
          </h1>
          <p className="text-sm text-slate-500">
            View, onboard and manage client accounts, company entities, and billing profiles
          </p>
        </div>
        <Button
          onClick={() => {
            setFormError('');
            reset();
            setIsModalOpen(true);
          }}
          icon={UserPlus}
        >
          Add Customer
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search customers by name, email or company..."
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
        data={data?.data?.customers}
        isLoading={isLoading}
        emptyMessage="No customers found. Click 'Add Customer' to create one."
      />

      <Pagination
        page={page}
        totalPages={data?.data?.pagination?.pages || 1}
        total={data?.data?.pagination?.total || 0}
        onPageChange={setPage}
      />

      {/* Add Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Customer"
      >
        {formError && (
          <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-sm rounded-lg border border-rose-200">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name *"
              placeholder="Jonathan Doe"
              {...register('name')}
              error={errors.name?.message}
            />
            <Input
              label="Company Name"
              placeholder="OmniCorp Inc."
              {...register('company')}
              error={errors.company?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email Address *"
              type="email"
              placeholder="jonathan@omnicorp.com"
              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              label="Phone Number"
              placeholder="+1 555-0144"
              {...register('phone')}
              error={errors.phone?.message}
            />
          </div>

          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Billing Address
            </p>
            <div className="space-y-3">
              <Input
                label="Street"
                placeholder="123 Innovation Blvd"
                {...register('address.street')}
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Input
                  label="City"
                  placeholder="San Francisco"
                  {...register('address.city')}
                />
                <Input
                  label="State"
                  placeholder="CA"
                  {...register('address.state')}
                />
                <Input
                  label="Zip"
                  placeholder="94105"
                  {...register('address.zip')}
                />
                <Input
                  label="Country"
                  placeholder="USA"
                  {...register('address.country')}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting || createCustomerMutation.isPending}
            >
              Save Customer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
