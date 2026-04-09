import { DataTypes, Model } from 'sequelize';
import sequelize from './sequelize';

interface HomeworkAttributes {
  id?: number;
  title: string;
  content?: string;
  deadline?: Date;
  classId: number;
  imageUrl?: string;
  createdAt?: Date;
}

class Homework extends Model<HomeworkAttributes> implements HomeworkAttributes {
  id!: number;
  title!: string;
  content?: string;
  deadline?: Date;
  classId!: number;
  imageUrl?: string;
  createdAt!: Date;
}

Homework.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: true
    },
    classId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'homeworks',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: false
  }
);

export default Homework;