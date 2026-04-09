import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role } = req.query;
    const where: any = {};
    if (role) {
      where.role = role;
    }

    const users = await User.findAll({
      where,
      attributes: ['id', 'account', 'username', 'role', 'subject', 'createdAt']
    });
    res.json({ success: true, data: users });
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: ['id', 'account', 'username', 'role', 'subject', 'createdAt']
    });

    if (!user) {
      res.status(404).json({ success: false, message: '用户不存在' });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { account, username, password, role, subject } = req.body;

    if (!account || !username || !password) {
      res.status(400).json({ success: false, message: '账号、用户名和密码不能为空' });
      return;
    }

    const existingUser = await User.findOne({ where: { account } });
    if (existingUser) {
      res.status(400).json({ success: false, message: '账号已存在' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      account,
      username,
      password: hashedPassword,
      role: role || 'student',
      subject
    });

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        account: user.account,
        username: user.username,
        role: user.role,
        subject: user.subject
      }
    });
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { account, username, password, role, subject } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      res.status(404).json({ success: false, message: '用户不存在' });
      return;
    }

    if (account && account !== user.account) {
      const existingUser = await User.findOne({ where: { account } });
      if (existingUser) {
        res.status(400).json({ success: false, message: '账号已存在' });
        return;
      }
    }

    await user.update({
      account: account || user.account,
      username: username || user.username,
      password: password ? await bcrypt.hash(password, 10) : user.password,
      role: role || user.role,
      subject: subject !== undefined ? subject : user.subject
    });

    res.json({
      success: true,
      data: {
        id: user.id,
        account: user.account,
        username: user.username,
        role: user.role,
        subject: user.subject
      }
    });
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      res.status(404).json({ success: false, message: '用户不存在' });
      return;
    }

    if (req.user && parseInt(id) === req.user.id) {
      res.status(400).json({ success: false, message: '不能删除自己的账户' });
      return;
    }

    await user.destroy();
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};