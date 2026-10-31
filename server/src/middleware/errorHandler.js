import { ApiError } from '../utils/ApiError.js';
import { ENV } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  let error = err;

  // If error is not an instance of ApiError, convert it
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, error?.errors || [], err.stack);
  }

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate value for field '${field}': '${err.keyValue[field]}' already exists.`;
    error = new ApiError(409, message);
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    const message = `Invalid format for resource identifier: '${err.value}'`;
    error = new ApiError(400, message);
  }

  // Response payload format: { success, data, message }
  const response = {
    success: false,
    data: null,
    message: error.message,
    ...(error.errors && error.errors.length > 0 ? { errors: error.errors } : {}),
    ...(ENV.NODE_ENV === 'development' ? { stack: error.stack } : {}),
  };

  res.status(error.statusCode || 500).json(response);
};
