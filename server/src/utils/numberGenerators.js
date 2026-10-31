import mongoose from 'mongoose';

// Simple counter schema for sequential human-readable numbers
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

/**
 * Generates sequential formatted code, e.g. SUB-000123
 * @param {string} prefix - e.g. 'SUB', 'INV', 'PAY'
 * @param {number} padLength - number of digits to pad (default: 6)
 */
export async function getNextSequenceValue(prefix, padLength = 6) {
  try {
    const counter = await Counter.findByIdAndUpdate(
      prefix,
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    return `${prefix}-${String(counter.seq).padStart(padLength, '0')}`;
  } catch {
    // High-entropy fallback if counter collection is locked or in fast batch insert
    const randomHex = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}-${randomHex}`;
  }
}
