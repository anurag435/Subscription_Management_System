import mongoose from 'mongoose';
import { getNextSequenceValue } from '../utils/numberGenerators.js';

const paymentSchema = new mongoose.Schema(
  {
    paymentNumber: {
      type: String,
      unique: true,
      index: true,
    },
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      required: [true, 'Invoice reference is required'],
      index: true,
    },
    method: {
      type: String,
      enum: ['cash', 'card', 'bank transfer', 'UPI', 'cheque', 'other'],
      required: [true, 'Payment method is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0.01, 'Payment amount must be greater than zero'],
    },
    paymentDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    note: {
      type: String,
      default: '',
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.pre('save', async function (next) {
  if (!this.paymentNumber) {
    this.paymentNumber = await getNextSequenceValue('PAY', 6);
  }
  next();
});

export const Payment = mongoose.model('Payment', paymentSchema);
