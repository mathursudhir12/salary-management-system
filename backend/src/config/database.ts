import 'reflect-metadata';
import { Sequelize } from 'sequelize-typescript';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const env = process.env.NODE_ENV ?? 'development';

const modelsPath = path.join(__dirname, '..', 'models');

let sequelize: Sequelize;

if (env === 'test') {
  // SQLite in-memory — fast, isolated, no real DB required
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
    models: [modelsPath],
  });
} else if (process.env.DATABASE_URL) {
  // Production (Render) — use connection URL with SSL
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: { require: true, rejectUnauthorized: false },
    },
    models: [modelsPath],
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
    models: [modelsPath],
  });
}

export default sequelize;
