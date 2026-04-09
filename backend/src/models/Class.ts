import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from './sequelize';

interface ClassAttributes {
  id?: number;
  name: string;
  description?: string;
  teacherIds: string;
  createdAt?: Date;
}

interface ClassCreationAttributes extends Optional<ClassAttributes, 'id' | 'description' | 'teacherIds'> {}

class Class extends Model<ClassAttributes, ClassCreationAttributes> implements ClassAttributes {
  id!: number;
  name!: string;
  description?: string;
  teacherIds!: string;
  createdAt!: Date;

  getTeacherIdsArray(): number[] {
    const value = this.getDataValue('teacherIds');
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  setTeacherIdsArray(value: number[]): void {
    this.setDataValue('teacherIds', JSON.stringify(value || []));
  }
}

Class.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    teacherIds: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '[]'
    }
  },
  {
    sequelize,
    tableName: 'classes',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: false
  }
);

export default Class;