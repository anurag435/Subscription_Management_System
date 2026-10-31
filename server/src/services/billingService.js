import { Invoice } from '../models/Invoice.js';
import { Subscription } from '../models/Subscription.js';
import { Tax } from '../models/Tax.js';
import { Discount } from '../models/Discount.js';
import { calculateNextBillingDate } from './subscriptionService.js';
import { ApiError } from '../utils/ApiError.js';

// Calculate invoice dueDate based on payment terms
export const calculateDueDate = (startDate, paymentTerms = 'immediate') => {
  const d = new Date(startDate || Date.now());
  switch (paymentTerms) {
    case 'net15':
      d.setDate(d.getDate() + 15);
      break;
    case 'net30':
      d.setDate(d.getDate() + 30);
      break;
    case 'net60':
      d.setDate(d.getDate() + 60);
      break;
    case 'immediate':
    default:
      // Same day
      break;
  }
  return d;
};

/**
 * Idempotently generates an invoice for a specific subscription and billing cycle
 */
export const generateInvoiceForSubscription = async (
  subscriptionId,
  periodStart = null,
  periodEnd = null
) => {
  const subscription = await Subscription.findById(subscriptionId)
    .populate('customer')
    .populate('plan')
    .populate('lines.product');

  if (!subscription) {
    throw new ApiError(404, 'Subscription not found');
  }

  // Determine cycle dates
  const cycleStart = periodStart
    ? new Date(periodStart)
    : subscription.nextBillingDate
    ? new Date(subscription.nextBillingDate)
    : new Date();

  const cycleEnd = periodEnd
    ? new Date(periodEnd)
    : calculateNextBillingDate(cycleStart, subscription.plan.billingPeriod);

  // 1. IDEMPOTENT CHECK: Check if invoice already exists for this exact cycle
  const existingInvoice = await Invoice.findOne({
    subscription: subscription._id,
    billingPeriodStart: cycleStart,
  });

  if (existingInvoice) {
    return { invoice: existingInvoice, isDuplicate: true };
  }

  // 2. Fetch active tax rules
  const activeTaxes = await Tax.find({ isActive: true }).lean();

  // 3. Build invoice lines
  let runningSubtotal = 0;
  let totalQuantity = 0;
  const taxBuckets = {}; // taxId -> { taxId, name, rate, amount }

  const invoiceLines = [];

  // Add plan recurring fee line
  if (subscription.plan && subscription.plan.price > 0) {
    const planPrice = subscription.plan.price;
    runningSubtotal += planPrice;

    // Apply taxes that apply to services/all
    const planTaxes = activeTaxes
      .filter((t) => t.appliesTo === 'all' || t.appliesTo === 'services')
      .map((t) => {
        const amt = Number(((planPrice * t.rate) / 100).toFixed(2));
        if (!taxBuckets[t._id]) {
          taxBuckets[t._id] = { taxId: t._id, name: t.name, rate: t.rate, amount: 0 };
        }
        taxBuckets[t._id].amount += amt;
        return { taxId: t._id, name: t.name, rate: t.rate, amount: amt };
      });

    invoiceLines.push({
      name: `${subscription.plan.name} (${subscription.plan.billingPeriod} recurring fee)`,
      quantity: 1,
      unitPrice: planPrice,
      lineSubtotal: planPrice,
      lineTaxes: planTaxes,
    });
  }

  // Add product lines
  for (const line of subscription.lines) {
    const qty = Number(line.quantity) || 1;
    totalQuantity += qty;
    const extra = line.variant?.extraPrice || 0;
    const unitPrice = Number(line.unitPrice) + Number(extra);
    const lineSubtotal = Number((unitPrice * qty).toFixed(2));
    runningSubtotal += lineSubtotal;

    const prodType = line.product?.type || 'service';
    const applicableTaxes = activeTaxes
      .filter(
        (t) =>
          t.appliesTo === 'all' ||
          (t.appliesTo === 'products' && prodType === 'goods') ||
          (t.appliesTo === 'services' && prodType === 'service')
      )
      .map((t) => {
        const amt = Number(((lineSubtotal * t.rate) / 100).toFixed(2));
        if (!taxBuckets[t._id]) {
          taxBuckets[t._id] = { taxId: t._id, name: t.name, rate: t.rate, amount: 0 };
        }
        taxBuckets[t._id].amount += amt;
        return { taxId: t._id, name: t.name, rate: t.rate, amount: amt };
      });

    invoiceLines.push({
      product: line.product?._id,
      name: line.product?.name || 'Deliverable',
      variant: line.variant,
      quantity: qty,
      unitPrice,
      lineSubtotal,
      lineTaxes: applicableTaxes,
    });
  }

  // 4. DISCOUNT ENGINE: check eligible active discount rules
  const now = new Date();
  const eligibleDiscounts = await Discount.find({
    isActive: true,
    startDate: { $lte: now },
    $or: [{ endDate: null }, { endDate: { $gte: now } }],
  });

  const discountsApplied = [];
  let discountTotal = 0;

  for (const disc of eligibleDiscounts) {
    // Check usage limit
    if (disc.usageLimit !== null && disc.usedCount >= disc.usageLimit) {
      continue;
    }

    // Check minimum purchase
    if (disc.minPurchase > 0 && runningSubtotal < disc.minPurchase) {
      continue;
    }

    // Check minimum quantity
    if (disc.minQuantity > 0 && totalQuantity < disc.minQuantity) {
      continue;
    }

    let discountAmount = 0;
    if (disc.type === 'percentage') {
      discountAmount = Number(((runningSubtotal * disc.value) / 100).toFixed(2));
    } else {
      discountAmount = Math.min(disc.value, runningSubtotal - discountTotal);
    }

    if (discountAmount > 0) {
      discountTotal += discountAmount;
      discountsApplied.push({
        discountId: disc._id,
        name: disc.name,
        type: disc.type,
        amount: discountAmount,
      });

      // Increment usedCount
      await Discount.findByIdAndUpdate(disc._id, { $inc: { usedCount: 1 } });
    }
  }

  // 5. TAX ENGINE: aggregate tax breakdown
  const taxBreakdown = Object.values(taxBuckets).map((tb) => ({
    ...tb,
    amount: Number(tb.amount.toFixed(2)),
  }));

  const taxTotal = taxBreakdown.reduce((sum, tb) => sum + tb.amount, 0);

  // Compute final totals
  const subtotal = Number(runningSubtotal.toFixed(2));
  discountTotal = Number(discountTotal.toFixed(2));
  const total = Number(Math.max(0, subtotal - discountTotal + taxTotal).toFixed(2));
  const dueDate = calculateDueDate(cycleStart, subscription.paymentTerms);

  // Create invoice
  const invoice = await Invoice.create({
    subscription: subscription._id,
    customer: subscription.customer._id,
    lines: invoiceLines,
    discountsApplied,
    taxBreakdown,
    subtotal,
    discountTotal,
    taxTotal,
    total,
    amountPaid: 0,
    balanceDue: total,
    dueDate,
    billingPeriodStart: cycleStart,
    billingPeriodEnd: cycleEnd,
    status: 'Draft',
  });

  // Advance subscription billing dates (catch-up / forward schedule)
  subscription.lastBilledAt = cycleStart;
  subscription.nextBillingDate = cycleEnd;
  await subscription.save();

  return { invoice, isDuplicate: false };
};

