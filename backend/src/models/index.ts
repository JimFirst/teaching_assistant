import { sequelize, Sequelize } from "./sequelize";
import User from "./User";
import Class from "./Class";
import Student from "./Student";
import Homework from "./Homework";
import Question from "./Question";
import Answer from "./Answer";
import Submission from "./Submission";
import Grade from "./Grade";

export async function initModels() {
  // Define associations without foreign key constraints
  Class.hasMany(Student, { foreignKey: "classId", as: "students", constraints: false });
  Student.belongsTo(Class, { foreignKey: "classId", as: "class", constraints: false });

  User.hasOne(Student, { foreignKey: "userId", as: "student", constraints: false });
  Student.belongsTo(User, { foreignKey: "userId", as: "user", constraints: false });

  Class.hasMany(Homework, { foreignKey: "classId", as: "homeworks", constraints: false });
  Homework.belongsTo(Class, { foreignKey: "classId", as: "class", constraints: false });

  Homework.hasMany(Question, { foreignKey: "homeworkId", as: "questions", constraints: false });
  Question.belongsTo(Homework, { foreignKey: "homeworkId", as: "homework", constraints: false });

  Question.hasMany(Answer, { foreignKey: "questionId", as: "answers", constraints: false });
  Answer.belongsTo(Question, { foreignKey: "questionId", as: "question", constraints: false });

  Homework.hasMany(Submission, { foreignKey: "homeworkId", as: "submissions", constraints: false });
  Submission.belongsTo(Homework, { foreignKey: "homeworkId", as: "homework", constraints: false });

  Student.hasMany(Submission, { foreignKey: "studentId", as: "submissions", constraints: false });
  Submission.belongsTo(Student, { foreignKey: "studentId", as: "student", constraints: false });

  Submission.hasOne(Grade, { foreignKey: "submissionId", as: "grade", constraints: false });
  Grade.belongsTo(Submission, { foreignKey: "submissionId", as: "submission", constraints: false });

  return sequelize;
}

export { User, Class, Student, Homework, Question, Answer, Submission, Grade };
