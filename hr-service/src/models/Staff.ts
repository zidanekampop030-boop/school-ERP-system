import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';

export class Staff extends Model {
  public id!: string;
  public name!: string;
  public email!: string;
  public department!: string;
  public baseSalary!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Staff.init(
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
    department: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'General',
    },
    baseSalary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 3000.0,
    },
  },
  {
    sequelize,
    modelName: 'Staff',
    tableName: 'staff_members',
    indexes: [
      {
        unique: true,
        fields: ['email'],
      },
    ],
  }
);
