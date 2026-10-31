import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema({
  attribute: {
    type: String,
    required: true,
    trim: true,
  },
  value: {
    type: String,
    required: true,
    trim: true,
  },
  extraPrice: {
    type: Number,
    default: 0,
    min: 0,
  },
});

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['service', 'goods', 'digital'],
      default: 'service',
    },
    salesPrice: {
      type: Number,
      required: [true, 'Sales price is required'],
      min: [0, 'Sales price cannot be negative'],
    },
    costPrice: {
      type: Number,
      default: 0,
      min: [0, 'Cost price cannot be negative'],
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    variants: [variantSchema],
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

productSchema.index({ name: 'text', notes: 'text' });

export const Product = mongoose.model('Product', productSchema);
