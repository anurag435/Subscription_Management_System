import { Router } from 'express';
import {
  getStaffMembers,
  createStaffMember,
  updateStaffMember,
  deleteStaffMember,
} from '../controllers/staffController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';
import { validate, signupSchema } from '../middleware/validate.js';

const router = Router();

// All staff management routes are Admin only
router.use(authenticate, authorize('admin'));

router.get('/', getStaffMembers);
router.post('/', validate(signupSchema), createStaffMember);
router.put('/:id', updateStaffMember);
router.delete('/:id', deleteStaffMember);

export default router;
