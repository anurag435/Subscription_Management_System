import { Router } from 'express';
import {
  getFinanceMetrics,
  getRevenueTrend,
  getPlanDistribution,
  getOverdueInvoices,
} from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = Router();

// Reports are restricted to Admin & Staff
router.use(authenticate, authorize('admin', 'staff'));

router.get('/metrics', getFinanceMetrics);
router.get('/revenue-trend', getRevenueTrend);
router.get('/plan-distribution', getPlanDistribution);
router.get('/overdue-invoices', getOverdueInvoices);

export default router;
