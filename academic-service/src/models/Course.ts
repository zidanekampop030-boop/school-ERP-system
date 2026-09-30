import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/db';

export class Course extends Model {
  public id!: string;
  public code!: string;
  public title!: string;
  public credits!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Course.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    credits: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
    },
  },
  {
    sequelize,
    modelName: 'Course',
    tableName: 'courses',
    indexes: [
      {
        unique: true,
        fields: ['code'],
      },
    ],
  }
);
