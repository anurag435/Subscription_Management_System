import { Plan } from '../models/Plan.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getPlans = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, billingPeriod, status = 'active' } = req.query;
  const query = {};

  if (status) {
    query.status = status;
  }

  if (billingPeriod) {
    query.billingPeriod = billingPeriod;
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const [plans, total] = await Promise.all([
    Plan.find(query).sort({ price: 1 }).skip(skip).limit(limitNum).lean(),
    Plan.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: {
      plans,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    },
    message: 'Plans retrieved',
  });
});

export const getPlanById = asyncHandler(async (req, res, next) => {
  const plan = await Plan.findById(req.params.id).lean();
  if (!plan) {
    return next(new ApiError(404, 'Plan not found'));
  }

  res.status(200).json({
    success: true,
    data: plan,
    message: 'Plan retrieved',
  });
});

export const createPlan = asyncHandler(async (req, res) => {
  const {
    name,
    price,
    billingPeriod,
    minQuantity,
    availableFrom,
    availableTo,
    options,
  } = req.body;

  const plan = await Plan.create({
    name,
    price,
    billingPeriod,
    minQuantity: minQuantity || 1,
    availableFrom: availableFrom || Date.now(),
    availableTo,
    options: options || {},
  });

  res.status(201).json({
    success: true,
    data: plan,
    message: 'Plan created successfully',
  });
});

export const updatePlan = asyncHandler(async (req, res, next) => {
  const plan = await Plan.findById(req.params.id);
  if (!plan) {
    return next(new ApiError(404, 'Plan not found'));
  }

  const allowedFields = [
    'name',
    'price',
    'billingPeriod',
    'minQuantity',
    'availableFrom',
    'availableTo',
    'options',
    'status',
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      plan[field] = req.body[field];
    }
  });

  await plan.save();

  res.status(200).json({
    success: true,
    data: plan,
    message: 'Plan updated successfully',
  });
});

export const archivePlan = asyncHandler(async (req, res, next) => {
  const plan = await Plan.findById(req.params.id);
  if (!plan) {
    return next(new ApiError(404, 'Plan not found'));
  }

  plan.status = 'archived';
  await plan.save();

  res.status(200).json({
    success: true,
    data: null,
    message: 'Plan archived successfully',
  });
});
