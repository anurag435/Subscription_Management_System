import { Router } from 'express';
import { getPayments, recordPayment } from '../controllers/paymentController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = Router();

router.use(authenticate);

// View list of payments (customers get their own scoped payments)
router.get('/', getPayments);

// Record payment (Admin & Staff)
router.post('/', authorize('admin', 'staff'), recordPayment);

export default router;
