import { Response } from 'express';
import { Question, Homework } from '../models';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

export const getAllQuestions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { homeworkId } = req.query;

    const where: any = {};
    if (homeworkId) {
      where.homeworkId = homeworkId;
    }

    const questions = await Question.findAll({
      where,
      attributes: ['id', 'homeworkId', 'questionText', 'questionOrder', 'createdAt'],
      include: [{ association: 'homework', attributes: ['id', 'title'] }],
      order: [['questionOrder', 'ASC']]
    });
    res.json(questions);
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ message: '服务器错误' });
  }
};

export const getQuestionById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const question = await Question.findByPk(id, {
      attributes: ['id', 'homeworkId', 'questionText', 'questionOrder', 'createdAt'],
      include: [{ association: 'homework', attributes: ['id', 'title'] }]
    });

    if (!question) {
      res.status(404).json({ message: '问题不存在' });
      return;
    }

    res.json(question);
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ message: '服务器错误' });
  }
};

export const createQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { homeworkId, questionText, questionOrder } = req.body;

    if (!homeworkId || !questionText) {
      res.status(400).json({ message: '作业ID和问题内容不能为空' });
      return;
    }

    // Check if homework exists
    const homework = await Homework.findByPk(homeworkId);
    if (!homework) {
      res.status(404).json({ message: '作业不存在' });
      return;
    }

    // Get max order for this homework
    const maxOrder = await Question.max('questionOrder', { where: { homeworkId } }) as number || 0;

    const question = await Question.create({
      homeworkId,
      questionText,
      questionOrder: questionOrder || maxOrder + 1
    });

    res.status(201).json(question);
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ message: '服务器错误' });
  }
};

export const updateQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { questionText, questionOrder } = req.body;

    const question = await Question.findByPk(id);
    if (!question) {
      res.status(404).json({ message: '问题不存在' });
      return;
    }

    await question.update({
      questionText: questionText || question.questionText,
      questionOrder: questionOrder || question.questionOrder
    });

    res.json(question);
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ message: '服务器错误' });
  }
};

export const deleteQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const question = await Question.findByPk(id);

    if (!question) {
      res.status(404).json({ message: '问题不存在' });
      return;
    }

    await question.destroy();
    res.json({ message: '删除成功' });
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ message: '服务器错误' });
  }
};