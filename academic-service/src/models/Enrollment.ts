import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import { Student } from './Student';
import { Course } from './Course';

export class Enrollment extends Model {
  public id!: string;
  public studentId!: string;
  public courseId!: string;
  public grade!: 'A' | 'B' | 'C' | 'D' | 'F' | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Enrollment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Student,
        key: 'id',
      },
    },
    courseId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Course,
        key: 'id',
      },
    },
    grade: {
      type: DataTypes.ENUM('A', 'B', 'C', 'D', 'F'),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Enrollment',
    tableName: 'enrollments',
    indexes: [
      {
        fields: ['studentId'],
      },
      {
        fields: ['courseId'],
      },
      {
        unique: true,
        fields: ['studentId', 'courseId'],
      },
    ],
  }
);

// Define associations
Student.hasMany(Enrollment, { foreignKey: 'studentId' });
Enrollment.belongsTo(Student, { foreignKey: 'studentId' });

Course.hasMany(Enrollment, { foreignKey: 'courseId' });
Enrollment.belongsTo(Course, { foreignKey: 'courseId' });
