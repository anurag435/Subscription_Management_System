import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Loader } from '../../components/common/Loader';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import {
  ArrowLeft,
  Printer,
  Mail,
  CheckCircle,
  XCircle,
  CreditCard,
  Building,
  Calendar,
  AlertCircle,
} from 'lucide-react';

export const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isCustomer } = useAuth();
  const [actionMsg, setActionMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Payment modal state (wired up for Phase 5)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [paymentNote, setPaymentNote] = useState('');

  const { data: invData, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => api.get(`/invoices/${id}`),
  });

  const confirmMutation = useMutation({
    mutationFn: () => api.patch(`/invoices/${id}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries(['invoice', id]);
      queryClient.invalidateQueries(['invoices']);
      setActionMsg('Invoice confirmed successfully');
    },
    onError: (err) => setErrorMsg(err.message || 'Confirmation failed'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.patch(`/invoices/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries(['invoice', id]);
      queryClient.invalidateQueries(['invoices']);
      setActionMsg('Invoice cancelled');
    },
    onError: (err) => setErrorMsg(err.message || 'Cancellation failed'),
  });

  const sendEmailMutation = useMutation({
    mutationFn: () => api.post(`/invoices/${id}/send`),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['invoice', id]);
      setActionMsg(res.message);
    },
    onError: (err) => setErrorMsg(err.message || 'Failed to send invoice email'),
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (payData) => api.post('/payments', payData),
    onSuccess: () => {
      queryClient.invalidateQueries(['invoice', id]);
      queryClient.invalidateQueries(['invoices']);
      setIsPaymentModalOpen(false);
      setActionMsg('Payment recorded successfully');
    },
    onError: (err) => setErrorMsg(err.message || 'Payment processing failed'),
  });

  if (isLoading) {
    return <Loader text="Loading invoice document..." size="lg" />;
  }

  const invoice = invData?.data;
  if (!invoice) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>Invoice not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleRecordPaymentSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg('Please enter a valid payment amount');
      return;
    }
    if (amt > invoice.balanceDue) {
      setErrorMsg(`Payment amount cannot exceed balance due ($${invoice.balanceDue.toFixed(2)})`);
      return;
    }
    recordPaymentMutation.mutate({
      invoiceId: invoice._id,
      amount: amt,
      method: paymentMethod,
      note: paymentNote,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header (Hidden in Print View) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
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
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                {invoice.invoiceNumber}
              </h1>
              <Badge status={invoice.status} />
            </div>
            {invoice.sentAt && (
              <p className="text-xs text-slate-400 mt-0.5">
                Sent to customer on {new Date(invoice.sentAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {invoice.status === 'Draft' && !isCustomer && (
            <Button
              variant="success"
              onClick={() => confirmMutation.mutate()}
              isLoading={confirmMutation.isPending}
              icon={CheckCircle}
            >
              Confirm Invoice
            </Button>
          )}

          {!isCustomer && invoice.status !== 'Paid' && invoice.status !== 'Cancelled' && (
            <Button
              variant="outline"
              onClick={() => sendEmailMutation.mutate()}
              isLoading={sendEmailMutation.isPending}
              icon={Mail}
            >
              Email Customer
            </Button>
          )}

          <Button variant="outline" onClick={handlePrint} icon={Printer}>
            Print / PDF
          </Button>

          {!isCustomer && invoice.balanceDue > 0 && invoice.status !== 'Cancelled' && (
            <Button
              variant="primary"
              onClick={() => {
                setPaymentAmount(invoice.balanceDue.toString());
                setErrorMsg('');
                setIsPaymentModalOpen(true);
              }}
              icon={CreditCard}
            >
              Record Payment
            </Button>
          )}

          {!isCustomer && invoice.status !== 'Paid' && invoice.status !== 'Cancelled' && (
            <Button
              variant="ghost"
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              onClick={() => {
                if (confirm('Cancel this invoice?')) cancelMutation.mutate();
              }}
              isLoading={cancelMutation.isPending}
              icon={XCircle}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      {actionMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center gap-2 print:hidden">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{actionMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-2 print:hidden">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Printable Invoice Document Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 md:p-12 print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-8 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-base shadow">
                B
              </div>
              <span className="text-xl font-black text-slate-900 tracking-tight">
                Brightloop Software
              </span>
            </div>
            <p className="text-xs text-slate-500">Cloud Infrastructure & Software Solutions</p>
            <p className="text-xs text-slate-500">billing@brightloop.com • +1 (800) 555-LOOP</p>
          </div>

          <div className="text-left sm:text-right space-y-1">
            <h2 className="text-2xl font-black text-slate-900 font-mono">
              INVOICE
            </h2>
            <p className="text-sm font-semibold text-slate-800 font-mono">
              {invoice.invoiceNumber}
            </p>
            <div className="pt-1">
              <Badge status={invoice.status} />
            </div>
          </div>
        </div>

        {/* Invoice Info & Billing Parties */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-b border-slate-200 text-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Billed To
            </p>
            <p className="font-bold text-slate-900 text-base">{invoice.customer?.name}</p>
            {invoice.customer?.company && (
              <p className="text-slate-700 font-medium">{invoice.customer.company}</p>
            )}
            <p className="text-slate-500 text-xs mt-1">{invoice.customer?.email}</p>
            {invoice.customer?.phone && (
              <p className="text-slate-500 text-xs">{invoice.customer.phone}</p>
            )}
            {invoice.customer?.address?.street && (
              <p className="text-slate-500 text-xs mt-1">
                {invoice.customer.address.street}, {invoice.customer.address.city}{' '}
                {invoice.customer.address.state} {invoice.customer.address.zip},{' '}
                {invoice.customer.address.country}
              </p>
            )}
          </div>

          <div className="space-y-2 text-xs md:text-right">
            <div className="flex justify-between md:justify-end gap-6">
              <span className="text-slate-400 font-semibold uppercase">Invoice Date:</span>
              <span className="font-semibold text-slate-800">
                {new Date(invoice.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between md:justify-end gap-6">
              <span className="text-slate-400 font-semibold uppercase">Due Date:</span>
              <span className="font-bold text-indigo-600">
                {new Date(invoice.dueDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between md:justify-end gap-6">
              <span className="text-slate-400 font-semibold uppercase">Billing Cycle:</span>
              <span className="text-slate-700">
                {new Date(invoice.billingPeriodStart).toLocaleDateString()} –{' '}
                {new Date(invoice.billingPeriodEnd).toLocaleDateString()}
              </span>
            </div>
            {invoice.subscription?.subscriptionNumber && (
              <div className="flex justify-between md:justify-end gap-6">
                <span className="text-slate-400 font-semibold uppercase">Subscription:</span>
                <span className="font-mono text-slate-800">
                  {invoice.subscription.subscriptionNumber}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="py-8 border-b border-slate-200 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase text-slate-400 font-bold border-b border-slate-200 pb-3">
                <th className="py-2 px-1">Description</th>
                <th className="py-2 px-3 text-center">Qty</th>
                <th className="py-2 px-3 text-right">Unit Price</th>
                <th className="py-2 px-3 text-right">Taxes</th>
                <th className="py-2 px-1 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.lines?.map((line, idx) => (
                <tr key={idx}>
                  <td className="py-3 px-1">
                    <p className="font-semibold text-slate-800">{line.name}</p>
                    {line.variant?.attribute && (
                      <p className="text-xs text-slate-500">
                        {line.variant.attribute}: {line.variant.value}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center text-slate-600">
                    {line.quantity}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-600">
                    ${line.unitPrice.toFixed(2)}
                  </td>
                  <td className="py-3 px-3 text-right text-xs text-slate-500">
                    {line.lineTaxes && line.lineTaxes.length > 0 ? (
                      line.lineTaxes.map((t, ti) => (
                        <span key={ti}>
                          {t.name} (${t.amount.toFixed(2)})
                        </span>
                      ))
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-3 px-1 text-right font-bold text-slate-900">
                    ${line.lineSubtotal.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Discounts & Tax Breakdown & Totals */}
        <div className="py-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Left Column: Tax & Discounts Details */}
          <div className="space-y-4">
            {invoice.discountsApplied?.length > 0 && (
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-2">
                  Discounts Applied
                </p>
                <div className="space-y-1">
                  {invoice.discountsApplied.map((d, di) => (
                    <div
                      key={di}
                      className="flex items-center justify-between text-xs text-emerald-900 font-medium"
                    >
                      <span>{d.name}</span>
                      <span>- ${d.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {invoice.taxBreakdown?.length > 0 && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Tax Breakdown
                </p>
                <div className="space-y-1 text-xs">
                  {invoice.taxBreakdown.map((t, ti) => (
                    <div
                      key={ti}
                      className="flex items-center justify-between text-slate-700"
                    >
                      <span>
                        {t.name} ({t.rate}%)
                      </span>
                      <span>${t.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Totals Summary */}
          <div className="space-y-2 text-sm md:pl-12">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-800">
                ${invoice.subtotal.toFixed(2)}
              </span>
            </div>

            {invoice.discountTotal > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount Total:</span>
                <span className="font-semibold">
                  - ${invoice.discountTotal.toFixed(2)}
                </span>
              </div>
            )}

            {invoice.taxTotal > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Taxes & Duties:</span>
                <span className="font-semibold text-slate-800">
                  + ${invoice.taxTotal.toFixed(2)}
                </span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 flex justify-between text-base font-bold text-slate-900">
              <span>Total Invoice Amount:</span>
              <span className="text-indigo-600 font-black">
                ${invoice.total.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between text-xs text-slate-500 pt-1">
              <span>Amount Paid:</span>
              <span>${invoice.amountPaid.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-base font-black pt-2 border-t border-slate-100">
              <span className="text-slate-800">Balance Due:</span>
              <span
                className={
                  invoice.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'
                }
              >
                ${invoice.balanceDue.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Notes */}
        <div className="pt-8 border-t border-slate-100 text-xs text-slate-400 text-center">
          <p>Thank you for doing business with Brightloop Software.</p>
          <p className="mt-1">
            Questions regarding this invoice? Contact support@brightloop.com
          </p>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`Record Payment for ${invoice.invoiceNumber}`}
      >
        <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between text-sm">
            <span className="text-slate-600">Outstanding Balance:</span>
            <span className="font-bold text-rose-600">
              ${invoice.balanceDue.toFixed(2)}
            </span>
          </div>

          <Input
            label="Payment Amount ($) *"
            type="number"
            step="0.01"
            max={invoice.balanceDue}
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            helperText="Supports partial payments. Overpayments are rejected."
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Payment Method *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
            >
              <option value="card">Credit / Debit Card</option>
              <option value="bank transfer">Bank Transfer (ACH / Wire)</option>
              <option value="UPI">UPI</option>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Transaction Note / Reference
            </label>
            <input
              type="text"
              placeholder="e.g. Wire Ref #88921"
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={() => setIsPaymentModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={recordPaymentMutation.isPending}
              icon={CreditCard}
            >
              Confirm Payment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
