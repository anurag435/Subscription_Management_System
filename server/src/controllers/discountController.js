import { Discount } from '../models/Discount.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getDiscounts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, activeOnly = 'true' } = req.query;
  const query = {};

  if (activeOnly === 'true') {
    query.isActive = true;
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const [discounts, total] = await Promise.all([
    Discount.find(query)
      .populate('productIds', 'name salesPrice')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Discount.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: {
      discounts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    },
    message: 'Discounts retrieved',
  });
});

export const getDiscountById = asyncHandler(async (req, res, next) => {
  const discount = await Discount.findById(req.params.id)
    .populate('productIds', 'name salesPrice')
    .lean();

  if (!discount) {
    return next(new ApiError(404, 'Discount rule not found'));
  }

  res.status(200).json({
    success: true,
    data: discount,
    message: 'Discount rule retrieved',
  });
});

export const createDiscount = asyncHandler(async (req, res) => {
  const {
    name,
    type,
    value,
    minPurchase,
    minQuantity,
    startDate,
    endDate,
    usageLimit,
    appliesTo,
    productIds,
  } = req.body;

  const discount = await Discount.create({
    name,
    type,
    value,
    minPurchase: minPurchase || 0,
    minQuantity: minQuantity || 0,
    startDate: startDate || Date.now(),
    endDate,
    usageLimit: usageLimit || null,
    appliesTo: appliesTo || 'whole_subscription',
    productIds: productIds || [],
  });

  res.status(201).json({
    success: true,
    data: discount,
    message: 'Discount rule created successfully',
  });
});

export const updateDiscount = asyncHandler(async (req, res, next) => {
  const discount = await Discount.findById(req.params.id);
  if (!discount) {
    return next(new ApiError(404, 'Discount rule not found'));
  }

  const fields = [
    'name',
    'type',
    'value',
    'minPurchase',
    'minQuantity',
    'startDate',
    'endDate',
    'usageLimit',
    'appliesTo',
    'productIds',
    'isActive',
  ];

  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      discount[field] = req.body[field];
    }
  });

  await discount.save();

  res.status(200).json({
    success: true,
    data: discount,
    message: 'Discount rule updated successfully',
  });
});

export const deleteDiscount = asyncHandler(async (req, res, next) => {
  const discount = await Discount.findById(req.params.id);
  if (!discount) {
    return next(new ApiError(404, 'Discount rule not found'));
  }

  discount.isActive = false;
  await discount.save();

  res.status(200).json({
    success: true,
    data: null,
    message: 'Discount rule deactivated successfully',
  });
});
