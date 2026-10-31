import { Payment } from '../models/Payment.js';
import { Invoice } from '../models/Invoice.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * @desc   Get list of payments
 * @route  GET /api/v1/payments
 * @access Private
 */
export const getPayments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, method, invoice, search = '', sort = '-paymentDate' } =
    req.query;

  const query = {};

  if (method) {
    query.method = method;
  }

  if (invoice) {
    query.invoice = invoice;
  }

  if (search) {
    query.paymentNumber = { $regex: search, $options: 'i' };
  }

  // If customer role, scope payments to customer's invoices only
  if (req.user.role === 'customer') {
    const customerInvoices = await Invoice.find({ customer: req.user._id }).select('_id');
    const invoiceIds = customerInvoices.map((i) => i._id);
    query.invoice = { $in: invoiceIds };
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const [payments, total] = await Promise.all([
    Payment.find(query)
      .populate({
        path: 'invoice',
        select: 'invoiceNumber total balanceDue customer status',
        populate: { path: 'customer', select: 'name email company' },
      })
      .populate('recordedBy', 'name email role')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Payment.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: {
      payments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    },
    message: 'Payments retrieved',
  });
});

/**
 * @desc   Record payment against an invoice (partial or full)
 * @route  POST /api/v1/payments
 * @access Admin & Staff
 */
export const recordPayment = asyncHandler(async (req, res, next) => {
  const { invoiceId, method, amount, paymentDate, note } = req.body;

  if (!invoiceId) {
    return next(new ApiError(400, 'Invoice ID is required'));
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return next(new ApiError(400, 'Payment amount must be greater than zero'));
  }

  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    return next(new ApiError(404, 'Invoice not found'));
  }

  if (invoice.status === 'Cancelled') {
    return next(new ApiError(400, 'Cannot apply payment to a cancelled invoice'));
  }

  if (invoice.status === 'Paid' || invoice.balanceDue <= 0) {
    return next(new ApiError(400, 'Invoice is already settled in full'));
  }

  // Reject overpayment
  if (parsedAmount > Number(invoice.balanceDue.toFixed(2))) {
    return next(
      new ApiError(
        400,
        `Payment amount ($${parsedAmount.toFixed(
          2
        )}) cannot exceed remaining balance due of $${invoice.balanceDue.toFixed(2)}`
      )
    );
  }

  // Update invoice balance and status
  const newAmountPaid = Number((invoice.amountPaid + parsedAmount).toFixed(2));
  let newBalanceDue = Number((invoice.total - newAmountPaid).toFixed(2));

  if (newBalanceDue <= 0.005) {
    newBalanceDue = 0;
    invoice.status = 'Paid';
  } else if (invoice.status === 'Draft') {
    invoice.status = 'Confirmed';
  }

  invoice.amountPaid = newAmountPaid;
  invoice.balanceDue = newBalanceDue;
  await invoice.save();

  // Create payment record
  const payment = await Payment.create({
    invoice: invoice._id,
    method,
    amount: parsedAmount,
    paymentDate: paymentDate || new Date(),
    note: note || '',
    recordedBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    data: {
      payment,
      updatedInvoice: {
        _id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        amountPaid: invoice.amountPaid,
        balanceDue: invoice.balanceDue,
      },
    },
    message: `Payment of $${parsedAmount.toFixed(2)} recorded. Remaining balance: $${invoice.balanceDue.toFixed(2)}`,
  });
});
