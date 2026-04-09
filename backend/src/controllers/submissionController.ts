import { Response } from "express";
import {
  Submission,
  Homework,
  Student,
  Grade,
  Question,
  Answer,
} from "../models";
import { AuthRequest } from "../middleware/auth";
import logger from "../utils/logger";
import path from "path";
import fs from "fs";
import { callMiniMaxText } from "../utils/miniMax";
import { MulterRequest } from "../utils/types";
import { callOCRService } from "../utils/ocr";

export const getAllSubmissions = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { homeworkId } = req.query;

    const where: any = {};
    if (homeworkId) {
      where.homeworkId = homeworkId;
    }

    const submissions = await Submission.findAll({
      where,
      attributes: ["id", "homeworkId", "studentId", "answers", "submittedAt"],
      include: [
        { association: "homework", attributes: ["id", "title"] },
        { association: "student", attributes: ["id", "name", "studentNo"] },
        { association: "grade", attributes: ["id", "score", "feedback"] },
      ],
      order: [["submittedAt", "DESC"]],
    });
    res.json({ success: true, data: submissions });
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ success: false, message: "服务器错误" });
  }
};

export const getSubmissionById = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const submission = await Submission.findByPk(id, {
      attributes: ["id", "homeworkId", "studentId", "answers", "submittedAt"],
      include: [
        { association: "homework", attributes: ["id", "title"] },
        { association: "student", attributes: ["id", "name", "studentNo"] },
        { association: "grade" },
      ],
    });

    if (!submission) {
      res.status(404).json({ success: false, message: "提交不存在" });
      return;
    }

    res.json({ success: true, data: submission });
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ success: false, message: "服务器错误" });
  }
};

export const createSubmission = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { homeworkId, answers: manualAnswers, studentId } = req.body;
    const multerReq = req as unknown as MulterRequest;
    const imageUrl = multerReq.file
      ? `/uploads/${multerReq.file.filename}`
      : null;

    if (!homeworkId) {
      res.status(400).json({ success: false, message: "作业ID不能为空" });
      return;
    }

    const homework = await Homework.findByPk(homeworkId);
    if (!homework) {
      res.status(404).json({ success: false, message: "作业不存在" });
      return;
    }

    let targetStudent: Student | null;

    if (req.user!.role === "teacher" && studentId) {
      targetStudent = await Student.findByPk(studentId);
      if (!targetStudent) {
        res.status(404).json({ success: false, message: "学生不存在" });
        return;
      }
    } else {
      targetStudent = await Student.findOne({
        where: { userId: req.user!.id },
      });
      if (!targetStudent) {
        res.status(404).json({ success: false, message: "学生不存在" });
        return;
      }
    }

    const existingSubmission = await Submission.findOne({
      where: { homeworkId, studentId: targetStudent.id },
    });

    if (homework.deadline && new Date(homework.deadline) < new Date()) {
      res.status(400).json({ success: false, message: "作业已截止，无法提交" });
      return;
    }

    let finalAnswers = manualAnswers || {};
    let recognizedAnswers: Record<number, string> = {};
    let autoGraded = false;
    let score: number | undefined;
    let feedback = "";

    if (imageUrl && !manualAnswers && multerReq.file) {
      const imagePath = path.join(
        process.cwd(),
        "uploads",
        multerReq.file.filename,
      );

      const questions = await Question.findAll({
        where: { homeworkId },
        include: [{ association: "answers" }],
        order: [["questionOrder", "ASC"]],
      });

      if (questions.length > 0) {
        try {
          // Step 1: Call OCR service to recognize text from image
          logger.info("开始调用OCR服务识别图片...");
          const ocrText = await callOCRService(imagePath);
          logger.info(`OCR识别完成，文本长度: ${ocrText.length}`);

          // Step 2: Send OCR text to LLM to extract answers
          const systemPrompt = `你是一个作业评阅助手。你需要分析OCR识别的学生作业文本，然后提取答案。`;

          const userMessage = `请分析这份学生作业的OCR识别文本，找出所有题目的答案。

题目列表：
${questions.map((q, i) => `${i + 1}. ${q.questionText}`).join("\n")}

标准答案：
${questions
  .map((q, i) => {
    const answer = q.answers?.[0];
    return `${i + 1}. ${answer?.answerText || "无"}`;
  })
  .join("\n")}

OCR识别的作业文本：
${ocrText}

请以JSON数组格式返回每个题目的答案，格式：
[{"questionOrder": 1, "answer": "学生答案"}, {"questionOrder": 2, "answer": "学生答案"}, ...]

只返回JSON数组，不要包含任何其他内容。`;

          const aiResponse = await callMiniMaxText(systemPrompt, userMessage);
          const responseJson = JSON.parse(aiResponse);
          const content = responseJson.choices?.[0]?.message?.content || "";

          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const recognizedAnswersList = JSON.parse(jsonMatch[0]);
            recognizedAnswersList.forEach((item: any) => {
              if (item.questionOrder && item.answer) {
                recognizedAnswers[item.questionOrder] = item.answer;
              }
            });
          }
        } catch (aiError) {
          logger.warn("AI识别失败: " + (aiError as Error).message);
        }

        if (Object.keys(recognizedAnswers).length > 0) {
          const questionMap: Record<number, Question> = {};
          questions.forEach((q) => {
            questionMap[q.questionOrder] = q;
          });

          let correctCount = 0;
          const totalQuestions = questions.length;

          Object.keys(recognizedAnswers).forEach((orderStr) => {
            const order = parseInt(orderStr);
            const studentAnswer = recognizedAnswers[order];
            const question = questionMap[order];
            if (question && question.answers && question.answers.length > 0) {
              const standardAnswer = question.answers[0].answerText;
              if (studentAnswer.trim() === standardAnswer.trim()) {
                correctCount++;
              }
            }
          });

          score = Math.round((correctCount / totalQuestions) * 100);
          feedback = `自动批改：${correctCount}/${totalQuestions} 题正确，得分 ${score} 分`;
          autoGraded = true;
        }
      }
    }

    if (imageUrl && Object.keys(recognizedAnswers).length > 0) {
      finalAnswers = recognizedAnswers;
    }

    const submission = await Submission.create({
      homeworkId,
      studentId: targetStudent.id,
      answers: finalAnswers,
      imageUrl: imageUrl || undefined,
    });

    if (autoGraded && score !== undefined) {
      await Grade.create({
        submissionId: submission.id,
        score,
        feedback,
      });
    }

    const fullSubmission = await Submission.findByPk(submission.id, {
      include: [
        { association: "homework", attributes: ["id", "title"] },
        { association: "student", attributes: ["id", "name", "studentNo"] },
        { association: "grade" },
      ],
    });

    res.status(201).json({ success: true, data: fullSubmission });
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ success: false, message: "服务器错误" });
  }
};

