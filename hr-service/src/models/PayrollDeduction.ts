import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';
import { Staff } from './Staff';

export class PayrollDeduction extends Model {
  public id!: string;
  public staffId!: string;
  public month!: string; // Format: YYYY-MM
  public taxAmount!: number;
  public otherDeductions!: number;
  public netSalary!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PayrollDeduction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    staffId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Staff,
        key: 'id',
      },
    },
    month: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    taxAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    otherDeductions: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    netSalary: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'PayrollDeduction',
    tableName: 'payroll_deductions',
    indexes: [
      {
        fields: ['staffId'],
      },
      {
        unique: true,
        fields: ['staffId', 'month'],
      },
    ],
  }
);

Staff.hasMany(PayrollDeduction, { foreignKey: 'staffId' });
PayrollDeduction.belongsTo(Staff, { foreignKey: 'staffId' });
