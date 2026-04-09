import { DataTypes, Model } from 'sequelize';
import sequelize from './sequelize';

interface UserAttributes {
  id?: number;
  account: string;
  username: string;
  password: string;
  role: 'admin' | 'teacher' | 'student';
  subject?: '语文' | '数学' | '英语' | '科学';
  createdAt?: Date;
}

class User extends Model<UserAttributes> implements UserAttributes {
  id!: number;
  account!: string;
  username!: string;
  password!: string;
  role!: 'admin' | 'teacher' | 'student';
  subject?: '语文' | '数学' | '英语' | '科学';
  createdAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    account: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('admin', 'teacher', 'student'),
      allowNull: false,
      defaultValue: 'student'
    },
    subject: {
      type: DataTypes.ENUM('语文', '数学', '英语', '科学'),
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: false
  }
);

export default User;