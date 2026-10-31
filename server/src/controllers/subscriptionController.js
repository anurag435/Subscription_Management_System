import { Subscription } from '../models/Subscription.js';
import { Plan } from '../models/Plan.js';
import { Product } from '../models/Product.js';
import { QuotationTemplate } from '../models/QuotationTemplate.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  computeSubscriptionTotals,
  calculateNextBillingDate,
  transitionSubscriptionStatus,
} from '../services/subscriptionService.js';

/**
 * @desc   Get list of subscriptions (scoped to customer if customer role)
 * @route  GET /api/v1/subscriptions
 * @access Private
 */
export const getSubscriptions = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    customer,
    plan,
    search = '',
    sort = '-createdAt',
  } = req.query;

  const query = {};

  // Scope to customer if logged-in user is customer
  if (req.user.role === 'customer') {
    query.customer = req.user._id;
  } else if (customer) {
    query.customer = customer;
  }

  if (status) {
    query.status = status;
  }

  if (plan) {
    query.plan = plan;
  }

  if (search) {
    query.subscriptionNumber = { $regex: search, $options: 'i' };
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const [subscriptions, total] = await Promise.all([
    Subscription.find(query)
      .populate('customer', 'name email company')
      .populate('plan', 'name price billingPeriod')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Subscription.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: {
      subscriptions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    },
    message: 'Subscriptions retrieved',
  });
});

/**
 * @desc   Get single subscription details
 * @route  GET /api/v1/subscriptions/:id
 * @access Private
 */
export const getSubscriptionById = asyncHandler(async (req, res, next) => {
  const subscription = await Subscription.findById(req.params.id)
    .populate('customer', 'name email company phone address')
    .populate('plan')
    .populate('lines.product', 'name salesPrice type')
    .populate('lines.taxes', 'name rate')
    .populate('statusHistory.changedBy', 'name email role')
    .lean();

  if (!subscription) {
    return next(new ApiError(404, 'Subscription not found'));
  }

  // Scoped check for customer
  if (
    req.user.role === 'customer' &&
    subscription.customer._id.toString() !== req.user._id.toString()
  ) {
    return next(new ApiError(403, 'Access denied to this subscription'));
  }

  res.status(200).json({
    success: true,
    data: subscription,
    message: 'Subscription retrieved',
  });
});

/**
 * @desc   Create subscription (or from QuotationTemplate)
 * @route  POST /api/v1/subscriptions
 * @access Admin & Staff (or Customer self-service)
 */
export const createSubscription = asyncHandler(async (req, res, next) => {
  let {
    customerId,
    planId,
    templateId,
    startDate,
    expiryDate,
    paymentTerms,
    lines,
    status = 'Draft',
  } = req.body;

  // If customer is creating, force customerId to self
  if (req.user.role === 'customer') {
    customerId = req.user._id;
  }

  if (!customerId) {
    return next(new ApiError(400, 'Customer identifier is required'));
  }

  // If templateId provided, load template values
  if (templateId) {
    const template = await QuotationTemplate.findById(templateId).populate(
      'lines.product'
    );
    if (!template) {
      return next(new ApiError(404, 'Quotation template not found'));
    }
    planId = template.plan;

    // Set expiryDate based on validityDays if not provided
    if (!expiryDate) {
      const exp = new Date(startDate || Date.now());
      exp.setDate(exp.getDate() + (template.validityDays || 30));
      expiryDate = exp;
    }

    // Populate lines from template
    if (!lines || lines.length === 0) {
      lines = template.lines.map((tLine) => ({
        product: tLine.product._id,
        variant: tLine.variant || {},
        quantity: tLine.quantity,
        unitPrice: tLine.product.salesPrice,
        taxes: [],
      }));
    }
    // Set status to Quotation if created from template and not specified
    if (!req.body.status) {
      status = 'Quotation';
    }
  }

  const plan = await Plan.findById(planId);
  if (!plan) {
    return next(new ApiError(404, 'Plan not found'));
  }

  if (plan.status !== 'active') {
    return next(new ApiError(400, 'Selected plan is archived or inactive'));
  }

  // Enforce plan minQuantity
  const totalQuantity = (lines || []).reduce(
    (sum, line) => sum + (Number(line.quantity) || 1),
    0
  );
  if (totalQuantity < (plan.minQuantity || 1)) {
    return next(
      new ApiError(
        400,
        `Selected plan requires a minimum order quantity of ${plan.minQuantity} unit(s)`
      )
    );
  }

  // Compute line subtotals
  const { processedLines, recurringSubtotal } = computeSubscriptionTotals(
    lines || [],
    plan.price
  );

  const start = startDate ? new Date(startDate) : new Date();
  const nextBilling =
    status === 'Active'
      ? calculateNextBillingDate(start, plan.billingPeriod)
      : null;

  const initialHistory = [
    {
      fromStatus: 'None',
      toStatus: status,
      changedBy: req.user._id,
      note: templateId
        ? `Created from Quotation Template`
        : `Initial creation with status ${status}`,
      changedAt: new Date(),
    },
  ];

  const subscription = await Subscription.create({
    customer: customerId,
    plan: planId,
    startDate: start,
    expiryDate,
    paymentTerms: paymentTerms || 'immediate',
    lines: processedLines,
    recurringSubtotal,
    status,
    nextBillingDate: nextBilling,
    statusHistory: initialHistory,
  });

  res.status(201).json({
    success: true,
    data: subscription,
    message: 'Subscription created successfully',
  });
});

