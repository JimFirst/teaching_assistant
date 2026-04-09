import { DataTypes, Model } from 'sequelize';
import sequelize from './sequelize';
import Answer from './Answer';

interface QuestionAttributes {
  id?: number;
  homeworkId: number;
  questionText: string;
  questionOrder: number;
  createdAt?: Date;
}

class Question extends Model<QuestionAttributes> implements QuestionAttributes {
  id!: number;
  homeworkId!: number;
  questionText!: string;
  questionOrder!: number;
  createdAt!: Date;
  answers?: Answer[];
}

Question.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    homeworkId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    questionText: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    questionOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    }
  },
  {
    sequelize,
    tableName: 'questions',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: false
  }
);

export default Question;