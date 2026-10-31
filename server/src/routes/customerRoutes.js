import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
} from '../controllers/customerController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = Router();

router.use(authenticate);

// List all customers - Admin & Staff only
router.get('/', authorize('admin', 'staff'), getCustomers);

// Single customer lookup - Admin, Staff, or Customer looking up self
router.get('/:id', getCustomerById);

// Create customer - Admin & Staff
router.post('/', authorize('admin', 'staff'), createCustomer);

// Update customer - Admin, Staff, or Customer looking up self
router.put('/:id', updateCustomer);

export default router;
