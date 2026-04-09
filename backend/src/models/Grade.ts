import { DataTypes, Model } from 'sequelize';
import sequelize from './sequelize';

interface GradeAttributes {
  id?: number;
  submissionId: number;
  score?: number;
  feedback?: string;
  gradedAt?: Date;
}

class Grade extends Model<GradeAttributes> implements GradeAttributes {
  id!: number;
  submissionId!: number;
  score?: number;
  feedback?: string;
  gradedAt!: Date;
}

Grade.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    submissionId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'grades',
    timestamps: true,
    createdAt: 'gradedAt',
    updatedAt: false
  }
);

export default Grade;