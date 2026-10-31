import { Router } from 'express';
import {
  getInvoices,
  getInvoiceById,
  generateSingleInvoice,
  bulkGenerateDueInvoices,
  confirmInvoice,
  cancelInvoice,
  sendInvoice,
} from '../controllers/invoiceController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';

const router = Router();

router.use(authenticate);

// View list and detail (scoped by role in controller)
router.get('/', getInvoices);
router.get('/:id', getInvoiceById);

// Admin & Staff operations
router.post('/generate/:subscriptionId', authorize('admin', 'staff'), generateSingleInvoice);
router.post('/generate-due', authorize('admin', 'staff'), bulkGenerateDueInvoices);
router.patch('/:id/confirm', authorize('admin', 'staff'), confirmInvoice);
router.patch('/:id/cancel', authorize('admin', 'staff'), cancelInvoice);
router.post('/:id/send', authorize('admin', 'staff'), sendInvoice);

export default router;
