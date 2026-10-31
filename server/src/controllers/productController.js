import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, search = '', type, activeOnly = 'true' } = req.query;
  const query = {};

  if (activeOnly === 'true') {
    query.isActive = true;
  }

  if (type) {
    query.type = type;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { notes: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
    Product.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: {
      products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    },
    message: 'Products retrieved',
  });
});

export const getProductById = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id).lean();
  if (!product) {
    return next(new ApiError(404, 'Product not found'));
  }

  res.status(200).json({
    success: true,
    data: product,
    message: 'Product retrieved',
  });
});

export const createProduct = asyncHandler(async (req, res) => {
  const { name, type, salesPrice, costPrice, notes, variants } = req.body;

  const product = await Product.create({
    name,
    type: type || 'service',
    salesPrice,
    costPrice: costPrice || 0,
    notes: notes || '',
    variants: variants || [],
  });

  res.status(201).json({
    success: true,
    data: product,
    message: 'Product created successfully',
  });
});

export const updateProduct = asyncHandler(async (req, res, next) => {
  const { name, type, salesPrice, costPrice, notes, variants, isActive } = req.body;

  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ApiError(404, 'Product not found'));
  }

  if (name !== undefined) product.name = name;
  if (type !== undefined) product.type = type;
  if (salesPrice !== undefined) product.salesPrice = salesPrice;
  if (costPrice !== undefined) product.costPrice = costPrice;
  if (notes !== undefined) product.notes = notes;
  if (variants !== undefined) product.variants = variants;
  if (isActive !== undefined) product.isActive = isActive;

  await product.save();

  res.status(200).json({
    success: true,
    data: product,
    message: 'Product updated successfully',
  });
});

export const deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ApiError(404, 'Product not found'));
  }

  // Soft delete / archive
  product.isActive = false;
  await product.save();

  res.status(200).json({
    success: true,
    data: null,
    message: 'Product deactivated successfully',
  });
});
