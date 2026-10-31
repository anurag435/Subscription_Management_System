import { Router } from 'express';
import {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  archivePlan,
} from '../controllers/planController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = Router();

router.use(authenticate);

// List/view plans
router.get('/', getPlans);
router.get('/:id', getPlanById);

// Admin-only management
router.post('/', authorize('admin'), createPlan);
router.put('/:id', authorize('admin'), updatePlan);
router.delete('/:id', authorize('admin'), archivePlan);

export default router;
