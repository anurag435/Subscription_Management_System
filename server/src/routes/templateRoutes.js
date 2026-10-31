import { Router } from 'express';
import {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from '../controllers/templateController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = Router();

router.use(authenticate);

// Templates are managed by Admin and Staff
router.get('/', authorize('admin', 'staff'), getTemplates);
router.get('/:id', authorize('admin', 'staff'), getTemplateById);
router.post('/', authorize('admin', 'staff'), createTemplate);
router.put('/:id', authorize('admin', 'staff'), updateTemplate);
router.delete('/:id', authorize('admin'), deleteTemplate);

export default router;
