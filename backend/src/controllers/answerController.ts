import { Response } from 'express';
import { Answer, Question } from '../models';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

export const getAllAnswers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { questionId } = req.query;

    const where: any = {};
    if (questionId) {
      where.questionId = questionId;
    }

    const answers = await Answer.findAll({
      where,
      attributes: ['id', 'questionId', 'answerText', 'createdAt'],
      include: [{ association: 'question', attributes: ['id', 'questionText'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(answers);
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ message: '服务器错误' });
  }
};

export const getAnswerById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const answer = await Answer.findByPk(id, {
      attributes: ['id', 'questionId', 'answerText', 'createdAt'],
      include: [{ association: 'question', attributes: ['id', 'questionText'] }]
    });

    if (!answer) {
      res.status(404).json({ message: '答案不存在' });
      return;
    }

    res.json(answer);
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ message: '服务器错误' });
  }
};

export const createAnswer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { questionId, answerText } = req.body;

    if (!questionId || !answerText) {
      res.status(400).json({ message: '问题ID和答案内容不能为空' });
      return;
    }

    // Check if question exists
    const question = await Question.findByPk(questionId);
    if (!question) {
      res.status(404).json({ message: '问题不存在' });
      return;
    }

    const answer = await Answer.create({ questionId, answerText });
    res.status(201).json(answer);
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ message: '服务器错误' });
  }
};

export const updateAnswer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { answerText } = req.body;

    const answer = await Answer.findByPk(id);
    if (!answer) {
      res.status(404).json({ message: '答案不存在' });
      return;
    }

    await answer.update({ answerText: answerText || answer.answerText });
    res.json(answer);
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ message: '服务器错误' });
  }
};

export const deleteAnswer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const answer = await Answer.findByPk(id);

    if (!answer) {
      res.status(404).json({ message: '答案不存在' });
      return;
    }

    await answer.destroy();
    res.json({ message: '删除成功' });
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ message: '服务器错误' });
  }
};