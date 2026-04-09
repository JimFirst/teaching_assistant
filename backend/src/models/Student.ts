import { DataTypes, Model } from 'sequelize';
import sequelize from './sequelize';

interface StudentAttributes {
  id?: number;
  name: string;
  studentNo: string;
  phone?: string;
  classId: number;
  userId?: number;
  createdAt?: Date;
}

class Student extends Model<StudentAttributes> implements StudentAttributes {
  id!: number;
  name!: string;
  studentNo!: string;
  phone?: string;
  classId!: number;
  userId?: number;
  createdAt!: Date;
}

Student.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    studentNo: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    classId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'students',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: false
  }
);

export default Student;