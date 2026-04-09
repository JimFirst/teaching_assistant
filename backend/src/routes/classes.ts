import { Router } from 'express';
import {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass
} from '../controllers/classController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Teacher and admin can access
router.get('/', authorize('admin', 'teacher'), getAllClasses);
router.get('/:id', authorize('admin', 'teacher'), getClassById);
router.post('/', authorize('admin', 'teacher'), createClass);
router.put('/:id', authorize('admin', 'teacher'), updateClass);
router.delete('/:id', authorize('admin', 'teacher'), deleteClass);

export default router;