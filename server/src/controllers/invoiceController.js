import { Invoice } from '../models/Invoice.js';
import { Subscription } from '../models/Subscription.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  generateInvoiceForSubscription,
  generateDueInvoices,
} from '../services/billingService.js';
import { sendInvoiceEmail } from '../services/emailService.js';

/**
 * @desc   Get list of invoices (scoped to customer if customer role)
 * @route  GET /api/v1/invoices
 * @access Private
 */
export const getInvoices = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    customer,
    subscription,
    search = '',
    sort = '-createdAt',
  } = req.query;

  const query = {};

  if (req.user.role === 'customer') {
    query.customer = req.user._id;
  } else if (customer) {
    query.customer = customer;
  }

  if (subscription) {
    query.subscription = subscription;
  }

  if (status) {
    query.status = status;
  }

  if (search) {
    query.invoiceNumber = { $regex: search, $options: 'i' };
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const [invoices, total] = await Promise.all([
    Invoice.find(query)
      .populate('customer', 'name email company')
      .populate('subscription', 'subscriptionNumber')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Invoice.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: {
      invoices,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    },
    message: 'Invoices retrieved',
  });
});

/**
 * @desc   Get single invoice details
 * @route  GET /api/v1/invoices/:id
 * @access Private
 */
export const getInvoiceById = asyncHandler(async (req, res, next) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate('customer', 'name email company phone address')
    .populate({
      path: 'subscription',
      select: 'subscriptionNumber plan paymentTerms',
      populate: { path: 'plan', select: 'name billingPeriod' },
    })
    .lean();

  if (!invoice) {
    return next(new ApiError(404, 'Invoice not found'));
  }

  // Scoped check for customer
  if (
    req.user.role === 'customer' &&
    invoice.customer._id.toString() !== req.user._id.toString()
  ) {
    return next(new ApiError(403, 'Access denied to this invoice'));
  }

  res.status(200).json({
    success: true,
    data: invoice,
    message: 'Invoice details retrieved',
  });
});

/**
 * @desc   Generate invoice manually for a subscription
 * @route  POST /api/v1/invoices/generate/:subscriptionId
 * @access Admin & Staff
 */
export const generateSingleInvoice = asyncHandler(async (req, res, next) => {
  const { subscriptionId } = req.params;
  const { periodStart, periodEnd } = req.body;

  const result = await generateInvoiceForSubscription(
    subscriptionId,
    periodStart,
    periodEnd
  );

  res.status(result.isDuplicate ? 200 : 201).json({
    success: true,
    data: result.invoice,
    message: result.isDuplicate
      ? 'An invoice already exists for this billing cycle (idempotent billing)'
      : 'Invoice generated successfully',
  });
});

/**
 * @desc   Bulk generate invoices for all subscriptions due today
 * @route  POST /api/v1/invoices/generate-due
 * @access Admin & Staff
 */
export const bulkGenerateDueInvoices = asyncHandler(async (req, res) => {
  const summary = await generateDueInvoices();

  res.status(200).json({
    success: true,
    data: summary,
    message: `Invoicing completed: ${summary.generated} generated, ${summary.skipped} skipped, ${summary.autoClosed} auto-closed`,
  });
});

/**
 * @desc   Confirm draft invoice
 * @route  PATCH /api/v1/invoices/:id/confirm
 * @access Admin & Staff
 */
export const confirmInvoice = asyncHandler(async (req, res, next) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) {
    return next(new ApiError(404, 'Invoice not found'));
  }

  if (invoice.status !== 'Draft') {
    return next(
      new ApiError(400, `Cannot confirm an invoice in '${invoice.status}' status`)
    );
  }

  invoice.status = 'Confirmed';
  await invoice.save();

  res.status(200).json({
    success: true,
    data: invoice,
    message: 'Invoice confirmed successfully',
  });
});

/**
 * @desc   Cancel an invoice
 * @route  PATCH /api/v1/invoices/:id/cancel
 * @access Admin & Staff
 */
export const cancelInvoice = asyncHandler(async (req, res, next) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) {
    return next(new ApiError(404, 'Invoice not found'));
  }

  if (invoice.status === 'Paid') {
    return next(new ApiError(400, 'Cannot cancel a fully settled/paid invoice'));
  }

  invoice.status = 'Cancelled';
  await invoice.save();

  res.status(200).json({
    success: true,
    data: invoice,
    message: 'Invoice cancelled successfully',
  });
});

/**
 * @desc   Send invoice to customer via email
 * @route  POST /api/v1/invoices/:id/send
 * @access Admin & Staff
 */
export const sendInvoice = asyncHandler(async (req, res, next) => {
  const invoice = await Invoice.findById(req.params.id).populate('customer');
  if (!invoice) {
    return next(new ApiError(404, 'Invoice not found'));
  }

  if (!invoice.customer?.email) {
    return next(new ApiError(400, 'Customer has no email address configured'));
  }

  await sendInvoiceEmail({
    to: invoice.customer.email,
    invoiceNumber: invoice.invoiceNumber,
    total: invoice.total,
    dueDate: invoice.dueDate,
  });

  invoice.sentAt = new Date();
  if (invoice.status === 'Draft') {
    invoice.status = 'Confirmed';
  }
  await invoice.save();

  res.status(200).json({
    success: true,
    data: invoice,
    message: `Invoice ${invoice.invoiceNumber} emailed to ${invoice.customer.email}`,
  });
});
