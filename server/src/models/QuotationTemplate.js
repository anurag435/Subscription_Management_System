import mongoose from 'mongoose';

const templateLineSchema = new mongoose.Schema({
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
    min: [1, 'Quantity must be at least 1'],
    default: 1,
  },
});

const quotationTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Template name is required'],
      trim: true,
      index: true,
    },
    validityDays: {
      type: Number,
      required: [true, 'Validity days is required (e.g. 15, 30)'],
      default: 30,
      min: 1,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      required: [true, 'Associated plan is required'],
    },
    lines: [templateLineSchema],
  },
  {
    timestamps: true,
  }
);

export const QuotationTemplate = mongoose.model(
  'QuotationTemplate',
  quotationTemplateSchema
);
