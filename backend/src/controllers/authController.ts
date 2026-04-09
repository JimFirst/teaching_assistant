import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { AuthRequest } from '../middleware/auth';
import config from '../config';
import logger from '../utils/logger';

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { account, password } = req.body;

    if (!account || !password) {
      res.status(400).json({ message: '账号和密码不能为空' });
      return;
    }

    const user = await User.findOne({ where: { account } });

    if (!user) {
      res.status(401).json({ message: '账号或密码错误' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({ message: '账号或密码错误' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, account: user.account, role: user.role },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        account: user.account,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ message: '服务器错误' });
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({ success: true, message: '登出成功' });
};

export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: '未授权' });
      return;
    }

    const user = await User.findByPk(req.user.id, {
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