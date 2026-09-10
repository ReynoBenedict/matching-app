/**
 * Database inspection script
 * Connects to PostgreSQL and reports actual state
 */

import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { getDatabase } from '@/lib/db';
import { datasets, datasetColumns, datasetRecords, assignments } from '@/lib/db/schema';
import { count, eq } from 'drizzle-orm';

async function main() {
  console.log('\n====== DATABASE STATE INSPECTION ======\n');

  const db = getDatabase();

  try {
    // Get counts
    console.log('📊 COUNTING ROWS...\n');

    const datasetCount = await db.select({ value: count() }).from(datasets);
    const recordCount = await db.select({ value: count() }).from(datasetRecords);
    const columnCount = await db.select({ value: count() }).from(datasetColumns);
    const assignmentCount = await db.select({ value: count() }).from(assignments);

    const totalDatasets = datasetCount[0]?.value || 0;
    const totalRecords = recordCount[0]?.value || 0;
    const totalColumns = columnCount[0]?.value || 0;
    const totalAssignments = assignmentCount[0]?.value || 0;

    console.log(`Total Datasets: ${totalDatasets}`);
    console.log(`Total Records: ${totalRecords}`);
    console.log(`Total Columns: ${totalColumns}`);
    console.log(`Total Assignments: ${totalAssignments}`);

    // List all datasets
    console.log('\n\n📋 ALL DATASETS:\n');
    console.log('ID | NAME | TYPE | STATUS | RECORDS | COLUMNS | CREATED_AT');
    console.log('---+------+------+--------+---------+---------+----------');

    const allDatasets = await db.select().from(datasets);
    
    for (const ds of allDatasets) {
      // Count records for this dataset
      const dsRecords = await db
        .select({ value: count() })
        .from(datasetRecords)
        .where(eq(datasetRecords.datasetId, ds.id));

      // Count columns for this dataset
      const dsColumns = await db
        .select({ value: count() })
        .from(datasetColumns)
        .where(eq(datasetColumns.datasetId, ds.id));

      const recordsNum = dsRecords[0]?.value || 0;
      const columnsNum = dsColumns[0]?.value || 0;

      console.log(
        `${ds.id} | ${ds.name.substring(0, 30).padEnd(30)} | ${ds.datasetType.padEnd(20)} | ${ds.status.padEnd(7)} | ${recordsNum.toString().padEnd(7)} | ${columnsNum.toString().padEnd(7)} | ${ds.createdAt.toISOString().substring(0, 10)}`
      );
    }

    console.log('\n\n====== SUMMARY ======');
    console.log(`DATASET COUNT BEFORE CLEANUP: ${totalDatasets}`);
    console.log(`Total datasetRecords: ${totalRecords}`);
    console.log(`Total datasetColumns: ${totalColumns}`);
    console.log(`Total assignments: ${totalAssignments}`);

    // Identify dummy datasets
    console.log('\n\n🔍 DUMMY DATASET ANALYSIS:\n');
    const dummyPatterns = [
      'Dataset A',
      'Dataset B',
      'Dataset 1',
      'Dataset 2',
      '_emp_',
      '_ui_',
    ];

    let dummyCount = 0;
    const dummyDatasets: number[] = [];

    for (const ds of allDatasets) {
      const isDummy = dummyPatterns.some((pattern) =>
        ds.name.includes(pattern)
      );
      if (isDummy) {
        dummyCount++;
        dummyDatasets.push(ds.id);
        console.log(`❌ DUMMY: ID ${ds.id} - ${ds.name}`);
      }
    }

    console.log(`\nDummy datasets found: ${dummyCount}`);
    console.log(`Dummy dataset IDs: [${dummyDatasets.join(', ')}]`);

    // Identify real datasets
    console.log('\n\n✅ REAL DATASETS:\n');
    const realDatasets = allDatasets.filter(
      (ds) => !dummyPatterns.some((pattern) => ds.name.includes(pattern))
    );
    
    if (realDatasets.length === 0) {
      console.log('No real datasets found');
    } else {
      for (const ds of realDatasets) {
        console.log(`✓ REAL: ID ${ds.id} - ${ds.name}`);
      }
    }

    console.log('\n====== END INSPECTION ======\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
