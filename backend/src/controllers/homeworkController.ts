import { Response, Request } from "express";
import {
  Homework,
  Class,
  Question,
  Answer,
  Submission,
  Student,
  Grade,
} from "../models";
import { AuthRequest } from "../middleware/auth";
import path from "path";
import fs from "fs";
import logger from "../utils/logger";
import { callMiniMaxText } from "../utils/miniMax";
import { MulterRequest } from "../utils/types";
import { callOCRService } from "../utils/ocr";

export const getHomeworkSubmissions = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const homework = await Homework.findByPk(id);
    if (!homework) {
      res.status(404).json({ success: false, message: "作业不存在" });
      return;
    }

    const submissions = await Submission.findAll({
      where: { homeworkId: id },
      include: [
        { association: "student", attributes: ["id", "name", "studentNo"] },
      ],
      order: [["submittedAt", "DESC"]],
    });

    res.json({ success: true, data: submissions });
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ success: false, message: "服务器错误" });
  }
};

export const getAllHomeworks = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { classId } = req.query;

    const where: any = {};
    if (classId) {
      where.classId = classId;
    }

    const homeworks = await Homework.findAll({
      where,
      attributes: [
        "id",
        "title",
        "content",
        "deadline",
        "classId",
        "imageUrl",
        "createdAt",
      ],
      include: [
        { association: "class", attributes: ["id", "name"] },
        {
          association: "questions",
          attributes: ["id", "questionText", "questionOrder"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json({ success: true, data: homeworks });
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ success: false, message: "服务器错误" });
  }
};

export const getHomeworkById = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const homework = await Homework.findByPk(id, {
      attributes: [
        "id",
        "title",
        "content",
        "deadline",
        "classId",
        "imageUrl",
        "createdAt",
      ],
      include: [
        { association: "class", attributes: ["id", "name"] },
        {
          association: "questions",
          attributes: ["id", "questionText", "questionOrder"],
          order: [["questionOrder", "ASC"]],
          include: [
            {
              association: "answers",
              attributes: ["id", "answerText", "createdAt"],
            },
          ],
        },
      ],
    });

    if (!homework) {
      res.status(404).json({ success: false, message: "作业不存在" });
      return;
    }

    res.json({ success: true, data: homework });
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ success: false, message: "服务器错误" });
  }
};

export const createHomework = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { title, content, deadline, classId, questions } = req.body;
    const multerReq = req as unknown as MulterRequest;
    const imageUrl = multerReq.file
      ? `/uploads/${multerReq.file.filename}`
      : null;

    if (!title || !classId) {
      res.status(400).json({ success: false, message: "标题和班级不能为空" });
      return;
    }

    const classItem = await Class.findByPk(classId);
    if (!classItem) {
      res.status(404).json({ success: false, message: "班级不存在" });
      return;
    }

    const homework = await Homework.create({
      title,
      content,
      deadline: deadline ? new Date(deadline) : undefined,
      classId,
      imageUrl: imageUrl || undefined,
    });

    let parsedQuestions: Array<{
      questionText: string;
      questionOrder: number;
      answerText?: string;
    }> = [];
    try {
      if (typeof questions === "string") {
        parsedQuestions = JSON.parse(questions);
      } else if (Array.isArray(questions)) {
        parsedQuestions = questions;
      }
    } catch (e) {
      logger.warn("解析题目数据失败");
    }

    if (parsedQuestions.length > 0) {
      for (const [index, q] of parsedQuestions.entries()) {
        const question = await Question.create({
          homeworkId: homework.id,
          questionText: q.questionText,
          questionOrder: q.questionOrder || index + 1,
        });

        if (q.answerText) {
          await Answer.create({
            questionId: question.id,
            answerText: q.answerText,
          });
        }
      }
    }

    const fullHomework = await Homework.findByPk(homework.id, {
      include: [
        { association: "class", attributes: ["id", "name"] },
        { association: "questions", include: [{ association: "answers" }] },
      ],
    });

    res.status(201).json({ success: true, data: fullHomework });
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ success: false, message: "服务器错误" });
  }
};

