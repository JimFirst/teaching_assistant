import { Router } from 'express';
import {
  getAllGrades,
  getGradeById,
  createGrade,
  updateGrade,
  deleteGrade,
  getStudentGrades,
  autoGradeSubmission
} from '../controllers/gradeController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// 获取成绩列表
// teacher/admin：查看所有批改记录
// student：查看自己的批改记录
router.get('/', authorize('admin', 'teacher', 'student'), getAllGrades);
router.get('/:id', authorize('admin', 'teacher', 'student'), getGradeById);

// 教师和管理员可以创建、修改、删除成绩
router.post('/', authorize('admin', 'teacher'), createGrade);
router.put('/:id', authorize('admin', 'teacher'), updateGrade);
router.delete('/:id', authorize('admin', 'teacher'), deleteGrade);

// 学生查看自己的成绩
router.get('/my/grades', authorize('student'), getStudentGrades);

// AI 自动批改
router.post('/auto-grade', authorize('admin', 'teacher'), autoGradeSubmission);

export default router;