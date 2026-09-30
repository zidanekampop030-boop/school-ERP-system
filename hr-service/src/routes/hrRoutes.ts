import { Router } from 'express';
import {
  createStaff,
  listStaff,
  calculatePayroll,
  getStaffPayrollHistory,
} from '../controllers/hrController';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware';

const router = Router();

// Protect all routes
router.use(authenticateJWT);

// Only Admin or Staff roles can view or create staff lists
router.post('/staff', authorizeRoles('Admin', 'Staff'), createStaff);
router.get('/staff', authorizeRoles('Admin', 'Staff'), listStaff);

// Only Admin or specific HR/Staff can calculate payroll
router.post('/payroll/:staffId/calculate', authorizeRoles('Admin', 'Staff'), calculatePayroll);

// View payroll history (with internal BOLA verification check)
router.get('/payroll/:staffId', getStaffPayrollHistory);

export default router;
