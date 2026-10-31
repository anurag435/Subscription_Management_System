import { z } from 'zod';
import { ApiError } from '../utils/ApiError.js';

export const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{9,}$/;

export const passwordErrorMessage =
  'Password must be at least 9 characters long and contain at least one uppercase letter, one lowercase letter, and one special character.';

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().regex(passwordRegex, passwordErrorMessage),
  company: z.string().optional(),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const resetPasswordSchema = z.object({
  password: z.string().regex(passwordRegex, passwordErrorMessage),
});

export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const errorMessages = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return next(new ApiError(400, errorMessages[0].message, errorMessages));
    }
    req.body = parsed.data;
    next();
  } catch (error) {
    next(error);
  }
};
