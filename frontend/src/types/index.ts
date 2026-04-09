export type UserRole = 'admin' | 'teacher' | 'student';
export type Subject = '语文' | '数学' | '英语' | '科学';

export interface User {
  id: number;
  account: string;
  username: string;
  role: UserRole;
  subject?: Subject;
  createdAt?: string;
}

export interface Class {
  id: number;
  name: string;
  description?: string;
  teacherIds?: number[];
  teachers?: User[];
  createdAt?: string;
  studentCount?: number;
}

export interface Student {
  id: number;
  name: string;
  studentNo: string;
  phone?: string;
  classId: number;
  className?: string;
  userId?: number;
  username?: string;
  createdAt?: string;
}

export interface Homework {
  id: number;
  title: string;
  content?: string;
  classId: number;
  className?: string;
  imageUrl?: string;
  deadline?: string;
  createdAt: string;
  questions?: Question[];
}

export interface Question {
  id: number;
  homeworkId: number;
  questionText: string;
  questionOrder: number;
  createdAt?: string;
  answers?: Answer[];
}

export interface Answer {
  id: number;
  questionId: number;
  answerText: string;
  createdAt?: string;
}

export interface RecognizedQuestion {
  questionText: string;
  questionOrder: number;
  answerText: string;
}

export interface StudentAnswer {
  questionId: number;
  answerText: string;
}

export interface Submission {
  id: number;
  homeworkId: number;
  studentId: number;
  studentName?: string;
  answers: string | Record<string, string>;
  submittedAt: string;
}

export interface Grade {
  id: number;
  submissionId: number;
  score?: number;
  feedback?: string;
  gradedAt: string;
}

export interface GradeRecord {
  id: number;
  homeworkId: number;
  homeworkTitle?: string;
  studentId: number;
  studentName?: string;
  score: number;
  feedback: string;
  gradedAt: string;
}

export interface HomeworkSubmission {
  id: number;
  homeworkId: number;
  homeworkTitle?: string;
  studentId: number;
  studentName?: string;
  studentNo?: string;
  answers: string | Record<string, string>;
  imageUrl?: string;
  submittedAt: string;
  graded: boolean;
  score?: number;
  feedback?: string;
  grade?: {
    score: number;
    feedback: string;
  };
}

export interface LoginRequest {
  account: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    account: string;
    username: string;
    role: UserRole;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}