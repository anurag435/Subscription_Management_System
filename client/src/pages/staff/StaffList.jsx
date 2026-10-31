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
import { UserPlus, Search, ShieldCheck, Trash2 } from 'lucide-react';

const staffSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  password: z
    .string()
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{9,}$/,
      'Password must be at least 9 characters with uppercase, lowercase, and special character'
    ),
});

export const StaffList = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['staff', page, search],
    queryFn: () =>
      api.get(`/staff?page=${page}&limit=10&search=${encodeURIComponent(search)}`),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(staffSchema),
  });

  const createStaffMutation = useMutation({
    mutationFn: (newStaff) => api.post('/staff', newStaff),
    onSuccess: () => {
      queryClient.invalidateQueries(['staff']);
      setIsModalOpen(false);
      reset();
    },
    onError: (err) => {
      setFormError(err.message || 'Failed to create staff member');
    },
  });

  const deactivateStaffMutation = useMutation({
    mutationFn: (id) => api.delete(`/staff/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['staff']);
    },
  });

  const onSubmit = (formData) => {
    setFormError('');
    createStaffMutation.mutate(formData);
  };

  const columns = [
    {
      header: 'Staff Member',
      accessor: (row) => (
        <div>
          <p className="font-semibold text-slate-800">{row.name}</p>
          <p className="text-xs text-slate-500">{row.email}</p>
        </div>
      ),
    },
    {
      header: 'Phone',
      accessor: (row) => row.phone || '—',
    },
    {
      header: 'Role',
      accessor: () => <Badge status="staff">Internal Staff</Badge>,
    },
    {
      header: 'Status',
      accessor: (row) => (
        <Badge
          status={row.isActive ? 'active' : 'closed'}
          variant={row.isActive ? 'active' : 'default'}
        >
          {row.isActive ? 'Active' : 'Deactivated'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      className: 'text-right',
      cellClassName: 'text-right',
      accessor: (row) => (
        <div className="flex items-center justify-end gap-2">
          {row.isActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (confirm(`Deactivate staff account for ${row.name}?`)) {
                  deactivateStaffMutation.mutate(row._id);
                }
              }}
              icon={Trash2}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
            >
              Deactivate
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
            Internal Staff Accounts
          </h1>
          <p className="text-sm text-slate-500">
            Admin exclusive: manage internal operators with day-to-day administrative privileges
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
          Add Staff Member
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search staff by name or email..."
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
        data={data?.data?.staff}
        isLoading={isLoading}
        emptyMessage="No staff members found. Click 'Add Staff Member' to create one."
      />

      <Pagination
        page={page}
        totalPages={data?.data?.pagination?.pages || 1}
        total={data?.data?.pagination?.total || 0}
        onPageChange={setPage}
      />

      {/* Add Staff Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Internal Staff Member"
      >
        {formError && (
          <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-sm rounded-lg border border-rose-200">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Full Name *"
            placeholder="David Miller"
            {...register('name')}
            error={errors.name?.message}
          />

          <Input
            label="Email Address *"
            type="email"
            placeholder="david@brightloop.com"
            {...register('email')}
            error={errors.email?.message}
          />

          <Input
            label="Phone Number"
            placeholder="+1 555-0182 (optional)"
            {...register('phone')}
            error={errors.phone?.message}
          />

          <Input
            label="Temporary Password *"
            type="password"
            placeholder="Min 9 chars (Uppercase, lowercase, special)"
            {...register('password')}
            error={errors.password?.message}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting || createStaffMutation.isPending}
              icon={ShieldCheck}
            >
              Create Staff Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
