import 'reflect-metadata';
import { Sequelize } from 'sequelize-typescript';
import dotenv from 'dotenv';

import { Employee } from '../models/Employee';

dotenv.config();

const env = process.env.NODE_ENV ?? 'development';

// Explicit model list — avoids sequelize-typescript's path scanner choking on
// index.ts re-exports (scanner expects filename === exported class name).
const models = [Employee];

let sequelize: Sequelize;

if (env === 'test') {
  // SQLite in-memory — fast, isolated, no real DB required
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
    models,
  });
} else if (process.env.DATABASE_URL) {
  // Production (Render) — use connection URL with SSL
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false },
    },
    models,
  });
} else {
  // Local development — individual env vars
  sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    database: process.env.DB_NAME ?? 'salary_management',
    username: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASSWORD ?? '',
    logging: console.log,
    models,
  });
}

export default sequelize;
