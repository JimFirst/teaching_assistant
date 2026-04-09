import { Router } from 'express';
import {
  getAllQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion
} from '../controllers/questionController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// All authenticated users can view questions
router.get('/', authorize('admin', 'teacher', 'student'), getAllQuestions);
router.get('/:id', authorize('admin', 'teacher', 'student'), getQuestionById);

// Only teacher and admin can create, update, delete questions
router.post('/', authorize('admin', 'teacher'), createQuestion);
router.put('/:id', authorize('admin', 'teacher'), updateQuestion);
router.delete('/:id', authorize('admin', 'teacher'), deleteQuestion);

export default router;