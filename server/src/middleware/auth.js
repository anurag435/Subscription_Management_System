import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/User.js';
import { ENV } from '../config/env.js';

export const authenticate = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Check cookies
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // 2. Check Authorization header
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new ApiError(401, 'Authentication required. Please log in.'));
  }

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new ApiError(401, 'User belonging to this token no longer exists.'));
    }

    if (!user.isActive) {
      return next(new ApiError(403, 'Account has been deactivated. Please contact support.'));
    }

    req.user = user;
    next();
  } catch {
    return next(new ApiError(401, 'Invalid or expired authentication token.'));
  }
});
