import { Tax } from '../models/Tax.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getTaxes = asyncHandler(async (req, res) => {
  const { activeOnly = 'true' } = req.query;
  const query = {};
  if (activeOnly === 'true') {
    query.isActive = true;
  }

  const taxes = await Tax.find(query).sort({ rate: 1 }).lean();

  res.status(200).json({
    success: true,
    data: taxes,
    message: 'Taxes retrieved',
  });
});

export const getTaxById = asyncHandler(async (req, res, next) => {
  const tax = await Tax.findById(req.params.id).lean();
  if (!tax) {
    return next(new ApiError(404, 'Tax rule not found'));
  }

  res.status(200).json({
    success: true,
    data: tax,
    message: 'Tax rule retrieved',
  });
});

export const createTax = asyncHandler(async (req, res) => {
  const { name, rate, appliesTo } = req.body;

  const tax = await Tax.create({
    name,
    rate,
    appliesTo: appliesTo || 'all',
  });

  res.status(201).json({
    success: true,
    data: tax,
    message: 'Tax rule created successfully',
  });
});

export const updateTax = asyncHandler(async (req, res, next) => {
  const { name, rate, appliesTo, isActive } = req.body;

  const tax = await Tax.findById(req.params.id);
  if (!tax) {
    return next(new ApiError(404, 'Tax rule not found'));
  }

  if (name !== undefined) tax.name = name;
  if (rate !== undefined) tax.rate = rate;
  if (appliesTo !== undefined) tax.appliesTo = appliesTo;
  if (isActive !== undefined) tax.isActive = isActive;

  await tax.save();

  res.status(200).json({
    success: true,
    data: tax,
    message: 'Tax rule updated successfully',
  });
});

export const deleteTax = asyncHandler(async (req, res, next) => {
  const tax = await Tax.findById(req.params.id);
  if (!tax) {
    return next(new ApiError(404, 'Tax rule not found'));
  }

  tax.isActive = false;
  await tax.save();

  res.status(200).json({
    success: true,
    data: null,
    message: 'Tax rule deactivated successfully',
  });
});
