import { Router } from 'express';
import {
  getTaxes,
  getTaxById,
  createTax,
  updateTax,
  deleteTax,
} from '../controllers/taxController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = Router();

router.use(authenticate);

// List/view tax rates
router.get('/', getTaxes);
router.get('/:id', getTaxById);

// Admin only
router.post('/', authorize('admin'), createTax);
router.put('/:id', authorize('admin'), updateTax);
router.delete('/:id', authorize('admin'), deleteTax);

export default router;
