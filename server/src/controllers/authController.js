import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Plan } from '../models/Plan.js';
import { Product } from '../models/Product.js';
import { Tax } from '../models/Tax.js';
import { Subscription } from '../models/Subscription.js';
import { generateSubscriptionNumber } from '../utils/numberGenerators.js';
import { generateInvoiceForSubscription } from '../services/billingService.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ENV } from '../config/env.js';
import { sendPasswordResetEmail } from '../services/emailService.js';

// Helper to generate JWT token and cookie options
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = jwt.sign({ id: user._id, role: user.role }, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN,
  });

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: ENV.NODE_ENV === 'production',
    sameSite: ENV.NODE_ENV === 'production' ? 'none' : 'lax',
  };

  const userSafe = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    company: user.company,
    address: user.address,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      message,
      data: {
        token,
        user: userSafe,
      },
    });
};

/**
 * @desc   Register a new customer account
 * @route  POST /api/v1/auth/signup
 * @access Public
 */
export const signup = asyncHandler(async (req, res, next) => {
  const { name, email, password, company, phone } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return next(new ApiError(400, 'An account with this email address already exists.'));
  }

  // Hash password
  const passwordHash = await User.hashPassword(password);

  // Always create as 'customer' role for public signups
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: 'customer',
    company: company || '',
    phone: phone || '',
  });

  // Provision initial onboarding trial subscription & invoice so portal has live data
  try {
    const defaultPlan = await Plan.findOne({ status: 'active' });
    const defaultProduct = await Product.findOne();
    const defaultTax = await Tax.findOne({ isActive: true });
    if (defaultPlan && defaultProduct) {
      const subNum = await generateSubscriptionNumber();
      const variant = defaultProduct.variants?.[0] || { attribute: 'Standard', value: 'Default', extraPrice: 0 };
      const unitPrice = defaultProduct.salesPrice + (variant.extraPrice || 0);
      const now = new Date();
      const expiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const sub = await Subscription.create({
        subscriptionNumber: subNum,
        customer: user._id,
        plan: defaultPlan._id,
        startDate: now,
        expiryDate: expiry,
        paymentTerms: 'immediate',
        lines: [
          {
            product: defaultProduct._id,
            variant,
            quantity: 1,
            unitPrice,
            taxes: defaultTax ? [defaultTax._id] : [],
            amount: unitPrice,
          },
        ],
        recurringSubtotal: defaultPlan.price + unitPrice,
        status: 'Active',
        nextBillingDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        statusHistory: [
          {
            fromStatus: 'None',
            toStatus: 'Active',
            changedBy: user._id,
            note: 'Onboarding Welcome Subscription',
            changedAt: now,
          },
        ],
      });

      await generateInvoiceForSubscription(sub);
    }
  } catch (seedErr) {
    console.warn('[Onboarding Notice]: Initial starter subscription skipped:', seedErr.message);
  }

  sendTokenResponse(user, 201, res, 'Account created successfully');
});

/**
 * @desc   Login user
 * @route  POST /api/v1/auth/login
 * @access Public
 */
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  if (!user) {
    return next(new ApiError(401, 'Invalid email or password.'));
  }

  if (!user.isActive) {
    return next(new ApiError(403, 'Your account has been deactivated. Please contact support.'));
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return next(new ApiError(401, 'Invalid email or password.'));
  }

  sendTokenResponse(user, 200, res, 'Logged in successfully');
});

/**
 * @desc   Get current logged-in user profile
 * @route  GET /api/v1/auth/me
 * @access Private
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    data: user,
    message: 'User profile retrieved',
  });
});

/**
 * @desc   Logout user and clear cookie
 * @route  POST /api/v1/auth/logout
 * @access Private
 */
export const logout = asyncHandler(async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    data: null,
    message: 'Logged out successfully',
  });
});

/**
 * @desc   Forgot password - generates token and sends email
 * @route  POST /api/v1/auth/forgot-password
 * @access Public
 */
export const forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // For security reasons, don't disclose whether email exists
    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
      data: null,
    });
  }

  // Get reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Reset URL pointing to client
  const resetUrl = `${ENV.CLIENT_URL}/reset-password/${resetToken}`;

  try {
    await sendPasswordResetEmail({
      to: user.email,
      resetUrl,
    });

    res.status(200).json({
      success: true,
      message: 'Password reset link sent to your email.',
      data: {
        // Expose token in dev mode for easy testing in Postman/Curl
        ...(ENV.NODE_ENV === 'development' ? { resetToken, resetUrl } : {}),
      },
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ApiError(500, `Email could not be sent: ${error.message}`));
  }
});

/**
 * @desc   Reset password using token
 * @route  POST /api/v1/auth/reset-password/:token
 * @access Public
 */
export const resetPassword = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ApiError(400, 'Password reset token is invalid or has expired.'));
  }

  user.passwordHash = await User.hashPassword(password);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  sendTokenResponse(user, 200, res, 'Password reset successful. You are now logged in.');
});
