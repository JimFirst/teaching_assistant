import axios from "axios";
import type {
  User,
  Class,
  Student,
  Homework,
  HomeworkSubmission,
  Grade,
  LoginRequest,
  LoginResponse,
  ApiResponse,
} from "../types";

const request = axios.create({
  baseURL: "/api",
  timeout: 120 * 1000,
});

// 请求拦截器 - 添加 token
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 响应拦截器 - 处理错误
request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || "请求失败";
    return Promise.reject(new Error(message));
  },
);

// 登录
export const login = (data: LoginRequest): Promise<LoginResponse> =>
  request.post("/auth/login", data);

// 获取当前用户
export const getCurrentUser = (): Promise<ApiResponse<User>> =>
  request.get("/me");

// 用户管理
export const getUsers = (): Promise<ApiResponse<User[]>> =>
  request.get("/users");

export const getTeachers = (): Promise<ApiResponse<User[]>> =>
  request.get("/users", { params: { role: "teacher" } });

export const createUser = (
  data: Omit<User, "id">,
): Promise<ApiResponse<User>> => request.post("/users", data);

export const updateUser = (
  id: number,
  data: Partial<User>,
): Promise<ApiResponse<User>> => request.put(`/users/${id}`, data);

export const deleteUser = (id: number): Promise<ApiResponse<void>> =>
  request.delete(`/users/${id}`);

// 班级管理
export const getClasses = (): Promise<ApiResponse<Class[]>> =>
  request.get("/classes");

export const createClass = (
  data: Omit<Class, "id">,
): Promise<ApiResponse<Class>> => request.post("/classes", data);

export const updateClass = (
  id: number,
  data: Partial<Class>,
): Promise<ApiResponse<Class>> => request.put(`/classes/${id}`, data);

export const deleteClass = (id: number): Promise<ApiResponse<void>> =>
  request.delete(`/classes/${id}`);

// 学生管理
export const getStudents = (
  classId?: number,
): Promise<ApiResponse<Student[]>> =>
  request.get("/students", { params: classId ? { classId } : undefined });

export const createStudent = (
  data: Omit<Student, "id">,
): Promise<ApiResponse<Student>> => request.post("/students", data);

export const updateStudent = (
  id: number,
  data: Partial<Student>,
): Promise<ApiResponse<Student>> => request.put(`/students/${id}`, data);

export const deleteStudent = (id: number): Promise<ApiResponse<void>> =>
  request.delete(`/students/${id}`);

// 作业管理
export const getHomeworks = (
  classId?: number,
): Promise<ApiResponse<Homework[]>> =>
  request.get("/homeworks", { params: classId ? { classId } : undefined });

export const getHomework = (id: number): Promise<ApiResponse<Homework>> =>
  request.get(`/homeworks/${id}`);

export const createHomework = (
  data: FormData,
): Promise<ApiResponse<Homework>> =>
  request.post("/homeworks", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateHomework = (
  id: number,
  data: FormData,
): Promise<ApiResponse<Homework>> =>
  request.put(`/homeworks/${id}`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const deleteHomework = (id: number): Promise<ApiResponse<void>> =>
  request.delete(`/homeworks/${id}`);

// AI识别作业图片
export const recognizeHomework = (
  data: FormData,
): Promise<
  ApiResponse<{
    imageUrl: string;
    questions: Array<{
      questionText: string;
      questionOrder: number;
      answerText: string;
    }>;
  }>
> =>
  request.post("/homeworks/recognize", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// 作业提交
export const getSubmissions = (
  homeworkId: number,
): Promise<ApiResponse<HomeworkSubmission[]>> =>
  request.get(`/homeworks/${homeworkId}/submissions`);

// 获取所有提交记录（教师/管理员）
export const getAllSubmissions = (
  homeworkId?: number,
): Promise<ApiResponse<HomeworkSubmission[]>> =>
  request.get("/submissions", {
    params: homeworkId ? { homeworkId } : undefined,
  });

// 学生获取自己的提交记录
export const getMySubmissions = (
  homeworkId?: number,
): Promise<ApiResponse<HomeworkSubmission[]>> =>
  request.get("/submissions/my", {
    params: homeworkId ? { homeworkId } : undefined,
  });

// 提交作业（按题目答案数组，可选图片）
export const submitHomeworkWithAnswers = (
  homeworkId: number,
  answers: Record<number, string>,
  studentId?: number,
  imageFile?: File,
): Promise<ApiResponse<HomeworkSubmission>> => {
  const formData = new FormData();
  formData.append("homeworkId", String(homeworkId));
  formData.append("answers", JSON.stringify(answers));
  if (studentId) {
    formData.append("studentId", String(studentId));
  }
  if (imageFile) {
    formData.append("image", imageFile);
  }
  return request.post("/submissions", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// 提交作业（旧接口，保留兼容性）
export const submitHomework = (
  homeworkId: number,
  content: string,
): Promise<ApiResponse<HomeworkSubmission>> =>
  request.post(`/homeworks/${homeworkId}/submit`, { content });

// 成绩管理
export const gradeSubmission = (
  submissionId: number,
  score: number,
  feedback: string,
): Promise<ApiResponse<HomeworkSubmission>> =>
  request.post(`/grades`, { submissionId, score, feedback });

export const getGrades = (
  homeworkId?: number,
  studentId?: number,
): Promise<ApiResponse<Grade[]>> =>
  request.get("/grades", { params: { homeworkId, studentId } });

// AI 自动批改
export const autoGrade = (
  submissionId: number,
): Promise<ApiResponse<{ grade: Grade }>> =>
  request.post("/grades/auto-grade", { submissionId });

export default request;
