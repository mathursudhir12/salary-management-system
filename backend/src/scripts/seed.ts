/**
 * Seed script — populates 10,000 employees in the database.
 *
 * Name files are read from the project-root seed/ directory.
 * Run from backend/:   npm run seed
 *
 * Rules (CLAUDE.md):
 *  - Use Sequelize bulkCreate with { ignoreDuplicates: true }
 *  - Chunks of 500
 *  - Randomise: country, jobTitle, salary (20k-200k), department, employmentType, joinDate, currency
 *  - Log time per chunk + total — target < 30 seconds
 */

import 'reflect-metadata';
import * as fs   from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

import sequelize            from '../config/database';
import { Employee, EmploymentType } from '../models';

// ── Constants ──────────────────────────────────────────────────────────────────

const TOTAL      = 10_000;
const CHUNK_SIZE = 500;

const COUNTRIES = [
  'India', 'USA', 'UK', 'Germany', 'France',
  'Canada', 'Australia', 'Brazil', 'Japan', 'Singapore',
] as const;

const CURRENCY_MAP: Record<string, string> = {
  India: 'INR', USA: 'USD', UK: 'GBP', Germany: 'EUR',
  France: 'EUR', Canada: 'CAD', Australia: 'AUD',
  Brazil: 'BRL', Japan: 'JPY', Singapore: 'SGD',
};

const JOB_TITLES = [
  'Software Engineer', 'Senior Software Engineer', 'Principal Engineer',
  'Staff Engineer', 'Engineering Manager', 'Product Manager',
  'Senior Product Manager', 'Data Scientist', 'Data Analyst',
  'Machine Learning Engineer', 'DevOps Engineer', 'Site Reliability Engineer',
  'QA Engineer', 'UX Designer', 'Business Analyst',
  'HR Manager', 'Finance Manager', 'Marketing Manager',
  'Sales Manager', 'Technical Writer',
] as const;

const DEPARTMENTS = [
  'Engineering', 'Product', 'Data', 'Operations', 'HR',
  'Finance', 'Design', 'Marketing', 'Sales', 'Legal',
] as const;

const EMPLOYMENT_TYPES = Object.values(EmploymentType);

// ── Helpers ────────────────────────────────────────────────────────────────────

function readLines(filePath: string): string[] {
  return fs.readFileSync(filePath, 'utf-8')
    .split('\n').map(l => l.trim()).filter(Boolean);
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomJoinDate(): string {
  const start = new Date('2018-01-01').getTime();
  const end   = new Date('2024-12-31').getTime();
  return new Date(start + Math.random() * (end - start)).toISOString().slice(0, 10);
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function seed(): Promise<void> {
  const totalStart = Date.now();

  // ── 1. Load name files from root seed/ directory ─────────────────────────────
  // __dirname = backend/src/scripts  →  ../../.. = project root  →  ../../../seed
  const seedDir    = path.resolve(__dirname, '..', '..', '..', 'seed');
  const firstNames = readLines(path.join(seedDir, 'first_names.txt'));
  const lastNames  = readLines(path.join(seedDir, 'last_names.txt'));

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║            Salary Manager — Seed Script                 ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  console.log(`📋  first_names.txt : ${firstNames.length} names`);
  console.log(`📋  last_names.txt  : ${lastNames.length} names`);

  // ── 2. Cartesian product → shuffle → take TOTAL unique names ─────────────────
  const allCombinations: string[] = [];
  for (const fn of firstNames) {
    for (const ln of lastNames) {
      allCombinations.push(`${fn} ${ln}`);
    }
  }

  if (allCombinations.length < TOTAL) {
    throw new Error(
      `Only ${allCombinations.length} unique name combinations available ` +
      `but ${TOTAL} are required.`,
    );
  }

  const names = shuffle(allCombinations).slice(0, TOTAL);
  console.log(`✅  Generated ${names.length.toLocaleString()} unique full names\n`);

  // ── 3. Build record objects ───────────────────────────────────────────────────
  const now     = new Date();
  const records = names.map(fullName => {
    const country = pick(COUNTRIES);
    return {
      id:             randomUUID(),
      fullName,
      jobTitle:       pick(JOB_TITLES),
      country,
      department:     pick(DEPARTMENTS),
      salary:         randInt(20_000, 200_000),
      currency:       CURRENCY_MAP[country],
      employmentType: pick(EMPLOYMENT_TYPES),
      joinDate:       randomJoinDate(),
      createdAt:      now,
      updatedAt:      now,
    };
  });

  // ── 4. Connect ────────────────────────────────────────────────────────────────
  try {
    await sequelize.authenticate();
    console.log(`🔌  Connected to database\n`);
  } catch (err) {
    console.error('❌  Cannot reach database — is it running and is .env correct?', err);
    process.exit(1);
  }

  // ── 5. BulkCreate in chunks of CHUNK_SIZE ─────────────────────────────────────
  const totalChunks = Math.ceil(records.length / CHUNK_SIZE);
  let   inserted    = 0;

  console.log(`📦  Inserting ${TOTAL.toLocaleString()} records in ${totalChunks} chunks of ${CHUNK_SIZE}...\n`);

  for (let i = 0; i < totalChunks; i++) {
    const chunk      = records.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    const chunkStart = Date.now();

    await Employee.bulkCreate(
      chunk as unknown as Parameters<typeof Employee.bulkCreate>[0],
      { ignoreDuplicates: true },
    );

    inserted += chunk.length;
    const chunkMs = Date.now() - chunkStart;

    console.log(
      `  Chunk ${String(i + 1).padStart(2)} / ${totalChunks}` +
      `  ·  ${String(chunk.length).padStart(3)} records` +
      `  ·  ${String(chunkMs).padStart(5)} ms` +
      `  ·  cumulative: ${inserted.toLocaleString().padStart(6)}`,
    );
  }

  // ── 6. Summary ────────────────────────────────────────────────────────────────
  const totalMs  = Date.now() - totalStart;
  const totalSec = (totalMs / 1000).toFixed(2);

  console.log(`\n╔══════════════════════════════════════════════════════════╗`);
  console.log(`║  🎉  ${inserted.toLocaleString()} employees inserted in ${totalSec}s${parseFloat(totalSec) <= 30 ? '  ✅' : '  ⚠️  >30s target'}  ║`);
  console.log(`╚══════════════════════════════════════════════════════════╝\n`);

  if (parseFloat(totalSec) > 30) {
    console.warn('⚠️   Exceeded 30-second target. Consider tuning batch size or DB connection pool.');
  }

  await sequelize.close();
}

seed().catch(err => {
  console.error('\n❌  Seed failed:', err);
  process.exit(1);
});
