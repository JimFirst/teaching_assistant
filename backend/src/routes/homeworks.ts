import { Router } from 'express';
import {
  getAllHomeworks,
  getHomeworkById,
  createHomework,
  updateHomework,
  deleteHomework,
  recognizeHomework,
  getHomeworkSubmissions
} from '../controllers/homeworkController';
import { authenticate, authorize } from '../middleware/auth';
import upload from '../middleware/upload';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Teacher and admin can access
router.get('/', authorize('admin', 'teacher', 'student'), getAllHomeworks);
router.get('/:id', authorize('admin', 'teacher', 'student'), getHomeworkById);
router.get('/:id/submissions', authorize('admin', 'teacher'), getHomeworkSubmissions);
router.post('/', authorize('admin', 'teacher'), upload.single('image'), createHomework);
router.put('/:id', authorize('admin', 'teacher'), upload.single('image'), updateHomework);
router.delete('/:id', authorize('admin', 'teacher'), deleteHomework);

// AI识别作业题目（预留接口）
router.post('/recognize', authorize('admin', 'teacher'), upload.single('image'), recognizeHomework);

export default router;