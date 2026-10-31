import mongoose from 'mongoose';
import { getNextSequenceValue } from '../utils/numberGenerators.js';

const invoiceLineSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
  name: {
    type: String,
    required: true,
  },
  variant: {
    attribute: String,
    value: String,
    extraPrice: { type: Number, default: 0 },
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  lineSubtotal: {
    type: Number,
    required: true,
    min: 0,
  },
  lineTaxes: [
    {
      taxId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tax' },
      name: String,
      rate: Number,
      amount: Number,
    },
  ],
});

const discountAppliedSchema = new mongoose.Schema({
  discountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Discount',
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['fixed', 'percentage'],
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
});

const taxBreakdownSchema = new mongoose.Schema({
  taxId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tax',
  },
  name: {
    type: String,
    required: true,
  },
  rate: {
    type: Number,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
});

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
      index: true,
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      required: [true, 'Subscription reference is required'],
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer reference is required'],
      index: true,
    },
    lines: [invoiceLineSchema],
    discountsApplied: [discountAppliedSchema],
    taxBreakdown: [taxBreakdownSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discountTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    balanceDue: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
      index: true,
    },
    billingPeriodStart: {
      type: Date,
      required: true,
    },
    billingPeriodEnd: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['Draft', 'Confirmed', 'Paid', 'Cancelled', 'Overdue'],
      default: 'Draft',
      index: true,
    },
    sentAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound Unique Index to guarantee Idempotent Billing (no duplicate invoice for same cycle)
invoiceSchema.index({ subscription: 1, billingPeriodStart: 1 }, { unique: true });

// Pre-save hook to assign auto-incrementing invoiceNumber (INV-000101)
invoiceSchema.pre('save', async function (next) {
  if (!this.invoiceNumber) {
    this.invoiceNumber = await getNextSequenceValue('INV', 6);
  }
  next();
});

export const Invoice = mongoose.model('Invoice', invoiceSchema);
