# 教师助手系统 - 验证清单

## 技术栈验证
- [x] 前端使用 React + Antd + TypeScript + Vite
- [x] 后端使用 Node.js + Express + TypeScript + Sequelize + MySQL
- [x] 项目目录结构符合技术栈规范

## 登录功能
- [x] 登录页面正确显示用户名和密码输入框
- [x] 登录成功跳转到首页并显示用户信息
- [x] 登录失败显示错误提示信息
- [x] 未登录用户访问其他页面会被重定向到登录页

## 超级管理员功能
- [x] 内置超级管理员账号（admin/admin123）可以登录
- [x] 超级管理员可以查看用户列表
- [x] 超级管理员可以添加新用户
- [x] 超级管理员可以编辑用户信息
- [x] 超级管理员可以删除用户

## 班级管理功能
- [x] 可以查看班级列表，显示班级名称、描述、创建时间
- [x] 可以新增班级，班级名称不能为空且不能重复
- [x] 可以编辑班级信息
- [x] 删除班级前会检查是否有学生，提示先删除学生

## 学生管理功能
- [x] 在班级详情页可以查看学生列表
- [x] 可以新增学生，学号在同一班级内不能重复
- [x] 可以编辑学生信息
- [x] 删除学生时关联的提交记录一并删除
- [x] 学生可以关联用户账号（用于登录）

## 作业管理功能
- [x] 教师可以发布作业，作业标题不能为空
- [x] 支持图片上传功能
- [x] 大模型自动识别图片内容，提取问题和答案
- [x] 可以查看作业列表，支持按班级筛选
- [x] 可以编辑作业信息（包含图片上传）
- [x] 可以删除作业（级联删除问题、答案、提交记录）
- [x] 作业详情包含问题和答案列表显示

## 学生功能
- [x] 学生只能查看自己班级的作业
- [x] 学生可以查看作业详情和问题列表
- [x] 学生可以提交作业答案
- [x] 学生可以查看批改结果和分数

## 作业批改功能
- [x] 教师可以查看学生提交记录
- [x] 支持手动批改（输入分数和评语）
- [x] 支持大模型自动批改答案
- [x] 批改结果包含分数和反馈

## 数据模型
- [x] 用户表（users）字段完整：id, username, password, role, created_at
- [x] 班级表（classes）字段完整：id, name, description, created_at
- [x] 学生表（students）字段完整：id, name, student_no, phone, class_id, user_id, created_at
- [x] 作业表（homeworks）字段完整：id, title, content, deadline, class_id, image_url, created_at
- [x] 问题表（questions）字段完整：id, homework_id, question_text, question_order, created_at
- [x] 答案表（answers）字段完整：id, question_id, answer_text, created_at
- [x] 提交表（submissions）字段完整：id, homework_id, student_id, answers, submitted_at
- [x] 批改表（grades）字段完整：id, submission_id, score, feedback, graded_at

## 界面要求
- [x] 使用Antd组件库构建前端界面
- [x] 登录页面简洁清晰
- [x] 导航菜单正确显示对应角色可用的功能
- [x] 必要的表单验证和错误提示
- [x] 响应式布局适配不同设备