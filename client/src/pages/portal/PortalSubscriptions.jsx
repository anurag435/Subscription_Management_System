import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Loader } from '../../components/common/Loader';
import {
  Repeat,
  Pause,
  Play,
  RotateCw,
  XCircle,
  Calendar,
  Layers,
  FileText,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export const PortalSubscriptions = () => {
  const queryClient = useQueryClient();
  const [actionMsg, setActionMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['portal-subscriptions'],
    queryFn: () => api.get('/subscriptions?limit=50'),
  });

  const transitionMutation = useMutation({
    mutationFn: ({ id, targetStatus, note }) =>
      api.patch(`/subscriptions/${id}/transition`, { targetStatus, note }),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['portal-subscriptions']);
      setActionMsg(`Subscription successfully updated: ${res.data.status}`);
      setTimeout(() => setActionMsg(''), 5000);
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Action failed');
    },
  });

  const renewMutation = useMutation({
    mutationFn: (id) => api.post(`/subscriptions/${id}/renew`),
    onSuccess: () => {
      queryClient.invalidateQueries(['portal-subscriptions']);
      setActionMsg('Subscription renewed successfully!');
      setTimeout(() => setActionMsg(''), 5000);
    },
    onError: (err) => {
      setErrorMsg(err.message || 'Renewal failed');
    },
  });

  if (isLoading) {
    return <Loader text="Loading your subscriptions..." size="lg" />;
  }

  const subscriptions = data?.data?.subscriptions || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          My Subscriptions
        </h1>
        <p className="text-sm text-slate-500">
          Manage your active service plans, delivery quotas, renewal policies, and scheduled billing
        </p>
      </div>

      {actionMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {subscriptions.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Repeat className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No subscriptions found</h3>
          <p className="text-xs text-slate-500 mt-1">
            You do not have any active or previous subscriptions on file.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {subscriptions.map((sub) => (
            <div
              key={sub._id}
              className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-semibold text-indigo-600">
                      {sub.subscriptionNumber}
                    </span>
                    <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                      {sub.plan?.name}
                    </h2>
                  </div>
                  <Badge status={sub.status} />
                </div>

                <div className="mt-4 p-3 bg-slate-50 rounded-xl space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Recurring Fee:</span>
                    <span className="font-bold text-slate-900">
                      ${(sub.recurringSubtotal || 0).toFixed(2)} / {sub.plan?.billingPeriod}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Next Invoicing Date:</span>
                    <span className="font-semibold text-slate-800">
                      {sub.nextBillingDate
                        ? new Date(sub.nextBillingDate).toLocaleDateString()
                        : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Started On:</span>
                    <span>{new Date(sub.startDate).toLocaleDateString()}</span>
                  </div>
                </div>

                {sub.lines?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Included Items:
                    </p>
                    <ul className="text-xs text-slate-600 space-y-1">
                      {sub.lines.map((l, i) => (
                        <li key={i} className="flex justify-between">
                          <span>
                            {l.quantity}x {l.product?.name || 'Deliverable'}
                          </span>
                          <span className="font-medium">
                            ${(l.amount || 0).toFixed(2)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Customer Self-Service Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                {sub.status === 'Active' && sub.plan?.options?.allowPause && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      transitionMutation.mutate({
                        id: sub._id,
                        targetStatus: 'Paused',
                        note: 'Paused by customer via portal',
                      })
                    }
                    icon={Pause}
                  >
                    Pause
                  </Button>
                )}

                {sub.status === 'Paused' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      transitionMutation.mutate({
                        id: sub._id,
                        targetStatus: 'Active',
                        note: 'Resumed by customer via portal',
                      })
                    }
                    icon={Play}
                  >
                    Resume
                  </Button>
                )}

                {sub.status === 'Active' && sub.plan?.options?.allowEarlyClose && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      if (confirm('Are you sure you want to cancel your subscription?')) {
                        transitionMutation.mutate({
                          id: sub._id,
                          targetStatus: 'Closed',
                          note: 'Cancelled by customer via portal',
                        });
                      }
                    }}
                    icon={XCircle}
                  >
                    Cancel
                  </Button>
                )}

                {sub.status === 'Closed' && sub.plan?.options?.allowRenew && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => renewMutation.mutate(sub._id)}
                    icon={RotateCw}
                  >
                    Renew Plan
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
