import { Router } from 'express';
import {
  createStudent,
  createCourse,
  enrollStudent,
  updateGrade,
  getTranscript,
  listStudents,
  listCourses,
} from '../controllers/academicController';
import { authenticateJWT, authorizeRoles } from '../middleware/authMiddleware';

const router = Router();

// Protect all routes with JWT authentication
router.use(authenticateJWT);

// Student management (Admin and Staff only)
router.post('/students', authorizeRoles('Admin', 'Staff'), createStudent);
router.get('/students', authorizeRoles('Admin', 'Staff'), listStudents);

// Course management (Admin and Staff only can create, anyone authenticated can view)
router.post('/courses', authorizeRoles('Admin', 'Staff'), createCourse);
router.get('/courses', listCourses);

// Enrollment and grading
router.post('/enroll', authorizeRoles('Admin', 'Staff'), enrollStudent);
router.put('/enrollments/:enrollmentId/grade', authorizeRoles('Admin', 'Staff'), updateGrade);

// Transcript (Authenticated users, contains internal BOLA check for Student role)
router.get('/students/:studentId/transcript', getTranscript);

export default router;