/**
 * Bulk generate invoices for all active subscriptions due today
 */
export const generateDueInvoices = async () => {
  const now = new Date();

  // Find all active subscriptions where nextBillingDate <= now
  const dueSubscriptions = await Subscription.find({
    status: 'Active',
    nextBillingDate: { $lte: now },
  }).populate('plan');

  const results = {
    generated: 0,
    skipped: 0,
    autoClosed: 0,
    invoices: [],
  };

  for (const sub of dueSubscriptions) {
    // Check autoCloseOnEnd option
    if (
      sub.plan?.options?.autoCloseOnEnd &&
      sub.expiryDate &&
      new Date(sub.expiryDate) <= now
    ) {
      sub.status = 'Closed';
      sub.statusHistory.push({
        fromStatus: 'Active',
        toStatus: 'Closed',
        note: 'Auto-closed on reaching end date by recurring billing engine',
        changedAt: now,
      });
      await sub.save();
      results.autoClosed += 1;
      continue;
    }

    try {
      const { invoice, isDuplicate } = await generateInvoiceForSubscription(sub._id);
      if (isDuplicate) {
        results.skipped += 1;
      } else {
        results.generated += 1;
        results.invoices.push(invoice);
      }
    } catch (err) {
      console.error(`[Billing Engine]: Error billing subscription ${sub.subscriptionNumber}:`, err);
    }
  }

  return results;
};