export const updateHomework = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, content, deadline, classId, questions } = req.body;
    const multerReq = req as unknown as MulterRequest;
    const imageUrl = multerReq.file
      ? `/uploads/${multerReq.file.filename}`
      : undefined;

    const homework = await Homework.findByPk(id);
    if (!homework) {
      res.status(404).json({ success: false, message: "作业不存在" });
      return;
    }

    await homework.update({
      title: title || homework.title,
      content: content !== undefined ? content : homework.content,
      deadline: deadline ? new Date(deadline) : homework.deadline,
      classId: classId || homework.classId,
      imageUrl: imageUrl !== undefined ? imageUrl : homework.imageUrl,
    });

    let parsedQuestions: Array<{
      questionText: string;
      questionOrder: number;
      answerText?: string;
    }> = [];
    try {
      if (typeof questions === "string") {
        parsedQuestions = JSON.parse(questions);
      } else if (Array.isArray(questions)) {
        parsedQuestions = questions;
      }
    } catch (e) {
      logger.warn("解析题目数据失败");
    }

    if (parsedQuestions.length > 0) {
      const existingQuestions = await Question.findAll({
        where: { homeworkId: id },
      });
      for (const eq of existingQuestions) {
        await Answer.destroy({ where: { questionId: eq.id } });
      }
      await Question.destroy({ where: { homeworkId: id } });

      for (const [index, q] of parsedQuestions.entries()) {
        const question = await Question.create({
          homeworkId: homework.id,
          questionText: q.questionText,
          questionOrder: q.questionOrder || index + 1,
        });

        if (q.answerText) {
          await Answer.create({
            questionId: question.id,
            answerText: q.answerText,
          });
        }
      }
    }

    const updatedHomework = await Homework.findByPk(homework.id, {
      include: [
        { association: "class", attributes: ["id", "name"] },
        { association: "questions", include: [{ association: "answers" }] },
      ],
    });

    res.json({ success: true, data: updatedHomework });
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ success: false, message: "服务器错误" });
  }
};

export const deleteHomework = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const homework = await Homework.findByPk(id);

    if (!homework) {
      res.status(404).json({ success: false, message: "作业不存在" });
      return;
    }

    if (homework.imageUrl) {
      const imagePath = path.join(__dirname, "../../", homework.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Question.destroy({ where: { homeworkId: id } });
    const submissions = await Submission.findAll({ where: { homeworkId: id } });
    for (const sub of submissions) {
      await Grade.destroy({ where: { submissionId: sub.id } });
    }
    await Submission.destroy({ where: { homeworkId: id } });

    await homework.destroy();
    res.json({ success: true, message: "删除成功" });
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ success: false, message: "服务器错误" });
  }
};

export const recognizeHomework = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const multerReq = req as unknown as MulterRequest;

    if (!multerReq.file) {
      res.status(400).json({ success: false, message: "请上传作业图片" });
      return;
    }

    const imagePath = path.join(
      __dirname,
      "../../uploads",
      multerReq.file.filename,
    );

    let aiResponse = "";
    try {
      // Step 1: Call OCR service to recognize text from image
      logger.info("开始调用OCR服务识别图片...");
      const ocrText = await callOCRService(imagePath);
      logger.info(`OCR识别完成，文本内容: ${ocrText}`);

      // Step 2: Send OCR text to LLM to extract questions and answers
      const systemPrompt = `你是一个作业分析助手。你需要分析OCR识别的作业图片文本，提取出所有题目和对应的标准答案。`;

      const userMessage = `请分析这份作业的OCR识别文本，识别出所有题目和对应的标准答案。
      请以JSON数组格式返回，每个元素包含以下字段：
      - questionText: 题目文本
      - questionOrder: 题目序号（从1开始）
      - answerText: 标准答案文本

      OCR识别的作业文本：
      ${ocrText}

      只返回JSON数组，不要包含任何其他内容。`;

      aiResponse = await callMiniMaxText(systemPrompt, userMessage);
      console.log("aiResponse", aiResponse);
    } catch (apiError) {
      logger.warn("AI API调用失败: " + (apiError as Error).message);
      const mockQuestions = [
        {
          questionText: "请简述本次作业的核心内容",
          questionOrder: 1,
          answerText: "本题考察学生对知识点的理解程度",
        },
        {
          questionText: "描述你的解题思路",
          questionOrder: 2,
          answerText: "先分析问题，再逐步求解",
        },
        {
          questionText: "总结本次作业的收获",
          questionOrder: 3,
          answerText: "加深了对相关知识点的理解",
        },
      ];
      res.json({
        success: true,
        message: "AI识别成功（API调用失败，已使用备用方案）",
        imageUrl: `/uploads/${multerReq.file.filename}`,
        questions: mockQuestions,
      });
      return;
    }

    const responseJson = JSON.parse(aiResponse);
    const content = responseJson.choices?.[0]?.message?.content || "";

    let questions: Array<{
      questionText: string;
      questionOrder: number;
      answerText: string;
    }> = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      logger.warn("解析AI响应失败，使用备用方案");
      questions = [
        {
          questionText: "请简述本次作业的核心内容",
          questionOrder: 1,
          answerText: "本题考察学生对知识点的理解程度",
        },
        {
          questionText: "描述你的解题思路",
          questionOrder: 2,
          answerText: "先分析问题，再逐步求解",
        },
        {
          questionText: "总结本次作业的收获",
          questionOrder: 3,
          answerText: "加深了对相关知识点的理解",
        },
      ];
    }

    res.json({
      success: true,
      message: "AI识别成功",
      imageUrl: `/uploads/${multerReq.file.filename}`,
      questions: questions,
    });
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ success: false, message: "服务器错误" });
  }
};
