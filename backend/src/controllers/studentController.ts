import { Response } from 'express';
import { Student, User, Class, Submission, Grade } from '../models';
import { AuthRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger';

export const getAllStudents = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId } = req.query;
    const where: Record<string, unknown> = {};
    if (classId) {
      where.classId = parseInt(classId as string, 10);
    }

    const students = await Student.findAll({
      attributes: ['id', 'name', 'studentNo', 'phone', 'classId', 'userId', 'createdAt'],
      where,
      include: [
        { association: 'class', attributes: ['id', 'name'] },
        { association: 'user', attributes: ['id', 'username'] }
      ]
    });
    res.json({ success: true, data: students });
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

export const getStudentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const student = await Student.findByPk(id, {
      attributes: ['id', 'name', 'studentNo', 'phone', 'classId', 'userId', 'createdAt'],
      include: [
        { association: 'class', attributes: ['id', 'name'] },
        { association: 'user', attributes: ['id', 'username'] }
      ]
    });

    if (!student) {
      res.status(404).json({ success: false, message: '学生不存在' });
      return;
    }

    res.json({ success: true, data: student });
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

export const createStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, studentNo, phone, classId, userId } = req.body;

    if (!name || !studentNo || !classId) {
      res.status(400).json({ success: false, message: '姓名、学号、班级不能为空' });
      return;
    }

    const existingStudent = await Student.findOne({
      where: { studentNo, classId }
    });
    if (existingStudent) {
      res.status(400).json({ success: false, message: '学号在该班级内已存在' });
      return;
    }

    let studentUserId: number | undefined;

    if (userId) {
      const existingUser = await User.findByPk(userId);
      if (!existingUser) {
        res.status(400).json({ success: false, message: '关联的用户不存在' });
        return;
      }
      const linkedStudent = await Student.findOne({ where: { userId } });
      if (linkedStudent) {
        res.status(400).json({ success: false, message: '该用户已关联其他学生' });
        return;
      }
      studentUserId = userId;
    } else {
      const studentAccount = studentNo;
      const studentPassword = studentNo;

      const existingUser = await User.findOne({ where: { account: studentAccount } });
      if (existingUser) {
        res.status(400).json({ success: false, message: '账号已存在' });
        return;
      }

      const hashedPassword = await bcrypt.hash(studentPassword, 10);
      const user = await User.create({
        account: studentAccount,
        username: name,
        password: hashedPassword,
        role: 'student'
      });
      studentUserId = user.id;
    }

    const student = await Student.create({
      name,
      studentNo,
      phone,
      classId,
      userId: studentUserId
    });

    res.status(201).json({
      success: true,
      data: {
        id: student.id,
        name: student.name,
        studentNo: student.studentNo,
        phone: student.phone,
        classId: student.classId,
        userId: student.userId
      }
    });
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

export const updateStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, studentNo, phone, classId } = req.body;

    const student = await Student.findByPk(id);
    if (!student) {
      res.status(404).json({ success: false, message: '学生不存在' });
      return;
    }

    if (studentNo && studentNo !== student.studentNo) {
      const targetClassId = classId || student.classId;
      const existingStudent = await Student.findOne({
        where: { studentNo, classId: targetClassId }
      });
      if (existingStudent && existingStudent.id !== student.id) {
        res.status(400).json({ success: false, message: '学号在该班级内已存在' });
        return;
      }
    }

    await student.update({
      name: name || student.name,
      studentNo: studentNo || student.studentNo,
      phone: phone !== undefined ? phone : student.phone,
      classId: classId || student.classId
    });

    res.json({
      success: true,
      data: {
        id: student.id,
        name: student.name,
        studentNo: student.studentNo,
        phone: student.phone,
        classId: student.classId,
        userId: student.userId
      }
    });
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};

export const deleteStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const student = await Student.findByPk(id);

    if (!student) {
      res.status(404).json({ success: false, message: '学生不存在' });
      return;
    }

    const submissions = await Submission.findAll({
      where: { studentId: student.id }
    });

    for (const submission of submissions) {
      await Grade.destroy({ where: { submissionId: submission.id } });
    }

    await Submission.destroy({ where: { studentId: student.id } });

    if (student.userId) {
      await User.destroy({ where: { id: student.userId } });
    }

    await student.destroy();
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
};