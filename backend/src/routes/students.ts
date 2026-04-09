import { Router } from 'express';
import {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
} from '../controllers/studentController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Teacher and admin can access
router.get('/', authorize('admin', 'teacher'), getAllStudents);
router.get('/:id', authorize('admin', 'teacher'), getStudentById);
router.post('/', authorize('admin', 'teacher'), createStudent);
router.put('/:id', authorize('admin', 'teacher'), updateStudent);
router.delete('/:id', authorize('admin', 'teacher'), deleteStudent);

export default router;