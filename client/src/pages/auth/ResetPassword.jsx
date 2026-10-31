import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../api/axios';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Lock, AlertCircle, CheckCircle, CheckCircle2 } from 'lucide-react';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{9,}$/;

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .regex(
        passwordRegex,
        'Password must be at least 9 characters long with uppercase, lowercase, and special character'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  });

  const pwd = watch('password', '');
  const ruleMinLen = pwd.length >= 9;
  const ruleUpper = /[A-Z]/.test(pwd);
  const ruleLower = /[a-z]/.test(pwd);
  const ruleSpecial = /[^a-zA-Z0-9]/.test(pwd);

  const onSubmit = async (data) => {
    try {
      setServerError('');
      const res = await api.post(`/auth/reset-password/${token}`, {
        password: data.password,
      });
      // Store token
      if (res.data?.token) {
        localStorage.setItem('token', res.data.token);
      }
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
    } catch (err) {
      setServerError(
        err.message || 'Failed to reset password. Link may have expired.'
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/60 p-8">
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 items-center justify-center mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Create New Password
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Choose a strong password with at least 9 characters
          </p>
        </div>

        {serverError && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="text-center space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 text-sm">
              <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600" />
              <span>
                Your password has been reset successfully! Redirecting you to login...
              </span>
            </div>
            <Link
              to="/login"
              className="inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-700 mt-2"
            >
              Sign in now
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="New Password"
              type="password"
              placeholder="Min 9 characters"
              {...register('password')}
              error={errors.password?.message}
            />

            <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1.5 border border-slate-200 text-slate-600">
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
              label="Confirm New Password"
              type="password"
              placeholder="Confirm new password"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
            />

            <Button
              type="submit"
              className="w-full mt-2"
              size="lg"
              isLoading={isSubmitting}
            >
              Update Password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
