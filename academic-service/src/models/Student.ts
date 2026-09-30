import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';

export class Student extends Model {
  public id!: string;
  public name!: string;
  public email!: string;
  public enrollmentDate!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Student.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    enrollmentDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Student',
    tableName: 'students',
    indexes: [
      {
        unique: true,
        fields: ['email'],
      },
    ],
  }
);
