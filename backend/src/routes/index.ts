import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './users';
import classRoutes from './classes';
import studentRoutes from './students';
import homeworkRoutes from './homeworks';
import questionRoutes from './questions';
import answerRoutes from './answers';
import submissionRoutes from './submissions';
import gradeRoutes from './grades';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/classes', classRoutes);
router.use('/students', studentRoutes);
router.use('/homeworks', homeworkRoutes);
router.use('/questions', questionRoutes);
router.use('/answers', answerRoutes);
router.use('/submissions', submissionRoutes);
router.use('/grades', gradeRoutes);

export default router;