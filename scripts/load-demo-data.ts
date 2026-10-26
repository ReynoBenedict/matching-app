import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { existsSync, readFileSync } from 'node:fs';
import { count, eq } from 'drizzle-orm';
import { getDatabase } from '@/lib/db';
import { datasets, users } from '@/lib/db/schema';
import { uploadDataset } from '@/lib/services/dataset-upload';

/**
 * Mengisi database demo dengan dataset sesuai mode, lewat layanan unggah yang sama
 * dengan form Unggah Dataset. Dilewati bila database sudah berisi dataset, sehingga
 * aman dijalankan setiap kali demo dimulai.
 *
 *   tsx scripts/load-demo-data.ts bps   -> data asli BPS (datasets/, didaftarkan di MANIFEST)
 *   tsx scripts/load-demo-data.ts pkl   -> data sintetis (tests/fixtures/)
 */
interface Source {
  file: string;
  name: string;
  type: string;
}

// Nama sumber data asli tidak boleh masuk repositori, jadi daftarnya disimpan di folder
// datasets/ yang di-ignore git. Format: [{ "file": "datasets/x.csv", "name": "...", "type": "DATASET_A" }, ...]
const MANIFEST = 'datasets/demo-manifest.json';

const SYNTHETIC: Source[] = [
  { file: 'tests/fixtures/sintetis_A.csv', name: 'Sintetis A', type: 'DATASET_A' },
  { file: 'tests/fixtures/sintetis_B.csv', name: 'Sintetis B', type: 'DATASET_B' },
];

function readSources(mode: 'bps' | 'pkl'): Source[] {
  if (mode === 'pkl') return SYNTHETIC;
  if (!existsSync(MANIFEST)) {
    throw new Error(`${MANIFEST} belum ada. Daftarkan dataset asli di sana, contoh: [{ "file": "datasets/a.csv", "name": "Dataset A", "type": "DATASET_A" }]`);
  }
  const sources: Source[] = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  for (const source of sources) {
    if (!source.file || !source.name || !/^DATASET_[A-D]$/.test(source.type ?? '')) {
      throw new Error(`Entri ${MANIFEST} tidak valid: ${JSON.stringify(source)}`);
    }
    if (!existsSync(source.file)) throw new Error(`Berkas ${source.file} (dari ${MANIFEST}) tidak ditemukan`);
  }
  return sources;
}

async function main() {
  const mode = process.argv[2];
  if (mode !== 'bps' && mode !== 'pkl') {
    throw new Error('Mode harus "bps" atau "pkl"');
  }

  const db = getDatabase();
  const [{ total }] = await db.select({ total: count() }).from(datasets);
  if (total > 0) {
    console.log(`Database sudah berisi ${total} dataset, tidak mengunggah ulang.`);
    return;
  }

  const [admin] = await db.select({ id: users.id }).from(users).where(eq(users.username, 'admin')).limit(1);
  if (!admin) {
    throw new Error('Akun admin belum ada; jalankan seed terlebih dahulu');
  }

  for (const source of readSources(mode)) {
    const started = Date.now();
    process.stdout.write(`Mengunggah ${source.name} ... `);
    const fileName = source.file.split('/').pop()!;
    const result = await uploadDataset(readFileSync(source.file, 'utf8'), source.name, source.type, fileName, admin.id);
    if (!result.success) {
      throw new Error(`${source.name} gagal diunggah: ${result.message ?? 'tanpa pesan'}`);
    }
    console.log(`${result.totalRecords?.toLocaleString('id-ID')} record (${Math.round((Date.now() - started) / 1000)} detik)`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
