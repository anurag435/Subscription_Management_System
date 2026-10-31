import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import {
  DollarSign,
  Repeat,
  AlertTriangle,
  CreditCard,
  TrendingUp,
  ArrowUpRight,
  ShieldAlert,
  Plus,
  Play,
  Users,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { Loader } from '../../components/common/Loader';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';

export const Dashboard = () => {
  const navigate = useNavigate();

  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ['report-metrics'],
    queryFn: () => api.get('/reports/metrics'),
    refetchInterval: 30000,
  });

  const { data: trendData } = useQuery({
    queryKey: ['report-revenue-trend'],
    queryFn: () => api.get('/reports/revenue-trend'),
  });

  const { data: planDistData } = useQuery({
    queryKey: ['report-plan-dist'],
    queryFn: () => api.get('/reports/plan-distribution'),
  });

  const { data: overdueData } = useQuery({
    queryKey: ['report-overdue'],
    queryFn: () => api.get('/reports/overdue-invoices'),
  });

  if (metricsLoading) {
    return <Loader text="Calculating finance metrics..." size="lg" />;
  }

  const metrics = metricsData?.data || {
    mrr: 0,
    arr: 0,
    activeSubscriptions: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    overdueCount: 0,
    overdueAmount: 0,
  };

  const chartData =
    trendData?.data && trendData.data.length > 0
      ? trendData.data
      : [{ month: 'Current', revenue: metrics.totalCollected, transactions: 1 }];

  const planData = planDistData?.data || [];
  const overdueList = overdueData?.data || [];

  return (
    <div className="space-y-8">
      {/* Page Header & Quick Shortcuts */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Financial Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            Real-time subscription metrics, MRR forecasts, cash collection, and accounts receivable
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/customers')}
            icon={Users}
          >
            Add Customer
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/subscriptions')}
            icon={Plus}
          >
            New Subscription
          </Button>
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* MRR Card */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Monthly Recurring (MRR)
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-black text-slate-900 font-mono">
              ${metrics.mrr.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h2>
            <p className="text-xs text-indigo-600 font-medium mt-1">
              ARR Run-Rate: ${metrics.arr.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Subscriptions
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-black text-slate-900 font-mono">
              {metrics.activeSubscriptions}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Live recurring contracts
            </p>
          </div>
        </div>

        {/* Total Cash Collected */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Cash Collected
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-black text-slate-900 font-mono">
              ${metrics.totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Settled across {metrics.paymentCount} payments
            </p>
          </div>
        </div>

        {/* Outstanding / Overdue */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Outstanding Receivables
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                metrics.overdueCount > 0
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-amber-50 text-amber-600'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-black text-slate-900 font-mono">
              ${metrics.totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h2>
            <p className="text-xs text-rose-600 font-semibold mt-1">
              {metrics.overdueCount} Overdue ($
              {metrics.overdueAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })})
            </p>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Area Chart */}
        <div className="lg:col-span-2 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Revenue Collections</h3>
              <p className="text-xs text-slate-500">Collected cash receipts over time</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  formatter={(val) => [`$${Number(val).toFixed(2)}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plan Distribution Bar Chart */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Plan Adoption</h3>
            <p className="text-xs text-slate-500">Active contracts per tier</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={planData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                <Tooltip
                  formatter={(val) => [val, 'Subscribers']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Overdue Invoices Alert Queue */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            <h3 className="text-base font-bold text-slate-900">Overdue Invoices Queue</h3>
          </div>
          <Link
            to="/invoices?status=Overdue"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {overdueList.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 italic">
            Zero overdue invoices. All accounts receivable are currently in good standing!
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-400 uppercase font-bold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Due Date</th>
                  <th className="py-2.5 px-3 text-right">Balance Due</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overdueList.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 font-mono font-semibold text-indigo-600 text-xs">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-medium text-slate-800">{inv.customer?.name}</p>
                      <p className="text-xs text-slate-400">{inv.customer?.email}</p>
                    </td>
                    <td className="py-3 px-3 text-xs text-rose-600 font-semibold">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-rose-600">
                      ${inv.balanceDue.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        to={`/invoices/${inv._id}`}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        Follow Up →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
