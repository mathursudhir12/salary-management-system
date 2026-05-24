/**
 * Seed script — populates 10,000 employees in the PostgreSQL database.
 *
 * Algorithm:
 *  1. Load first_names.txt + last_names.txt (in the same directory)
 *  2. Build every unique first-last combination, Fisher-Yates shuffle, take 10k
 *  3. Randomise country, jobTitle, salary, department, employmentType, joinDate, currency
 *  4. Insert in chunks of 500 via Employee.bulkCreate({ ignoreDuplicates: true })
 *  5. Log elapsed time per chunk and total — target < 30 seconds
 *
 * Run from backend/:
 *   npm run seed
 *
 * Requirements (CLAUDE.md):
 *  - Use Sequelize bulkCreate (never raw INSERT)
 *  - Chunks of 500
 *  - ignoreDuplicates: true
 *  - Log time per chunk + total
 *  - Target < 30 seconds on a local PostgreSQL instance
 */

import 'reflect-metadata';
import * as fs   from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

// ── Backend DB + model (paths are relative to this file, not the CWD) ─────────
// ts-node runs from backend/ so dotenv.config() in database.ts picks up backend/.env
import sequelize from '../backend/src/config/database';
import { Employee, EmploymentType } from '../backend/src/models';

// ── Constants ──────────────────────────────────────────────────────────────────

const TOTAL      = 10_000;
const CHUNK_SIZE = 500;

/** Countries the organisation operates in */
const COUNTRIES = [
  'India',
  'USA',
  'UK',
  'Germany',
  'France',
  'Canada',
  'Australia',
  'Brazil',
  'Japan',
  'Singapore',
] as const;

/** ISO 4217 currency mapped to operating country */
const CURRENCY_MAP: Record<string, string> = {
  India:     'INR',
  USA:       'USD',
  UK:        'GBP',
  Germany:   'EUR',
  France:    'EUR',
  Canada:    'CAD',
  Australia: 'AUD',
  Brazil:    'BRL',
  Japan:     'JPY',
  Singapore: 'SGD',
};

const JOB_TITLES = [
  'Software Engineer',
  'Senior Software Engineer',
  'Principal Engineer',
  'Staff Engineer',
  'Engineering Manager',
  'Product Manager',
  'Senior Product Manager',
  'Data Scientist',
  'Data Analyst',
  'Machine Learning Engineer',
  'DevOps Engineer',
  'Site Reliability Engineer',
  'QA Engineer',
  'UX Designer',
  'Business Analyst',
  'HR Manager',
  'Finance Manager',
  'Marketing Manager',
  'Sales Manager',
  'Technical Writer',
] as const;

const DEPARTMENTS = [
  'Engineering',
  'Product',
  'Data',
  'Operations',
  'HR',
  'Finance',
  'Design',
  'Marketing',
  'Sales',
  'Legal',
] as const;

const EMPLOYMENT_TYPES = Object.values(EmploymentType);

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Read a text file and return trimmed, non-empty lines */
function readLines(filePath: string): string[] {
  return fs
    .readFileSync(filePath, 'utf-8')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);
}

/** In-place Fisher-Yates shuffle; returns the same array reference */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Pick a uniformly random element from a non-empty array */
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Random integer in [min, max] inclusive */
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Random YYYY-MM-DD string between 2018-01-01 and 2024-12-31 */
function randomJoinDate(): string {
  const start = new Date('2018-01-01').getTime();
  const end   = new Date('2024-12-31').getTime();
  return new Date(start + Math.random() * (end - start))
    .toISOString()
    .slice(0, 10);
}

/** Right-pad a string to a fixed width (for aligned console output) */
function pad(str: string | number, width: number): string {
  return String(str).padStart(width);
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function seed(): Promise<void> {
  const totalStart = Date.now();

  // ── Step 1: Load names ───────────────────────────────────────────────────────
  const seedDir    = __dirname;           // absolute path to seed/
  const firstNames = readLines(path.join(seedDir, 'first_names.txt'));
  const lastNames  = readLines(path.join(seedDir, 'last_names.txt'));

  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║              Salary Management — Seed Script            ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  console.log(`📋  first_names.txt : ${firstNames.length} names`);
  console.log(`📋  last_names.txt  : ${lastNames.length} names`);

  // ── Step 2: Generate unique full names ───────────────────────────────────────
  // Cartesian product → shuffle → take first TOTAL entries
  const allCombinations: string[] = [];
  for (const fn of firstNames) {
    for (const ln of lastNames) {
      allCombinations.push(`${fn} ${ln}`);
    }
  }

  if (allCombinations.length < TOTAL) {
    throw new Error(
      `Only ${allCombinations.length} unique name combinations available` +
      ` but ${TOTAL} are required.` +
      ` Add more entries to first_names.txt or last_names.txt.`,
    );
  }

  const names = shuffle(allCombinations).slice(0, TOTAL);
  console.log(`✅  Generated ${names.length.toLocaleString()} unique full names\n`);

  // ── Step 3: Build record objects ─────────────────────────────────────────────
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

  // ── Step 4: Connect to the database ──────────────────────────────────────────
  try {
    await sequelize.authenticate();
    console.log('🔌  Database connected successfully\n');
  } catch (err) {
    console.error('❌  Cannot reach database — is it running and is .env correct?', err);
    process.exit(1);
  }

  // ── Step 5: BulkCreate in chunks of CHUNK_SIZE ────────────────────────────────
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
      `  Chunk ${pad(i + 1, 2)} / ${totalChunks}` +
      `  ·  ${pad(chunk.length, 3)} records` +
      `  ·  ${pad(chunkMs, 5)} ms` +
      `  ·  cumulative: ${pad(inserted.toLocaleString(), 6)}`,
    );
  }

  // ── Step 6: Summary ───────────────────────────────────────────────────────────
  const totalMs  = Date.now() - totalStart;
  const totalSec = (totalMs / 1000).toFixed(2);

  console.log(`\n╔══════════════════════════════════════════════════════════╗`);
  if (parseFloat(totalSec) <= 30) {
    console.log(`║  🎉  Done!  ${pad(inserted.toLocaleString(), 6)} employees inserted in ${pad(totalSec + 's', 8)}  ✅  ║`);
  } else {
    console.log(`║  ✅  Done!  ${pad(inserted.toLocaleString(), 6)} employees inserted in ${pad(totalSec + 's', 8)}      ║`);
    console.log(`║  ⚠️   Exceeded 30-second target (${totalSec}s). Consider tuning.  ║`);
  }
  console.log(`╚══════════════════════════════════════════════════════════╝`);

  await sequelize.close();
}

// ── Entry point ────────────────────────────────────────────────────────────────
seed().catch(err => {
  console.error('\n❌  Seed failed:', err);
  process.exit(1);
});
