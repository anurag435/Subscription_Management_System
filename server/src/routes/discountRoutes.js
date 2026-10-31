import { Router } from 'express';
import {
  getDiscounts,
  getDiscountById,
  createDiscount,
  updateDiscount,
  deleteDiscount,
} from '../controllers/discountController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = Router();

router.use(authenticate);

// List/view discounts - Admin & Staff
router.get('/', authorize('admin', 'staff'), getDiscounts);
router.get('/:id', authorize('admin', 'staff'), getDiscountById);

// Admin only - create, update, delete discount rules
router.post('/', authorize('admin'), createDiscount);
router.put('/:id', authorize('admin'), updateDiscount);
router.delete('/:id', authorize('admin'), deleteDiscount);

export default router;
