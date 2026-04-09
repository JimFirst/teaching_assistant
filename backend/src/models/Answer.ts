import { DataTypes, Model } from 'sequelize';
import sequelize from './sequelize';

interface AnswerAttributes {
  id?: number;
  questionId: number;
  answerText: string;
  createdAt?: Date;
}

class Answer extends Model<AnswerAttributes> implements AnswerAttributes {
  id!: number;
  questionId!: number;
  answerText!: string;
  createdAt!: Date;
}

Answer.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    questionId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    answerText: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'answers',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: false
  }
);

export default Answer;