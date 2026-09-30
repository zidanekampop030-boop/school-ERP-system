import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';

export class Invoice extends Model {
  public id!: string;
  public studentId!: string;
  public studentName!: string;
  public studentEmail!: string;
  public courseCode!: string;
  public amount!: number;
  public status!: 'PENDING' | 'PAID';
  public dueDate!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Invoice.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    studentId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    studentName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    studentEmail: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    courseCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'PAID'),
      allowNull: false,
      defaultValue: 'PENDING',
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Invoice',
    tableName: 'invoices',
    indexes: [
      {
        fields: ['studentId'],
      },
      {
        fields: ['status'],
      },
    ],
  }
);
