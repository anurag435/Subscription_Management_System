import mongoose from 'mongoose';
import { getNextSequenceValue } from '../utils/numberGenerators.js';

const subscriptionLineSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
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
  taxes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tax',
    },
  ],
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
});

const statusHistorySchema = new mongoose.Schema({
  fromStatus: {
    type: String,
    required: true,
  },
  toStatus: {
    type: String,
    required: true,
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  note: {
    type: String,
    default: '',
  },
  changedAt: {
    type: Date,
    default: Date.now,
  },
});

const subscriptionSchema = new mongoose.Schema(
  {
    subscriptionNumber: {
      type: String,
      unique: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer is required'],
      index: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      required: [true, 'Plan is required'],
      index: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      default: Date.now,
    },
    expiryDate: {
      type: Date,
    },
    paymentTerms: {
      type: String,
      enum: ['immediate', 'net15', 'net30', 'net60'],
      default: 'immediate',
    },
    lines: [subscriptionLineSchema],
    recurringSubtotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['Draft', 'Quotation', 'Confirmed', 'Active', 'Closed', 'Paused'],
      default: 'Draft',
      index: true,
    },
    nextBillingDate: {
      type: Date,
      index: true,
    },
    lastBilledAt: {
      type: Date,
    },
    statusHistory: [statusHistorySchema],
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to assign auto-incrementing subscriptionNumber
subscriptionSchema.pre('save', async function (next) {
  if (!this.subscriptionNumber) {
    this.subscriptionNumber = await getNextSequenceValue('SUB', 6);
  }
  next();
});

export const Subscription = mongoose.model('Subscription', subscriptionSchema);
