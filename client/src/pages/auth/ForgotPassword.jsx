import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { KeyRound, Mail, AlertCircle, CheckCircle } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const ForgotPassword = () => {
  const [isSent, setIsSent] = useState(false);
  const [serverError, setServerError] = useState('');
  const [previewInfo, setPreviewInfo] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data) => {
    try {
      setServerError('');
      const res = await api.post('/auth/forgot-password', data);
      setIsSent(true);
      if (res.data?.resetUrl) {
        setPreviewInfo(res.data);
      }
    } catch (err) {
      setServerError(err.message || 'Failed to request password reset.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/60 p-8">
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 items-center justify-center mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Reset Password
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Enter your email to receive a password reset link
          </p>
        </div>

        {serverError && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {isSent ? (
          <div className="text-center space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 text-sm">
              <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600" />
              <span>
                If your email is registered, we have sent password reset instructions.
              </span>
            </div>

            {previewInfo?.resetUrl && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs text-amber-800">
                <p className="font-semibold mb-1">Development Test Shortcut:</p>
                <a
                  href={previewInfo.resetUrl}
                  className="text-indigo-600 underline break-all font-mono"
                >
                  {previewInfo.resetUrl}
                </a>
              </div>
            )}

            <Link
              to="/login"
              className="inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-700 mt-2"
            >
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="name@example.com"
              {...register('email')}
              error={errors.email?.message}
            />

            <Button
              type="submit"
              className="w-full mt-2"
              size="lg"
              isLoading={isSubmitting}
              icon={Mail}
            >
              Send Reset Link
            </Button>

            <div className="mt-4 text-center">
              <Link
                to="/login"
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                Back to Sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
