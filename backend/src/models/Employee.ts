import 'reflect-metadata';
import {
  Table,
  Column,
  Model,
  PrimaryKey,
  Default,
  AllowNull,
  DataType,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';

// ── Employment type enum ──────────────────────────────────────────────────────
export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT  = 'CONTRACT',
}

// ── Model ─────────────────────────────────────────────────────────────────────
@Table({
  tableName: 'employees',
  timestamps: true,
})
export class Employee extends Model {
  // id — UUID primary key, auto-generated on the JS side (SQLite + Postgres safe)
  @PrimaryKey
  @Default(uuidv4)
  @Column(DataType.UUID)
  declare id: string;

  // fullName — required, must not be empty string
  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    validate: {
      notEmpty: { msg: 'fullName must not be empty' },
    },
  })
  declare fullName: string;

  // jobTitle — required
  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    validate: {
      notEmpty: { msg: 'jobTitle must not be empty' },
    },
  })
  declare jobTitle: string;

  // country — required
  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    validate: {
      notEmpty: { msg: 'country must not be empty' },
    },
  })
  declare country: string;

  // department — required
  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    validate: {
      notEmpty: { msg: 'department must not be empty' },
    },
  })
  declare department: string;

  // salary — required, must be > 0 (min 0.01 to cover smallest currency unit)
  @AllowNull(false)
  @Column({
    type: DataType.DECIMAL(12, 2),
    validate: {
      isFloat: true,
      min: {
        args: [0.01],
        msg: 'salary must be greater than 0',
      },
    },
  })
  declare salary: number;

  // currency — ISO 4217 code, defaults to USD
  @Default('USD')
  @AllowNull(false)
  @Column(DataType.STRING(3))
  declare currency: string;

  // employmentType — restricted ENUM
  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(EmploymentType)))
  declare employmentType: EmploymentType;

  // joinDate — stored as YYYY-MM-DD string (DATEONLY)
  @AllowNull(false)
  @Column({
    type: DataType.DATEONLY,
    validate: {
      isDate: { msg: 'joinDate must be a valid date', args: true },
    },
  })
  declare joinDate: string;

  // Timestamps — managed automatically by Sequelize
  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
