import { Router } from 'express';
import {
  getAllSubmissions,
  getSubmissionById,
  createSubmission,
  updateSubmission,
  deleteSubmission,
  getMySubmissions
} from '../controllers/submissionController';
import { authenticate, authorize } from '../middleware/auth';
import upload from '../middleware/upload';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Teacher and admin can view all submissions
router.get('/', authorize('admin', 'teacher', 'student'), getAllSubmissions);

// Student view own submissions
router.get('/my', authorize('student'), getMySubmissions);

router.get('/:id', authorize('admin', 'teacher', 'student'), getSubmissionById);

// Students and teachers can create submissions (teachers can submit for students)
router.post('/', authorize('student', 'teacher'), upload.single('image'), createSubmission);
router.put('/:id', authorize('admin', 'teacher', 'student'), updateSubmission);

// Only teacher and admin can delete submissions
router.delete('/:id', authorize('admin', 'teacher'), deleteSubmission);

export default router;