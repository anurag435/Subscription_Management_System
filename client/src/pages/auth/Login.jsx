import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { LogIn, AlertCircle } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const handleQuickLogin = (email, password) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', password, { shouldValidate: true });
  };

  const onSubmit = async (data) => {
    try {
      setServerError('');
      const loggedUser = await login(data.email, data.password);
      const origin =
        location.state?.from?.pathname ||
        (loggedUser.role === 'customer' ? '/portal/subscriptions' : '/dashboard');
      navigate(origin, { replace: true });
    } catch (err) {
      setServerError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/60 p-8">
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-indigo-600 text-white items-center justify-center font-black text-2xl shadow-lg shadow-indigo-500/30 mb-3">
            B
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Sign in to Brightloop
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Subscription Management & Revenue Platform
          </p>
        </div>

        {serverError && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="admin@brightloop.com"
            {...register('email')}
            error={errors.email?.message}
          />

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              type="password"
              placeholder="•••••••••"
              {...register('password')}
              error={errors.password?.message}
            />
          </div>

          <Button
            type="submit"
            className="w-full mt-2"
            size="lg"
            isLoading={isSubmitting}
            icon={LogIn}
          >
            Sign In
          </Button>
        </form>

        {/* Quick Demo Autofill Section */}
        <div className="mt-6 pt-5 border-t border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5 text-center">
            ⚡ Quick Demo Logins (Click to autofill)
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@brightloop.com', 'Admin@12345!')}
              className="px-2 py-2 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200 text-center transition flex flex-col items-center gap-0.5"
            >
              <span className="text-sm">👑</span>
              <span>Admin</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('staff@brightloop.com', 'Staff@12345!')}
              className="px-2 py-2 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 text-center transition flex flex-col items-center gap-0.5"
            >
              <span className="text-sm">💼</span>
              <span>Staff</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('customer@acme.com', 'Customer@12345!')}
              className="px-2 py-2 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg border border-amber-200 text-center transition flex flex-col items-center gap-0.5"
            >
              <span className="text-sm">👤</span>
              <span>Customer</span>
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          Don&apos;t have an account yet?{' '}
          <Link
            to="/signup"
            className="font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Create customer account
          </Link>
        </div>
      </div>
    </div>
  );
};
