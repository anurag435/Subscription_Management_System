import { Router } from 'express';
import {
  getSubscriptions,
  getSubscriptionById,
  createSubscription,
  updateSubscription,
  transitionSubscription,
  renewSubscription,
} from '../controllers/subscriptionController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getSubscriptions);
router.get('/:id', getSubscriptionById);
router.post('/', createSubscription);
router.put('/:id', updateSubscription);
router.patch('/:id/transition', transitionSubscription);
router.post('/:id/renew', renewSubscription);

export default router;
