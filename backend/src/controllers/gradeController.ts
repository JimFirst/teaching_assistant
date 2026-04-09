import { Response } from 'express';
import { Grade, Submission, Student, Homework, Question, Answer } from '../models';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

export const getAllGrades = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { submissionId, studentId } = req.query;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    const where: any = {};
    if (submissionId) {
      where.submissionId = submissionId;
    }

    let studentFilter = {};
    if (userRole === 'student') {
      const student = await Student.findOne({ where: { userId } });
      if (!student) {
        res.status(404).json({ success: false, message: '学生不存在' });
        return;
      }
      const submissions = await Submission.findAll({
        where: { studentId: student.id },
        attributes: ['id']
      });
      const submissionIds = submissions.map(s => s.id);
      where.submissionId = submissionIds;
    } else if (studentId) {
      const submissions = await Submission.findAll({
        where: { studentId: Number(studentId) },
        attributes: ['id']
      });
      const submissionIds = submissions.map(s => s.id);
      where.submissionId = submissionIds;
    }

    const grades = await Grade.findAll({
      where,
      attributes: ['id', 'submissionId', 'score', 'feedback', 'gradedAt'],
      include: [
        {
          association: 'submission',
          attributes: ['id', 'homeworkId', 'studentId'],
          include: [
            { association: 'student', attributes: ['id', 'name', 'studentNo'] }
          ]
        }
      ],
      order: [['gradedAt', 'DESC']]
    });
    res.json({ success: true, data: grades });
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

export const getGradeById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const grade = await Grade.findByPk(id, {
      attributes: ['id', 'submissionId', 'score', 'feedback', 'gradedAt'],
      include: [
        {
          association: 'submission',
          attributes: ['id', 'homeworkId', 'studentId', 'answers', 'submittedAt'],
          include: [
            { association: 'student', attributes: ['id', 'name', 'studentNo'] }
          ]
        }
      ]
    });

    if (!grade) {
      res.status(404).json({ success: false, message: '成绩不存在' });
      return;
    }

    res.json({ success: true, data: grade });
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

export const createGrade = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { submissionId, score, feedback } = req.body;

    if (!submissionId || score === undefined) {
      res.status(400).json({ success: false, message: '提交ID和成绩不能为空' });
      return;
    }

    const submission = await Submission.findByPk(submissionId);
    if (!submission) {
      res.status(404).json({ success: false, message: '提交不存在' });
      return;
    }

    const existingGrade = await Grade.findOne({ where: { submissionId } });
    if (existingGrade) {
      res.status(400).json({ success: false, message: '该提交已经有成绩' });
      return;
    }

    const grade = await Grade.create({ submissionId, score, feedback });
    res.status(201).json({ success: true, data: grade });
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

export const updateGrade = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { score, feedback } = req.body;

    const grade = await Grade.findByPk(id);
    if (!grade) {
      res.status(404).json({ success: false, message: '成绩不存在' });
      return;
    }

    await grade.update({
      score: score !== undefined ? score : grade.score,
      feedback: feedback !== undefined ? feedback : grade.feedback
    });

    res.json({ success: true, data: grade });
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

export const deleteGrade = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const grade = await Grade.findByPk(id);

    if (!grade) {
      res.status(404).json({ success: false, message: '成绩不存在' });
      return;
    }

    await grade.destroy();
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

export const getStudentGrades = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const student = await Student.findOne({ where: { userId: req.user!.id } });
    if (!student) {
      res.status(404).json({ success: false, message: '学生不存在' });
      return;
    }

    const submissions = await Submission.findAll({
      where: { studentId: student.id },
      attributes: ['id']
    });
    const submissionIds = submissions.map(s => s.id);

    const grades = await Grade.findAll({
      where: { submissionId: submissionIds },
      attributes: ['id', 'submissionId', 'score', 'feedback', 'gradedAt'],
      include: [
        {
          association: 'submission',
          attributes: ['id', 'homeworkId', 'studentId'],
          include: [
            { association: 'student', attributes: ['id', 'name', 'studentNo'] }
          ]
        }
      ]
    });

    res.json({ success: true, data: grades });
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};
  
export const autoGradeSubmission = async (req: AuthRequest, res: Response): Promise<void> => {
   try {
    const { submissionId } = req.body;

    if (!submissionId) {
      res.status(400).json({ success: false, message: '提交ID不能为空' });
      return;
    }

    const submission = await Submission.findByPk(submissionId, {
      include: [
        { association: 'student', attributes: ['id', 'name', 'studentNo'] },
        { association: 'homework', attributes: ['id', 'title'] }
      ]
    });

    if (!submission) {
      res.status(404).json({ success: false, message: '提交不存在' });
      return;
    }

    const homeworkId = (submission as any).homeworkId;
    const questions = await Question.findAll({
      where: { homeworkId },
      attributes: ['id', 'questionText', 'questionOrder'],
      include: [
        { association: 'answers', attributes: ['id', 'answerText'] }
      ]
    });

    const studentAnswers = submission.answers as unknown as Record<string, string>;

    let totalScore = 0;
    const feedbackParts: string[] = [];

    for (const question of questions) {
      const questionId = String(question.id);
      const studentAnswer = studentAnswers[questionId] || '';
      const correctAnswers = (question as any).answers || [];
      const correctAnswer = correctAnswers[0]?.answerText || '';

      let questionScore = 0;
      if (correctAnswer && studentAnswer) {
        const similarity = calculateSimilarity(studentAnswer, correctAnswer);
        questionScore = Math.round(similarity * 100);
      }

      totalScore += questionScore;
      feedbackParts.push(`第${question.questionOrder}题: ${questionScore}分`);
    }

    const finalScore = questions.length > 0 ? Math.round(totalScore / questions.length) : 0;

    const existingGrade = await Grade.findOne({ where: { submissionId } });

    let grade;
    if (existingGrade) {
      await existingGrade.update({
        score: finalScore,
        feedback: `AI自动批改: ${feedbackParts.join('; ')}`
      });
      grade = existingGrade;
    } else {
      grade = await Grade.create({
        submissionId,
        score: finalScore,
        feedback: `AI自动批改: ${feedbackParts.join('; ')}`
      });
    }

    res.status(201).json({
      success: true,
      message: 'AI自动批改完成',
      data: {
        grade: {
          id: grade.id,
          submissionId: grade.submissionId,
          score: grade.score,
          feedback: grade.feedback,
          gradedAt: grade.gradedAt
        }
      }
    });
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

function calculateSimilarity(text1: string, text2: string): number {
  const s1 = text1.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '');
  const s2 = text2.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '');

  if (s1 === s2) return 1;
  if (!s1 || !s2) return 0;

  if (s2.includes(s1) || s1.includes(s2)) return 0.8;

  const set1 = new Set(s1);
  const set2 = new Set(s2);
  const intersection = [...set1].filter(c => set2.has(c)).length;
  const union = new Set([...s1, ...s2]).size;

  return union > 0 ? intersection / union : 0;
}