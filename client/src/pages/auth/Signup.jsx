import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{9,}$/;

const signupSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    company: z.string().optional(),
    phone: z.string().optional(),
    password: z
      .string()
      .regex(
        passwordRegex,
        'Password must be at least 9 characters and include uppercase, lowercase, and a special character'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signupSchema),
  });

  const pwd = watch('password', '');

  // Live password strength checks
  const ruleMinLen = pwd.length >= 9;
  const ruleUpper = /[A-Z]/.test(pwd);
  const ruleLower = /[a-z]/.test(pwd);
  const ruleSpecial = /[^a-zA-Z0-9]/.test(pwd);

  const onSubmit = async (data) => {
    try {
      setServerError('');
      await signup({
        name: data.name,
        email: data.email,
        password: data.password,
        company: data.company,
        phone: data.phone,
      });
      navigate('/portal/subscriptions', { replace: true });
    } catch (err) {
      setServerError(err.message || 'Failed to create account. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200/60 p-8 my-8">
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-indigo-600 text-white items-center justify-center font-black text-2xl shadow-lg shadow-indigo-500/30 mb-3">
            B
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Create Customer Account
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Access and manage your subscriptions and billing in one place
          </p>
        </div>

        {serverError && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name *"
              placeholder="Sarah Miller"
              {...register('name')}
              error={errors.name?.message}
            />
            <Input
              label="Company Name"
              placeholder="Acme Corp (optional)"
              {...register('company')}
              error={errors.company?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email Address *"
              type="email"
              placeholder="sarah@acme.com"
              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              label="Phone Number"
              placeholder="+1 555-0199 (optional)"
              {...register('phone')}
              error={errors.phone?.message}
            />
          </div>

          <Input
            label="Password *"
            type="password"
            placeholder="At least 9 characters"
            {...register('password')}
            error={errors.password?.message}
          />

          {/* Password requirement checklist */}
          <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1.5 border border-slate-200 text-slate-600">
            <p className="font-semibold text-slate-700 mb-1">Password Requirements:</p>
            <div className="flex items-center gap-1.5">
              <CheckCircle2
                className={`w-3.5 h-3.5 ${
                  ruleMinLen ? 'text-emerald-500' : 'text-slate-300'
                }`}
              />
              <span className={ruleMinLen ? 'text-emerald-700 font-medium' : ''}>
                More than 8 characters (minimum 9 characters)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2
                className={`w-3.5 h-3.5 ${
                  ruleUpper ? 'text-emerald-500' : 'text-slate-300'
                }`}
              />
              <span className={ruleUpper ? 'text-emerald-700 font-medium' : ''}>
                At least one uppercase letter (A-Z)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2
                className={`w-3.5 h-3.5 ${
                  ruleLower ? 'text-emerald-500' : 'text-slate-300'
                }`}
              />
              <span className={ruleLower ? 'text-emerald-700 font-medium' : ''}>
                At least one lowercase letter (a-z)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2
                className={`w-3.5 h-3.5 ${
                  ruleSpecial ? 'text-emerald-500' : 'text-slate-300'
                }`}
              />
              <span className={ruleSpecial ? 'text-emerald-700 font-medium' : ''}>
                At least one special character (!@#$%^&*...)
              </span>
            </div>
          </div>

          <Input
            label="Confirm Password *"
            type="password"
            placeholder="Re-enter password"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
          />

          <Button
            type="submit"
            className="w-full mt-2"
            size="lg"
            isLoading={isSubmitting}
            icon={UserPlus}
          >
            Create Customer Account
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Already registered?{' '}
          <Link
            to="/login"
            className="font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
};
