import { QuotationTemplate } from '../models/QuotationTemplate.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getTemplates = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search = '' } = req.query;
  const query = {};

  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const [templates, total] = await Promise.all([
    QuotationTemplate.find(query)
      .populate('plan', 'name price billingPeriod')
      .populate('lines.product', 'name salesPrice')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    QuotationTemplate.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: {
      templates,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    },
    message: 'Templates retrieved',
  });
});

export const getTemplateById = asyncHandler(async (req, res, next) => {
  const template = await QuotationTemplate.findById(req.params.id)
    .populate('plan')
    .populate('lines.product')
    .lean();

  if (!template) {
    return next(new ApiError(404, 'Template not found'));
  }

  res.status(200).json({
    success: true,
    data: template,
    message: 'Template retrieved',
  });
});

export const createTemplate = asyncHandler(async (req, res) => {
  const { name, validityDays, plan, lines } = req.body;

  const template = await QuotationTemplate.create({
    name,
    validityDays: validityDays || 30,
    plan,
    lines: lines || [],
  });

  res.status(201).json({
    success: true,
    data: template,
    message: 'Quotation template created successfully',
  });
});

export const updateTemplate = asyncHandler(async (req, res, next) => {
  const template = await QuotationTemplate.findById(req.params.id);
  if (!template) {
    return next(new ApiError(404, 'Template not found'));
  }

  const { name, validityDays, plan, lines } = req.body;
  if (name !== undefined) template.name = name;
  if (validityDays !== undefined) template.validityDays = validityDays;
  if (plan !== undefined) template.plan = plan;
  if (lines !== undefined) template.lines = lines;

  await template.save();

  res.status(200).json({
    success: true,
    data: template,
    message: 'Quotation template updated successfully',
  });
});

export const deleteTemplate = asyncHandler(async (req, res, next) => {
  const template = await QuotationTemplate.findById(req.params.id);
  if (!template) {
    return next(new ApiError(404, 'Template not found'));
  }

  await template.deleteOne();

  res.status(200).json({
    success: true,
    data: null,
    message: 'Quotation template deleted successfully',
  });
});
