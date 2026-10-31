import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * @desc   Get all staff members
 * @route  GET /api/v1/staff
 * @access Admin only
 */
export const getStaffMembers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search = '' } = req.query;
  const query = { role: 'staff' };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const [staff, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
    User.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    data: {
      staff,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    },
    message: 'Staff list retrieved',
  });
});

/**
 * @desc   Create internal staff account
 * @route  POST /api/v1/staff
 * @access Admin only
 */
export const createStaffMember = asyncHandler(async (req, res, next) => {
  const { name, email, password, phone } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return next(new ApiError(400, 'An account with this email already exists.'));
  }

  const passwordHash = await User.hashPassword(password);

  const staff = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: 'staff',
    phone: phone || '',
  });

  res.status(201).json({
    success: true,
    data: {
      _id: staff._id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      phone: staff.phone,
      isActive: staff.isActive,
      createdAt: staff.createdAt,
    },
    message: 'Staff account created successfully',
  });
});

/**
 * @desc   Update staff status / details
 * @route  PUT /api/v1/staff/:id
 * @access Admin only
 */
export const updateStaffMember = asyncHandler(async (req, res, next) => {
  const { name, phone, isActive } = req.body;

  const staff = await User.findOne({ _id: req.params.id, role: 'staff' });
  if (!staff) {
    return next(new ApiError(404, 'Staff member not found'));
  }

  if (name !== undefined) staff.name = name;
  if (phone !== undefined) staff.phone = phone;
  if (isActive !== undefined) staff.isActive = isActive;

  await staff.save();

  res.status(200).json({
    success: true,
    data: staff,
    message: 'Staff account updated',
  });
});

/**
 * @desc   Delete/deactivate staff account
 * @route  DELETE /api/v1/staff/:id
 * @access Admin only
 */
export const deleteStaffMember = asyncHandler(async (req, res, next) => {
  const staff = await User.findOne({ _id: req.params.id, role: 'staff' });
  if (!staff) {
    return next(new ApiError(404, 'Staff member not found'));
  }

  staff.isActive = false;
  await staff.save();

  res.status(200).json({
    success: true,
    data: null,
    message: 'Staff account deactivated successfully',
  });
});
