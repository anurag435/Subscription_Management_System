import mongoose from 'mongoose';

const taxSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tax name is required (e.g. GST 18%, VAT 10%)'],
      trim: true,
      index: true,
    },
    rate: {
      type: Number,
      required: [true, 'Tax percentage rate is required'],
      min: [0, 'Tax rate cannot be negative'],
      max: [100, 'Tax rate cannot exceed 100%'],
    },
    appliesTo: {
      type: String,
      enum: ['all', 'products', 'services'],
      default: 'all',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Tax = mongoose.model('Tax', taxSchema);
