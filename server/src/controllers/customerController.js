import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * @desc   Get all customers (paginated with search & sort)
 * @route  GET /api/v1/customers
 * @access Admin & Staff
 */
export const getCustomers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search = '', sort = '-createdAt' } = req.query;
  const query = { role: 'customer' };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const [customers, total] = await Promise.all([
    User.find(query).sort(sort).skip(skip).limit(limitNum).lean(),
    User.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: {
      customers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    },
    message: 'Customer list retrieved',
  });
});

/**
 * @desc   Get single customer details
 * @route  GET /api/v1/customers/:id
 * @access Admin, Staff, or Customer (scoped to self)
 */
export const getCustomerById = asyncHandler(async (req, res, next) => {
  // If customer role, ensure they can only view themselves
  if (req.user.role === 'customer' && req.user._id.toString() !== req.params.id) {
    return next(new ApiError(403, 'Access denied. You can only view your own profile.'));
  }

  const customer = await User.findOne({ _id: req.params.id, role: 'customer' }).lean();
  if (!customer) {
    return next(new ApiError(404, 'Customer not found'));
  }

  res.status(200).json({
    success: true,
    data: customer,
    message: 'Customer details retrieved',
  });
});

/**
 * @desc   Create customer account
 * @route  POST /api/v1/customers
 * @access Admin & Staff
 */
export const createCustomer = asyncHandler(async (req, res, next) => {
  const { name, email, password, company, phone, address } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return next(new ApiError(400, 'A customer with this email already exists.'));
  }

  const passwordHash = await User.hashPassword(password || 'Customer@123'); // Default password if created by staff

  const customer = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: 'customer',
    company: company || '',
    phone: phone || '',
    address: address || {},
  });

  res.status(201).json({
    success: true,
    data: customer,
    message: 'Customer created successfully',
  });
});

/**
 * @desc   Update customer profile
 * @route  PUT /api/v1/customers/:id
 * @access Admin, Staff, or Self
 */
export const updateCustomer = asyncHandler(async (req, res, next) => {
  if (req.user.role === 'customer' && req.user._id.toString() !== req.params.id) {
    return next(new ApiError(403, 'Access denied. You can only update your own profile.'));
  }

  const { name, phone, company, address, isActive } = req.body;
  const customer = await User.findOne({ _id: req.params.id, role: 'customer' });

  if (!customer) {
    return next(new ApiError(404, 'Customer not found'));
  }

  if (name !== undefined) customer.name = name;
  if (phone !== undefined) customer.phone = phone;
  if (company !== undefined) customer.company = company;
  if (address !== undefined) customer.address = address;

  // Only admin and staff can change active status
  if (isActive !== undefined && (req.user.role === 'admin' || req.user.role === 'staff')) {
    customer.isActive = isActive;
  }

  await customer.save();

  res.status(200).json({
    success: true,
    data: customer,
    message: 'Customer updated successfully',
  });
});
