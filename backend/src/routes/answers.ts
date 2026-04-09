import { Router } from 'express';
import {
  getAllAnswers,
  getAnswerById,
  createAnswer,
  updateAnswer,
  deleteAnswer
} from '../controllers/answerController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// All authenticated users can view answers
router.get('/', authorize('admin', 'teacher', 'student'), getAllAnswers);
router.get('/:id', authorize('admin', 'teacher', 'student'), getAnswerById);

// Only teacher and admin can create, update, delete answers
router.post('/', authorize('admin', 'teacher'), createAnswer);
router.put('/:id', authorize('admin', 'teacher'), updateAnswer);
router.delete('/:id', authorize('admin', 'teacher'), deleteAnswer);

export default router;