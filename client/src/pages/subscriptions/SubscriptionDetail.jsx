import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Loader } from '../../components/common/Loader';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Play,
  Pause,
  XCircle,
  RotateCw,
  Send,
  Building,
  Mail,
  Calendar,
  Layers,
  History,
  FileText,
} from 'lucide-react';

export const SubscriptionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isCustomer } = useAuth();
  const [transitionNote, setTransitionNote] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { data: subData, isLoading } = useQuery({
    queryKey: ['subscription', id],
    queryFn: () => api.get(`/subscriptions/${id}`),
  });

  const transitionMutation = useMutation({
    mutationFn: ({ targetStatus, note }) =>
      api.patch(`/subscriptions/${id}/transition`, { targetStatus, note }),
    onSuccess: () => {
      queryClient.invalidateQueries(['subscription', id]);
      queryClient.invalidateQueries(['subscriptions']);
      setTransitionNote('');
      setErrorMsg('');
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Status transition failed');
    },
  });

  const renewMutation = useMutation({
    mutationFn: () => api.post(`/subscriptions/${id}/renew`),
    onSuccess: () => {
      queryClient.invalidateQueries(['subscription', id]);
      queryClient.invalidateQueries(['subscriptions']);
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Renewal failed');
    },
  });

  const generateInvoiceMutation = useMutation({
    mutationFn: () => api.post(`/invoices/generate/${id}`),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['invoices']);
      navigate(`/invoices/${res.data._id}`);
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Failed to generate invoice');
    },
  });

  if (isLoading) {
    return <Loader text="Loading subscription details..." size="lg" />;
  }

  const sub = subData?.data;
  if (!sub) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>Subscription record not found.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate('/subscriptions')}
        >
          Return to list
        </Button>
      </div>
    );
  }

  // Visual Lifecycle Stepper definition
  const steps = ['Draft', 'Quotation', 'Confirmed', 'Active', 'Closed'];
  const currentStepIndex = steps.indexOf(sub.status);

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            icon={ArrowLeft}
          >
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                {sub.subscriptionNumber}
              </h1>
              <Badge status={sub.status} className="text-sm py-1 px-3" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Created on {new Date(sub.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Lifecycle Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {sub.status === 'Draft' && (
            <Button
              onClick={() =>
                transitionMutation.mutate({
                  targetStatus: 'Quotation',
                  note: 'Sent formal quotation to customer',
                })
              }
              isLoading={transitionMutation.isPending}
              icon={Send}
            >
              Send Quotation
            </Button>
          )}

          {sub.status === 'Quotation' && (
            <>
              <Button
                variant="outline"
                onClick={() =>
                  transitionMutation.mutate({
                    targetStatus: 'Draft',
                    note: 'Returned to draft for adjustments',
                  })
                }
                isLoading={transitionMutation.isPending}
              >
                Back to Draft
              </Button>
              <Button
                variant="success"
                onClick={() =>
                  transitionMutation.mutate({
                    targetStatus: 'Confirmed',
                    note: 'Quotation confirmed by customer',
                  })
                }
                isLoading={transitionMutation.isPending}
                icon={CheckCircle2}
              >
                Confirm Subscription
              </Button>
            </>
          )}

          {sub.status === 'Confirmed' && (
            <Button
              variant="primary"
              onClick={() =>
                transitionMutation.mutate({
                  targetStatus: 'Active',
                  note: 'Subscription activated and scheduled for billing',
                })
              }
              isLoading={transitionMutation.isPending}
              icon={Play}
            >
              Activate Service
            </Button>
          )}

          {sub.status === 'Active' && (
            <>
              {!isCustomer && (
                <Button
                  variant="outline"
                  onClick={() => generateInvoiceMutation.mutate()}
                  isLoading={generateInvoiceMutation.isPending}
                  icon={FileText}
                >
                  Generate Invoice
                </Button>
              )}
              {sub.plan?.options?.allowPause && (
                <Button
                  variant="secondary"
                  onClick={() =>
                    transitionMutation.mutate({
                      targetStatus: 'Paused',
                      note: 'Subscription temporarily paused',
                    })
                  }
                  isLoading={transitionMutation.isPending}
                  icon={Pause}
                >
                  Pause
                </Button>
              )}
              {sub.plan?.options?.allowEarlyClose && (
                <Button
                  variant="danger"
                  onClick={() => {
                    if (confirm('Cancel and close this active subscription?')) {
                      transitionMutation.mutate({
                        targetStatus: 'Closed',
                        note: 'Subscription cancelled/closed',
                      });
                    }
                  }}
                  isLoading={transitionMutation.isPending}
                  icon={XCircle}
                >
                  Close
                </Button>
              )}
            </>
          )}

          {sub.status === 'Paused' && (
            <Button
              variant="primary"
              onClick={() =>
                transitionMutation.mutate({
                  targetStatus: 'Active',
                  note: 'Subscription resumed',
                })
              }
              isLoading={transitionMutation.isPending}
              icon={Play}
            >
              Resume
            </Button>
          )}

          {sub.status === 'Closed' && sub.plan?.options?.allowRenew && (
            <Button
              variant="primary"
              onClick={() => renewMutation.mutate()}
              isLoading={renewMutation.isPending}
              icon={RotateCw}
            >
              Renew Subscription
            </Button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
          {errorMsg}
        </div>
      )}

      {/* Visual Status Stepper */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-6">
          Subscription Lifecycle State Machine
        </h3>
        <div className="relative flex items-center justify-between">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 z-0" />
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 transition-all duration-500 z-0"
            style={{
              width: `${
                currentStepIndex >= 0
                  ? (currentStepIndex / (steps.length - 1)) * 100
                  : 0
              }%`,
            }}
          />

          {steps.map((st, idx) => {
            const isCompleted = currentStepIndex > idx;
            const isCurrent = sub.status === st;

            return (
              <div
                key={st}
                className="relative z-10 flex flex-col items-center group"
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                    isCurrent
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-md scale-110'
                      : isCompleted
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border-2 border-slate-200 text-slate-400'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                </div>
                <span
                  className={`text-xs mt-2 font-medium capitalize ${
                    isCurrent
                      ? 'text-indigo-600 font-bold'
                      : isCompleted
                      ? 'text-slate-800'
                      : 'text-slate-400'
                  }`}
                >
                  {st}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer Information */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Customer Profile
          </h3>
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-slate-800">{sub.customer?.name}</p>
            {sub.customer?.company && (
              <div className="flex items-center gap-2 text-slate-600 text-xs">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>{sub.customer.company}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-slate-600 text-xs">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{sub.customer?.email}</span>
            </div>
            {sub.customer?.address?.street && (
              <p className="text-xs text-slate-500 pt-1">
                {sub.customer.address.street}, {sub.customer.address.city}{' '}
                {sub.customer.address.country}
              </p>
            )}
          </div>
        </div>

        {/* Plan & Billing Schedule */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Billing Schedule
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs">Plan:</span>
              <span className="font-semibold text-slate-800">{sub.plan?.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs">Cadence:</span>
              <span className="capitalize text-slate-700">
                {sub.plan?.billingPeriod}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs">Next Invoicing:</span>
              <span className="font-semibold text-indigo-600">
                {sub.nextBillingDate
                  ? new Date(sub.nextBillingDate).toLocaleDateString()
                  : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs">Payment Terms:</span>
              <span className="capitalize text-slate-700">{sub.paymentTerms}</span>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Recurring Financials
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Base Plan Fee:</span>
              <span>${(sub.plan?.price || 0).toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Add-ons / Line Total:</span>
              <span>
                $
                {(
                  (sub.recurringSubtotal || 0) - (sub.plan?.price || 0)
                ).toFixed(2)}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="font-bold text-slate-800">Recurring Total:</span>
              <span className="text-xl font-black text-indigo-600">
                ${(sub.recurringSubtotal || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Order Lines Table */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900">
          Order Lines & Deliverables
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Item</th>
                <th className="py-3 px-4">Variant</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sub.lines?.map((line, idx) => (
                <tr key={idx}>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    {line.product?.name || 'Line Item'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 text-xs">
                    {line.variant?.attribute
                      ? `${line.variant.attribute}: ${line.variant.value}${
                          line.variant.extraPrice > 0
                            ? ` (+$${line.variant.extraPrice})`
                            : ''
                        }`
                      : '—'}
                  </td>
                  <td className="py-3.5 px-4 text-center">{line.quantity}</td>
                  <td className="py-3.5 px-4 text-right">
                    ${(line.unitPrice || 0).toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                    ${(line.amount || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status History Timeline */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-bold text-slate-900">Audit & State Transition Trail</h3>
        </div>

        <div className="space-y-4 pl-4 border-l-2 border-indigo-100 ml-2">
          {sub.statusHistory?.map((h, i) => (
            <div key={i} className="relative group">
              <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-indigo-600 ring-4 ring-white" />
              <div className="text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800">
                    {h.fromStatus} → {h.toStatus}
                  </span>
                  <span className="text-slate-400">
                    {new Date(h.changedAt).toLocaleString()}
                  </span>
                  {h.changedBy?.name && (
                    <span className="text-indigo-600 font-medium">
                      by {h.changedBy.name}
                    </span>
                  )}
                </div>
                {h.note && (
                  <p className="text-slate-600 text-xs mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100 inline-block">
                    {h.note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