/**
 * @desc   Update draft subscription
 * @route  PUT /api/v1/subscriptions/:id
 * @access Admin & Staff
 */
export const updateSubscription = asyncHandler(async (req, res, next) => {
  const subscription = await Subscription.findById(req.params.id);
  if (!subscription) {
    return next(new ApiError(404, 'Subscription not found'));
  }

  if (!['Draft', 'Quotation'].includes(subscription.status)) {
    return next(
      new ApiError(
        400,
        `Cannot edit subscription in '${subscription.status}' status. Only Draft or Quotation can be modified directly.`
      )
    );
  }

  const { planId, paymentTerms, lines, expiryDate } = req.body;

  if (planId) {
    const plan = await Plan.findById(planId);
    if (!plan) return next(new ApiError(404, 'Plan not found'));
    subscription.plan = planId;
  }

  if (paymentTerms) subscription.paymentTerms = paymentTerms;
  if (expiryDate) subscription.expiryDate = expiryDate;

  if (lines) {
    const plan = await Plan.findById(subscription.plan);
    const { processedLines, recurringSubtotal } = computeSubscriptionTotals(
      lines,
      plan?.price || 0
    );
    subscription.lines = processedLines;
    subscription.recurringSubtotal = recurringSubtotal;
  }

  await subscription.save();

  res.status(200).json({
    success: true,
    data: subscription,
    message: 'Subscription updated successfully',
  });
});

/**
 * @desc   Transition subscription lifecycle status
 * @route  PATCH /api/v1/subscriptions/:id/transition
 * @access Admin, Staff, or Customer (for allowed actions)
 */
export const transitionSubscription = asyncHandler(async (req, res, next) => {
  const { targetStatus, note } = req.body;
  if (!targetStatus) {
    return next(new ApiError(400, 'targetStatus is required'));
  }

  // Customers can only pause or cancel their own subscriptions if allowed
  if (req.user.role === 'customer') {
    const sub = await Subscription.findById(req.params.id);
    if (!sub || sub.customer.toString() !== req.user._id.toString()) {
      return next(new ApiError(403, 'Access denied'));
    }
    const customerAllowed = ['Closed', 'Paused', 'Active'];
    if (!customerAllowed.includes(targetStatus)) {
      return next(
        new ApiError(403, 'Customers cannot transition to this status directly')
      );
    }
  }

  const updatedSubscription = await transitionSubscriptionStatus(
    req.params.id,
    targetStatus,
    req.user,
    note
  );

  res.status(200).json({
    success: true,
    data: updatedSubscription,
    message: `Subscription transitioned to ${targetStatus}`,
  });
});

/**
 * @desc   Renew a closed or expiring subscription
 * @route  POST /api/v1/subscriptions/:id/renew
 * @access Private
 */
export const renewSubscription = asyncHandler(async (req, res, next) => {
  const subscription = await Subscription.findById(req.params.id).populate('plan');
  if (!subscription) {
    return next(new ApiError(404, 'Subscription not found'));
  }

  if (
    req.user.role === 'customer' &&
    subscription.customer.toString() !== req.user._id.toString()
  ) {
    return next(new ApiError(403, 'Access denied'));
  }

  if (!subscription.plan.options?.allowRenew) {
    return next(
      new ApiError(400, `Plan '${subscription.plan.name}' does not allow renewals`)
    );
  }

  const now = new Date();
  const nextBilling = calculateNextBillingDate(now, subscription.plan.billingPeriod);

  subscription.status = 'Active';
  subscription.startDate = now;
  subscription.nextBillingDate = nextBilling;
  subscription.statusHistory.push({
    fromStatus: subscription.status,
    toStatus: 'Active',
    changedBy: req.user._id,
    note: 'Subscription renewed by user',
    changedAt: now,
  });

  await subscription.save();

  res.status(200).json({
    success: true,
    data: subscription,
    message: 'Subscription renewed successfully',
  });
});
