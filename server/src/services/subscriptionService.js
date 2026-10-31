import { Subscription } from '../models/Subscription.js';
import { Plan } from '../models/Plan.js';
import { ApiError } from '../utils/ApiError.js';

// Calculate next billing date from given date and billing period
export const calculateNextBillingDate = (fromDate, billingPeriod) => {
  const d = new Date(fromDate);
  switch (billingPeriod) {
    case 'daily':
      d.setDate(d.getDate() + 1);
      break;
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'yearly':
      d.setFullYear(d.getFullYear() + 1);
      break;
    default:
      d.setMonth(d.getMonth() + 1);
  }
  return d;
};

// Calculate lines and total
export const computeSubscriptionTotals = (lines, planPrice = 0) => {
  let subtotal = 0;
  const processedLines = lines.map((line) => {
    const extra = line.variant?.extraPrice || 0;
    const effectiveUnitPrice = Number(line.unitPrice) + Number(extra);
    const amount = effectiveUnitPrice * Number(line.quantity);
    subtotal += amount;
    return {
      ...line,
      amount,
    };
  });
  subtotal += Number(planPrice);
  return { processedLines, recurringSubtotal: subtotal };
};

// Allowed status transitions map
const ALLOWED_TRANSITIONS = {
  Draft: ['Quotation', 'Confirmed', 'Closed'],
  Quotation: ['Confirmed', 'Draft', 'Closed'],
  Confirmed: ['Active', 'Closed'],
  Active: ['Paused', 'Closed'],
  Paused: ['Active', 'Closed'],
  Closed: [], // Closed subscriptions are immutable; must be renewed
};

export const transitionSubscriptionStatus = async (
  subscriptionId,
  targetStatus,
  user,
  note = ''
) => {
  const subscription = await Subscription.findById(subscriptionId).populate('plan');
  if (!subscription) {
    throw new ApiError(404, 'Subscription not found');
  }

  const currentStatus = subscription.status;

  // Validate transition rules
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(targetStatus)) {
    throw new ApiError(
      400,
      `Invalid lifecycle transition from '${currentStatus}' to '${targetStatus}'. Allowed: [${allowed.join(
        ', '
      )}]`
    );
  }

  // Check plan policy options
  const plan = subscription.plan;
  if (plan && plan.options) {
    if (targetStatus === 'Paused' && !plan.options.allowPause) {
      throw new ApiError(400, `Plan '${plan.name}' does not permit pausing`);
    }
    if (targetStatus === 'Closed' && currentStatus === 'Active' && !plan.options.allowEarlyClose) {
      // Check if past expiryDate
      if (subscription.expiryDate && new Date() < new Date(subscription.expiryDate)) {
        throw new ApiError(
          400,
          `Plan '${plan.name}' does not allow early closure before expiry date`
        );
      }
    }
  }

  // When activating, set nextBillingDate if not already set
  if (targetStatus === 'Active' && !subscription.nextBillingDate) {
    subscription.nextBillingDate = calculateNextBillingDate(
      subscription.startDate || new Date(),
      plan?.billingPeriod || 'monthly'
    );
  }

  // Append history entry
  subscription.statusHistory.push({
    fromStatus: currentStatus,
    toStatus: targetStatus,
    changedBy: user?._id,
    note: note || `Status transitioned from ${currentStatus} to ${targetStatus}`,
    changedAt: new Date(),
  });

  subscription.status = targetStatus;
  await subscription.save();

  return subscription;
};
