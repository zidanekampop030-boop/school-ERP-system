import { Router } from 'express';
import {
  getStudentInvoices,
  payInvoice,
  listAllInvoices,
} from '../controllers/financeController';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware';

const router = Router();

// Protect all routes
router.use(authenticateJWT);

// View invoices for a student (with BOLA check)
router.get('/student/:studentId', getStudentInvoices);

// Pay an invoice (Student or Staff/Admin)
router.post('/:invoiceId/pay', payInvoice);

// List all invoices (Staff/Admin only)
router.get('/', authorizeRoles('Admin', 'Staff'), listAllInvoices);

export default router;
