import { ApiError } from '../utils/ApiError.js';

/**
 * Restrict route to specific roles
 * @param  {...string} roles - e.g. 'admin', 'staff', 'customer'
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Forbidden: Role '${req.user.role}' is not authorized to access this resource`
        )
      );
    }

    next();
  };
};

/**
 * Helper to ensure a customer only accesses their own resources
 */
export const scopeToCustomer = (req, res, next) => {
  if (req.user && req.user.role === 'customer') {
    // Inject customer filter into query or body
    req.customerScopeId = req.user._id;
  }
  next();
};