export const updateSubmission = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { answers } = req.body;

    const submission = await Submission.findByPk(id);
    if (!submission) {
      res.status(404).json({ success: false, message: "提交不存在" });
      return;
    }

    const student = await Student.findOne({ where: { userId: req.user!.id } });
    if (student && submission.studentId !== student.id) {
      res.status(403).json({ success: false, message: "无权限修改此提交" });
      return;
    }

    await submission.update({ answers: answers || submission.answers });

    const updatedSubmission = await Submission.findByPk(submission.id, {
      include: [
        { association: "homework", attributes: ["id", "title"] },
        { association: "student", attributes: ["id", "name", "studentNo"] },
      ],
    });

    res.json({ success: true, data: updatedSubmission });
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ success: false, message: "服务器错误" });
  }
};

export const deleteSubmission = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const submission = await Submission.findByPk(id);

    if (!submission) {
      res.status(404).json({ success: false, message: "提交不存在" });
      return;
    }

    await Grade.destroy({ where: { submissionId: id } });

    await submission.destroy();
    res.json({ success: true, message: "删除成功" });
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ success: false, message: "服务器错误" });
  }
};

export const getMySubmissions = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { homeworkId } = req.query;

    const student = await Student.findOne({ where: { userId: req.user!.id } });
    if (!student) {
      res.status(404).json({ success: false, message: "学生不存在" });
      return;
    }

    const where: any = { studentId: student.id };
    if (homeworkId) {
      where.homeworkId = homeworkId;
    }

    const submissions = await Submission.findAll({
      where,
      attributes: ["id", "homeworkId", "studentId", "answers", "submittedAt"],
      include: [
        { association: "homework", attributes: ["id", "title", "deadline"] },
        { association: "grade", attributes: ["id", "score", "feedback"] },
      ],
      order: [["submittedAt", "DESC"]],
    });

    const formattedSubmissions = submissions.map((sub) => {
      const subAny = sub as unknown as any;
      return {
        id: sub.id,
        homeworkId: sub.homeworkId,
        studentId: sub.studentId,
        studentName: student.name,
        answers: sub.answers,
        submittedAt: sub.submittedAt,
        grade: subAny.grade
          ? {
              id: subAny.grade.id,
              score: subAny.grade.score,
              feedback: subAny.grade.feedback,
            }
          : null,
        homework: subAny.homework
          ? {
              id: subAny.homework.id,
              title: subAny.homework.title,
              deadline: subAny.homework.deadline,
            }
          : null,
      };
    });

    res.json({ success: true, data: formattedSubmissions });
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ success: false, message: "服务器错误" });
  }
};
