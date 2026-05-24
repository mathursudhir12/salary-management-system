/**
 * Standalone migration runner.
 * Usage (from backend/):  npx ts-node --transpile-only scripts/migrate.ts
 */
import 'reflect-metadata';
import dotenv from 'dotenv';
import { Sequelize } from 'sequelize-typescript';
import { up } from '../src/migrations/20260524000001-create-employees';

dotenv.config();

const seq = new Sequelize({
  dialect:  'postgres',
  host:     process.env.DB_HOST     ?? 'localhost',
  port:     parseInt(process.env.DB_PORT ?? '5432', 10),
  database: process.env.DB_NAME     ?? 'salary_management',
  username: process.env.DB_USER     ?? 'postgres',
  password: process.env.DB_PASSWORD ?? '',
  logging:  (msg) => console.log('[sql]', msg),
});

async function main() {
  try {
    await seq.authenticate();
    console.log('✅  Connected to', process.env.DB_NAME, '@', process.env.DB_HOST);
    await up(seq.getQueryInterface());
    console.log('✅  Migration 20260524000001-create-employees applied');
  } catch (err) {
    console.error('❌  Migration failed:', err);
    process.exit(1);
  } finally {
    await seq.close();
  }
}

main();
