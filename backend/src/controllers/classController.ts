import { Response } from "express";
import { Class, Student, User } from "../models";
import { AuthRequest } from "../middleware/auth";
import logger from "../utils/logger";

function parseTeacherIds(value: string | undefined): number[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function stringifyTeacherIds(value: any): string {
  if (!value) return "[]";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return JSON.stringify(value);
  return "[]";
}

export const getAllClasses = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.id;

    let classes: Class[];
    if (userRole === "teacher" && userId) {
      classes = await Class.findAll({
        order: [["createdAt", "DESC"]],
      });
      classes = classes.filter((cls) => {
        const ids = parseTeacherIds(cls.getDataValue("teacherIds"));
        return ids.includes(userId);
      });
    } else {
      classes = await Class.findAll({
        order: [["createdAt", "DESC"]],
      });
    }

    const classesWithCount = await Promise.all(
      classes.map(async (cls) => {
        const studentCount = await Student.count({
          where: { classId: cls.id },
        });
        const teacherIdList = parseTeacherIds(cls.getDataValue("teacherIds"));
        const teachers = await User.findAll({
          where: {
            id: teacherIdList,
            role: "teacher",
          },
          attributes: ["id", "username", "subject"],
        });
        return {
          ...cls.toJSON(),
          teacherIds: teacherIdList,
          studentCount,
          teachers,
        };
      }),
    );

    res.json({ success: true, data: classesWithCount });
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ success: false, message: "服务器错误" });
  }
};

export const getClassById = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    const classItem = await Class.findByPk(id, {
      attributes: ["id", "name", "description", "teacherIds", "createdAt"],
      include: [
        {
          association: "students",
          attributes: ["id", "name", "studentNo", "phone"],
        },
        {
          association: "homeworks",
          attributes: ["id", "title", "deadline"],
        },
      ],
    });

    if (!classItem) {
      res.status(404).json({ success: false, message: "班级不存在" });
      return;
    }

    if (userRole === "teacher" && userId) {
      const ids = parseTeacherIds(classItem.getDataValue("teacherIds"));
      if (!ids.includes(userId)) {
        res.status(403).json({ success: false, message: "无权限查看此班级" });
        return;
      }
    }

    const teacherIdList = parseTeacherIds(classItem.getDataValue("teacherIds"));
    const teachers = await User.findAll({
      where: {
        id: teacherIdList,
        role: "teacher",
      },
      attributes: ["id", "username", "subject"],
    });

    res.json({
      success: true,
      data: { ...classItem.toJSON(), teacherIds: teacherIdList, teachers },
    });
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ success: false, message: "服务器错误" });
  }
};

export const createClass = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { name, description, teacherIds } = req.body;

    if (!name) {
      res.status(400).json({ success: false, message: "班级名称不能为空" });
      return;
    }

    const existingClass = await Class.findOne({ where: { name } });
    if (existingClass) {
      res.status(400).json({ success: false, message: "班级名称已存在" });
      return;
    }

    const teacherIdArray = Array.isArray(teacherIds) ? teacherIds : [];

    const classItem = await Class.create({
      name,
      description,
      teacherIds: stringifyTeacherIds(teacherIdArray),
    });

    const teachers = await User.findAll({
      where: {
        id: teacherIdArray,
        role: "teacher",
      },
      attributes: ["id", "username", "subject"],
    });

    res.status(201).json({
      success: true,
      data: {
        ...classItem.toJSON(),
        teacherIds: teacherIdArray,
        teachers,
      },
    });
  } catch (error) {
    logger.error((error as Error).message);
    console.error("createClass error:", error);
    res.status(500).json({ success: false, message: "服务器错误" });
  }
};

export const updateClass = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, teacherIds } = req.body;

    const classItem = await Class.findByPk(id);
    if (!classItem) {
      res.status(404).json({ success: false, message: "班级不存在" });
      return;
    }

    if (name && name !== classItem.name) {
      const existingClass = await Class.findOne({ where: { name } });
      if (existingClass) {
        res.status(400).json({ success: false, message: "班级名称已存在" });
        return;
      }
    }

    let updateTeacherIds: string;
    if (teacherIds !== undefined) {
      const teacherIdArray = Array.isArray(teacherIds) ? teacherIds : [];
      updateTeacherIds = stringifyTeacherIds(teacherIdArray);
    } else {
      updateTeacherIds =
        (classItem.getDataValue("teacherIds") as string) || "[]";
    }

    await classItem.update({
      name,
      description,
      teacherIds: updateTeacherIds,
    });

    const teacherIdList = parseTeacherIds(classItem.getDataValue("teacherIds"));
    const teachers = await User.findAll({
      where: {
        id: teacherIdList,
        role: "teacher",
      },
      attributes: ["id", "username", "subject"],
    });

    res.json({
      success: true,
      data: { ...classItem.toJSON(), teacherIds: teacherIdList, teachers },
    });
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ success: false, message: "服务器错误" });
  }
};

export const deleteClass = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const classItem = await Class.findByPk(id);

    if (!classItem) {
      res.status(404).json({ success: false, message: "班级不存在" });
      return;
    }

    const studentCount = await Student.count({ where: { classId: id } });
    if (studentCount > 0) {
      res.status(400).json({
        success: false,
        message: `该班级仍有 ${studentCount} 名学生，请先删除学生后再删除班级`,
      });
      return;
    }

    await classItem.destroy();
    res.json({ success: true, message: "删除成功" });
  } catch (error) {
    logger.error((error as Error).message);
    res.status(500).json({ success: false, message: "服务器错误" });
  }
};
