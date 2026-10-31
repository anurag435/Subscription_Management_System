import mongoose from 'mongoose';

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
      index: true,
    },
    price: {
      type: Number,
      required: [true, 'Plan recurring price is required'],
      min: [0, 'Price cannot be negative'],
    },
    billingPeriod: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      required: [true, 'Billing period is required'],
      index: true,
    },
    minQuantity: {
      type: Number,
      default: 1,
      min: [1, 'Minimum quantity must be at least 1'],
    },
    availableFrom: {
      type: Date,
      default: Date.now,
    },
    availableTo: {
      type: Date,
    },
    options: {
      autoCloseOnEnd: {
        type: Boolean,
        default: false,
      },
      allowEarlyClose: {
        type: Boolean,
        default: true,
      },
      allowPause: {
        type: Boolean,
        default: true,
      },
      allowRenew: {
        type: Boolean,
        default: true,
      },
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Plan = mongoose.model('Plan', planSchema);
