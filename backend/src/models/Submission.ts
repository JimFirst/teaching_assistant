import { DataTypes, Model } from 'sequelize';
import sequelize from './sequelize';

interface SubmissionAttributes {
  id?: number;
  homeworkId: number;
  studentId: number;
  answers: string;
  imageUrl?: string;
  submittedAt?: Date;
}

class Submission extends Model<SubmissionAttributes> implements SubmissionAttributes {
  id!: number;
  homeworkId!: number;
  studentId!: number;
  answers!: string;
  imageUrl?: string;
  submittedAt!: Date;
}

Submission.init(
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
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    answers: {
      type: DataTypes.JSON,
      allowNull: false
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'submissions',
    timestamps: true,
    createdAt: 'submittedAt',
    updatedAt: false
  }
);

export default Submission;