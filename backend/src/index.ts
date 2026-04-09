import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs";

import logger from "./utils/logger";

// Import models
import {
  initModels,
  User,
  Class,
  Student,
  Homework,
  Question,
  Answer,
  Submission,
  Grade,
} from "./models";

// Import routes
import apiRoutes from "./routes";

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Static files for uploads
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", express.static(uploadsDir));

// API routes
app.use("/api", apiRoutes);

// Health check
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "教师助手系统后端 API" });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(err.stack || err.message);
  res.status(500).json({ message: "服务器内部错误" });
});

// Initialize database and start server
async function initializeDatabase() {
  try {
    const { ensureDatabase } = await import("./models/sequelize");
    await ensureDatabase();
    logger.info("数据库检查完成");

    const sequelize = await initModels();
    await sequelize.authenticate();
    logger.info("数据库连接成功");

    // 使用 sync 而不是 alter，避免 MySQL 索引限制问题
    await sequelize.sync();
    logger.info("数据表同步完成");

    // 重建默认管理员（检查是否已存在）
    const existingAdmin = await User.findOne({ where: { account: "admin" } });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await User.create({
        account: "admin",
        username: "管理员",
        password: hashedPassword,
        role: "admin",
      });
      logger.info("默认超级管理员账号已创建: admin / admin123");
    } else {
      logger.info("超级管理员账号已存在");
    }

    app.listen(PORT, () => {
      logger.info(`服务器运行在 http://localhost:${PORT}`);
      logger.info(`API地址: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    logger.error("数据库连接失败: " + (error as Error).message);
    process.exit(1);
  }
}

initializeDatabase();

export default app;
