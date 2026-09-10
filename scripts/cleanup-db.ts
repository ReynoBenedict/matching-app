/**
 * Database cleanup script
 *
 * Removes dummy/test data from PostgreSQL while preserving genuine datasets.
 *
 * Classification:
 *  - DUMMY: source = 'test', or name matches known test-fixture patterns
 *    (Dataset A/B/1/2, *_emp_t*, *_ui_t*, test_data, test_synthetic_dataset, invalid*)
 *  - GENUINE: everything else (kept, capped at MAX_KEEP)
 *
 * FK-safe order:
 *  1. assignments referencing dummy records/employee/creator
 *  2. dummy datasets  -> cascades dataset_columns + dataset_records
 *  3. orphan records / columns
 *  4. test users (@test.local and known test-prefixed accounts)
 *
 * Run: tsx scripts/cleanup-db.ts
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { getDatabase } from '@/lib/db';
import { sql } from 'drizzle-orm';

const MAX_KEEP = 5;

const DUMMY_NAME_PREDICATE = sql`
  (
    source = 'test'
    OR name LIKE 'Dataset A%'
    OR name LIKE 'Dataset B%'
    OR name LIKE 'Dataset 1%'
    OR name LIKE 'Dataset 2%'
    OR name LIKE '%\_emp\_t%'
    OR name LIKE '%\_ui\_t%'
    OR name LIKE 'test\_data%'
    OR name LIKE 'test\_synthetic%'
    OR name LIKE 'invalid%'
  )
`;

async function scalar(query: ReturnType<typeof sql>): Promise<number> {
  const db = getDatabase();
  const rows = await db.execute(query) as unknown as Array<{ c: string | number }>;
  return Number(rows[0]?.c ?? 0);
}

async function counts() {
  const db = getDatabase();
  const [d] = await db.execute(sql`SELECT count(*)::int AS c FROM datasets`) as unknown as Array<{ c: number }>;
  const r = await scalar(sql`SELECT count(*) AS c FROM dataset_records`);
  const c = await scalar(sql`SELECT count(*) AS c FROM dataset_columns`);
  const a = await scalar(sql`SELECT count(*) AS c FROM assignments`);
  const u = await scalar(sql`SELECT count(*) AS c FROM users`);
  return { datasets: d.c, records: r, columns: c, assignments: a, users: u };
}

async function main() {
  const db = getDatabase();

  console.log('\n====== DATABASE CLEANUP ======\n');

  const before = await counts();
  console.log(`BEFORE: datasets=${before.datasets} records=${before.records} columns=${before.columns} assignments=${before.assignments} users=${before.users}`);

  // List genuine (non-dummy) datasets
  const genuine = await db.execute(sql`
    SELECT id, name, dataset_type, status, source FROM datasets
    WHERE NOT ${DUMMY_NAME_PREDICATE}
    ORDER BY id
  `) as unknown as Array<{ id: number; name: string; dataset_type: string; status: string; source: string }>;

  console.log(`\nGENUINE (non-dummy) datasets found: ${genuine.length}`);
  for (const g of genuine) {
    console.log(`  KEEP? id=${g.id} name="${g.name}" type=${g.dataset_type} status=${g.status} source=${g.source}`);
  }

  const dummyIds = await db.execute(sql`
    SELECT id FROM datasets WHERE ${DUMMY_NAME_PREDICATE} ORDER BY id
  `) as unknown as Array<{ id: number }>;

  console.log(`\nDUMMY dataset IDs to delete: ${dummyIds.length}`);
  // Guard against name-matching something unexpected
  if (genuine.length > MAX_KEEP) {
    throw new Error(`Genuine datasets (${genuine.length}) exceed MAX_KEEP (${MAX_KEEP}). Refusing to delete.`);
  }

  // 1. Delete assignments referencing dummy records / test actors
  const deletedAssignments = await db.execute(sql`
    DELETE FROM assignments
    WHERE record_a_id IN (
            SELECT id FROM dataset_records WHERE dataset_id IN (SELECT id FROM datasets WHERE ${DUMMY_NAME_PREDICATE})
          )
       OR record_b_id IN (
            SELECT id FROM dataset_records WHERE dataset_id IN (SELECT id FROM datasets WHERE ${DUMMY_NAME_PREDICATE})
          )
       OR employee_id IN (SELECT id FROM users WHERE email LIKE '%@test.local')
       OR created_by IN (SELECT id FROM users WHERE email LIKE '%@test.local')
  `) as unknown as { count?: number };
  console.log(`\nDeleted assignments: ${deletedAssignments.count ?? '(executed)'}`);

  // 2. Delete dummy datasets (cascades columns + records)
  await db.execute(sql`DELETE FROM datasets WHERE ${DUMMY_NAME_PREDICATE}`);
  console.log('Deleted dummy datasets (columns + records cascaded)');

  // 3. Remove orphan records/columns (safety)
  await db.execute(sql`
    DELETE FROM dataset_records WHERE dataset_id NOT IN (SELECT id FROM datasets)
  `);
  await db.execute(sql`
    DELETE FROM dataset_columns WHERE dataset_id NOT IN (SELECT id FROM datasets)
  `);
  // Orphan assignments (referencing missing records)
  await db.execute(sql`
    DELETE FROM assignments
    WHERE record_a_id NOT IN (SELECT id FROM dataset_records)
       OR record_b_id NOT IN (SELECT id FROM dataset_records)
  `);
  console.log('Removed orphan records / columns / assignments');

  // 4. Delete test users
  await db.execute(sql`
    DELETE FROM users
    WHERE email LIKE '%@test.local'
       OR username LIKE 'integtest%'
       OR username LIKE 'phase2c%'
  `);
  console.log('Deleted test users (@test.local / integtest* / phase2c*)');

  const after = await counts();
  console.log(`\nAFTER: datasets=${after.datasets} records=${after.records} columns=${after.columns} assignments=${after.assignments} users=${after.users}`);

  console.log(`\nDELETED: datasets=${before.datasets - after.datasets} records=${before.records - after.records} columns=${before.columns - after.columns} assignments=${before.assignments - after.assignments} users=${before.users - after.users}`);

  const remaining = await db.execute(sql`SELECT id, name, dataset_type, status FROM datasets ORDER BY id`) as unknown as Array<{ id: number; name: string; dataset_type: string; status: string }>;
  console.log(`\nREMAINING DATASETS: ${remaining.length}`);
  for (const r of remaining) console.log(`  id=${r.id} name="${r.name}" type=${r.dataset_type} status=${r.status}`);

  console.log('\n====== CLEANUP COMPLETE ======\n');
  process.exit(0);
}

main().catch((e) => {
  console.error('CLEANUP FAILED:', e);
  process.exit(1);
});
