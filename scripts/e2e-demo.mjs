/**
 * Uji end-to-end seluruh alur demo lewat browser sungguhan (Playwright/Chromium).
 *
 * Menjalankan semua fitur per peran (publik, Superadmin, Employee, Kepala BPS), mengambil
 * screenshot tiap langkah, dan mencatat error konsol, error JavaScript, serta respons HTTP
 * >= 400 yang tidak diharapkan. Hasil: <out>/report.json dan screenshot bernomor.
 *
 * PERINGATAN: skrip ini MENGUBAH data (registrasi, unggah/hapus dataset, matching,
 * penugasan, verifikasi). Jalankan terhadap database uji, bukan database demo.
 *
 *   E2E_BASE_URL=http://localhost:3200 node scripts/e2e-demo.mjs
 *
 * Variabel opsional: E2E_OUT (bawaan test-results/demo-e2e, di-ignore git karena screenshot
 * berisi data), E2E_DATASET_A / E2E_DATASET_B (pasangan yang dicocokkan),
 * E2E_UPLOAD_SOURCE (CSV sumber potongan data untuk uji unggah).
 */
import { chromium } from 'playwright';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

// Bawaan nama dataset diambil dari datasets/demo-manifest.json (di-ignore git, sama dengan
// scripts/load-demo-data.ts) supaya nama sumber data asli tidak tertulis di repositori.
const MANIFEST = 'datasets/demo-manifest.json';
const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : [];
const ofType = (type) => manifest.find((entry) => entry.type === type);

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3200';
const OUT = process.env.E2E_OUT ?? 'test-results/demo-e2e';
const DATASET_A = process.env.E2E_DATASET_A ?? ofType('DATASET_A')?.name;
const DATASET_B = process.env.E2E_DATASET_B ?? ofType('DATASET_B')?.name;
const UNRUN_A = process.env.E2E_UNRUN_A ?? ofType('DATASET_D')?.name;
const UNRUN_B = process.env.E2E_UNRUN_B ?? ofType('DATASET_C')?.name;
const UPLOAD_SOURCE = process.env.E2E_UPLOAD_SOURCE ?? ofType('DATASET_A')?.file;
if (!DATASET_A || !DATASET_B || !UNRUN_A || !UNRUN_B || !UPLOAD_SOURCE) {
  console.error(`Nama dataset uji belum lengkap: isi ${MANIFEST} (tipe DATASET_A-D) atau variabel E2E_DATASET_A/B, E2E_UNRUN_A/B, E2E_UPLOAD_SOURCE.`);
  process.exit(1);
}
const STAMP = Date.now().toString(36);
const NEW_USER = { username: `e2e_${STAMP}`, password: 'rahasia123', fullName: 'Petugas Uji E2E', email: `e2e.${STAMP}@bps.go.id` };
const UPLOAD_NAME = `Uji Unggah ${STAMP}`;

mkdirSync(OUT, { recursive: true });

const results = [];
const issues = [];
let stepNo = 0;
let allowed = [];
const facts = {};

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);

function watch(page, role) {
  const record = (kind, text) => issues.push({ step: stepNo, role, url: page.url(), kind, text });
  page.on('pageerror', (error) => record('pageerror', error.message));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    // Respons 4xx yang diizinkan juga muncul sebagai "Failed to load resource".
    if (/Failed to load resource/.test(message.text()) && allowed.length) return;
    if (allowed.some((pattern) => pattern.test(message.text()))) return;
    record('console', message.text());
  });
  page.on('response', (response) => {
    const status = response.status();
    if (status < 400) return;
    const target = `${response.request().method()} ${new URL(response.url()).pathname}`;
    if (status < 500 && allowed.some((pattern) => pattern.test(target))) return;
    record(`http ${status}`, target);
  });
}

async function step(role, name, page, fn, { allow = [] } = {}) {
  stepNo += 1;
  allowed = allow;
  const started = Date.now();
  const before = issues.length;
  let status = 'PASS';
  let note = '';
  try {
    const value = await fn();
    if (typeof value === 'string') note = value;
  } catch (error) {
    status = 'FAIL';
    note = String(error?.message ?? error).split('\n')[0];
  }
  await page.waitForTimeout(300);
  const screenshot = `${String(stepNo).padStart(2, '0')}-${slug(role)}-${slug(name)}.png`;
  await page.screenshot({ path: path.join(OUT, screenshot), fullPage: true }).catch(() => {});
  const stepIssues = issues.slice(before);
  if (status === 'PASS' && stepIssues.length) status = 'WARN';
  results.push({ no: stepNo, role, name, status, ms: Date.now() - started, note, screenshot, issues: stepIssues });
  console.log(`${status.padEnd(4)} ${String(stepNo).padStart(2)}. [${role}] ${name}${note ? ` — ${note}` : ''}`);
  for (const issue of stepIssues) console.log(`       ! ${issue.kind}: ${issue.text}`);
  allowed = [];
}

async function settle(page) {
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
}

async function expectNoErrorBanner(page) {
  await settle(page);
  // .bg-error-container juga dipakai badge status (mis. "Perlu Perhatian"); yang dicari
  // hanya pesan kegagalan.
  const banners = page
    .locator('.bg-error-container:visible')
    .filter({ hasText: /gagal|kesalahan|error|tidak dapat|tidak ditemukan|forbidden|unauthorized/i });
  const count = await banners.count();
  if (count > 0) throw new Error(`Banner error tampil: ${(await banners.first().innerText()).trim().slice(0, 160)}`);
}

async function expectText(page, text, timeout = 20_000) {
  await page.getByText(text, { exact: false }).first().waitFor({ state: 'visible', timeout });
}

async function login(page, username, password, landing) {
  await page.goto(`${BASE}/login`);
  await page.fill('#username', username);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  if (landing) await page.waitForURL(`**${landing}`, { timeout: 30_000 });
}

async function logout(page) {
  await page.getByRole('button', { name: /Log Keluar/ }).first().click();
  await page.waitForURL('**/login', { timeout: 15_000 });
}

/** Ambil angka dari kartu statistik berlabel tertentu (mis. "Total Kandidat"). */
async function statValue(page, label) {
  const card = page.locator('div', { has: page.getByText(label, { exact: true }) }).filter({ hasText: /\d/ }).last();
  const text = await card.innerText();
  const match = text.replace(label, '').match(/\d[\d.]*/);
  return match ? Number(match[0].replace(/\./g, '')) : NaN;
}

function makeUploadFiles() {
  const lines = readFileSync(UPLOAD_SOURCE, 'utf8').split(/\r?\n/).filter(Boolean);
  const valid = path.join(OUT, 'unggah-valid.csv');
  writeFileSync(valid, `${lines.slice(0, 31).join('\n')}\n`);
  const invalid = path.join(OUT, 'unggah-header-ganda.csv');
  writeFileSync(invalid, 'idsbr,nama_usaha,nama_usaha\n1,Toko A,Toko A\n');
  return { valid, invalid };
}

const browser = await chromium.launch();
const newPage = async (role) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true, locale: 'id-ID' });
  const page = await context.newPage();
  watch(page, role);
  return page;
};

// ---------------------------------------------------------------- Publik
const pub = await newPage('Publik');
await step('Publik', 'Buka aplikasi diarahkan ke halaman login', pub, async () => {
  await pub.goto(BASE);
  await pub.waitForURL('**/login', { timeout: 20_000 });
});
await step('Publik', 'Login dengan kata sandi salah ditolak', pub, async () => {
  await login(pub, 'admin', 'salah-sekali');
  await expectText(pub, 'Username atau kata sandi salah');
}, { allow: [/POST \/api\/auth\/login/] });
await step('Publik', 'Registrasi akun baru', pub, async () => {
  await pub.goto(`${BASE}/register`);
  await pub.fill('#fullName', NEW_USER.fullName);
  await pub.fill('#email', NEW_USER.email);
  await pub.fill('#username', NEW_USER.username);
  await pub.fill('#password', NEW_USER.password);
  await pub.fill('#confirmPassword', NEW_USER.password);
  await pub.click('button[type="submit"]');
  await pub.waitForURL('**/pending**', { timeout: 20_000 });
  return `username ${NEW_USER.username}`;
});
await step('Publik', 'Akun yang belum disetujui tidak bisa login', pub, async () => {
  await login(pub, NEW_USER.username, NEW_USER.password);
  await pub.waitForTimeout(1500);
  if (!pub.url().includes('/login')) throw new Error(`Seharusnya tetap di login, malah ke ${pub.url()}`);
  const message = (await pub.locator('form').innerText()).match(/(salah|tidak aktif|menunggu|belum)[^\n]*/i);
  if (!message) throw new Error('Tidak ada pesan penolakan');
  return message[0];
}, { allow: [/POST \/api\/auth\/login/] });

// ---------------------------------------------------------------- Superadmin
const admin = await newPage('Superadmin');
await step('Superadmin', 'Login dan dasbor Superadmin', admin, async () => {
  await login(admin, 'admin', 'admin123', '/superadmin/dashboard');
  await expectNoErrorBanner(admin);
});
await step('Superadmin', 'Manajemen Dataset menampilkan dataset', admin, async () => {
  await admin.goto(`${BASE}/datasets`);
  await expectText(admin, DATASET_A);
  await expectText(admin, DATASET_B);
  await expectNoErrorBanner(admin);
  const rows = await admin.locator('tbody tr').count();
  return `${rows} dataset tampil`;
});
await step('Superadmin', 'Cari dataset berdasarkan nama', admin, async () => {
  await admin.fill('input[placeholder="Cari nama dataset..."]', DATASET_B);
  await admin.waitForFunction((name) => {
    const rows = [...document.querySelectorAll('tbody tr')];
    return rows.length === 1 && rows[0].textContent.includes(name);
  }, DATASET_B, { timeout: 15_000 });
  await admin.fill('input[placeholder="Cari nama dataset..."]', '');
  await settle(admin);
  return `hanya "${DATASET_B}" yang tampil`;
});
await step('Superadmin', 'Info kontrak kolom dataset', admin, async () => {
  await admin.locator('button[title="Lihat kontrak kolom dataset"]').click();
  await admin.getByRole('button', { name: 'Tutup' }).first().waitFor({ timeout: 10_000 });
  await admin.screenshot({ path: path.join(OUT, `${String(stepNo).padStart(2, '0')}b-kontrak-kolom.png`) });
  await admin.getByRole('button', { name: 'Tutup' }).first().click();
});
await step('Superadmin', 'Detail dataset (pratinjau kolom & baris)', admin, async () => {
  await admin.locator('tr', { hasText: DATASET_A }).locator('a[aria-label="Lihat detail"]').click();
  await admin.waitForURL(/\/datasets\/\d+$/, { timeout: 15_000 });
  await expectText(admin, DATASET_A);
  await expectNoErrorBanner(admin);
});

const files = makeUploadFiles();
await step('Superadmin', 'Unggah dataset CSV valid', admin, async () => {
  await admin.goto(`${BASE}/datasets/upload`);
  await admin.fill('#dataset_name', UPLOAD_NAME);
  await admin.setInputFiles('input[type="file"]', files.valid);
  await admin.click('button[type="submit"]');
  await admin.waitForURL(/\/datasets\/\d+$/, { timeout: 60_000 });
  await expectText(admin, UPLOAD_NAME);
  return '30 record dari potongan data asli';
});
await step('Superadmin', 'Unggah CSV dengan header ganda ditolak dengan pesan jelas', admin, async () => {
  await admin.goto(`${BASE}/datasets/upload`);
  await admin.setInputFiles('input[type="file"]', files.invalid);
  await admin.click('button[type="submit"]');
  const banner = admin.locator('.bg-error-container').first();
  await banner.waitFor({ timeout: 20_000 });
  const text = (await banner.innerText()).trim();
  if (/^Upload gagal$/i.test(text)) throw new Error('Pesan error terlalu umum: "Upload gagal"');
  return `pesan: ${text.slice(0, 120)}`;
}, { allow: [/POST \/api\/datasets\/upload/, /^Upload error/] });
await step('Superadmin', 'Hapus dataset hasil unggah uji', admin, async () => {
  await admin.goto(`${BASE}/datasets`);
  await expectText(admin, UPLOAD_NAME);
  admin.once('dialog', (dialog) => dialog.accept());
  await admin.locator(`button[aria-label="Hapus ${UPLOAD_NAME}"]`).click();
  await admin.getByText(UPLOAD_NAME).first().waitFor({ state: 'detached', timeout: 20_000 });
});

await step('Superadmin', 'Tombol sidebar "Mulai Pencocokan Baru" membuka Pencocokan Data', admin, async () => {
  await admin.getByRole('link', { name: 'Mulai Pencocokan Baru' }).click();
  await admin.waitForURL('**/matching', { timeout: 15_000 });
});
await step('Superadmin', `Pencocokan ${DATASET_A} ↔ ${DATASET_B} (nama + alamat, 80%)`, admin, async () => {
  await admin.goto(`${BASE}/matching`);
  await admin.getByRole('button', { name: new RegExp(DATASET_A) }).first().click();
  await admin.getByRole('button', { name: new RegExp(DATASET_B) }).first().click();
  await expectText(admin, 'Langkah 3: Petakan Kolom');
  const add = admin.getByRole('button', { name: '+ Tambah Pemetaan Kolom' });
  await add.waitFor();
  await add.click();
  await add.click();
  const selected = await admin.locator('select').evaluateAll((els) => els.map((el) => el.value));
  if (!selected.includes('nama_usaha') || !selected.includes('alamat_usaha')) throw new Error(`Pemetaan otomatis tak terduga: ${selected}`);
  await admin.getByRole('button', { name: 'Lanjut ke Konfigurasi Threshold' }).click();
  await admin.locator('input[type="number"]').fill('80');
  const started = Date.now();
  await admin.getByRole('button', { name: 'Jalankan Pencocokan' }).click();
  await expectText(admin, 'Kandidat Pasangan', 240_000);
  // Angka baru final setelah halaman hasil pertama dimuat.
  await admin.getByText(/Menampilkan .* kandidat|Tidak ada pasangan yang memenuhi threshold/).first().waitFor({ timeout: 60_000 });
  const summary = await admin.locator('div', { has: admin.getByText('Kandidat Pasangan', { exact: true }) }).last().innerText();
  facts.matchingSeconds = Math.round((Date.now() - started) / 1000);
  facts.matchingCandidates = Number((summary.match(/\d[\d.]*/) ?? ['NaN'])[0].replace(/\./g, ''));
  return `${facts.matchingCandidates} kandidat dalam ${facts.matchingSeconds} detik`;
});
await step('Superadmin', 'Dialog detail kandidat (skor per atribut)', admin, async () => {
  await admin.locator('tbody').getByRole('button', { name: 'Detail' }).first().click();
  await admin.getByRole('button', { name: 'Tutup' }).first().waitFor({ timeout: 10_000 });
  await admin.screenshot({ path: path.join(OUT, `${String(stepNo).padStart(2, '0')}b-dialog-detail.png`) });
  await admin.keyboard.press('Escape');
});

await step('Superadmin', 'Hasil Matching langsung membuka proses terbaru', admin, async () => {
  await admin.goto(`${BASE}/superadmin/matching-results`);
  await expectText(admin, 'Daftar Kandidat Hasil Pencocokan', 30_000);
  await expectNoErrorBanner(admin);
  const total = await statValue(admin, 'Total Kandidat');
  if (facts.matchingCandidates && total !== facts.matchingCandidates) throw new Error(`Total ${total} ≠ hasil pencocokan ${facts.matchingCandidates}`);
  return `Total Kandidat ${total}`;
});
await step('Superadmin', 'Hasil Matching: pasangan belum diproses tampil sebagai info, bukan error', admin, async () => {
  await admin.selectOption('#dataset-a', { label: new RegExp(UNRUN_A) }).catch(async () => {
    const value = await admin.locator('#dataset-a option', { hasText: UNRUN_A }).getAttribute('value');
    await admin.selectOption('#dataset-a', value);
  });
  const valueB = await admin.locator('#dataset-b option', { hasText: UNRUN_B }).getAttribute('value');
  await admin.selectOption('#dataset-b', valueB);
  await expectText(admin, 'Belum ada proses pencocokan untuk pasangan');
  await expectNoErrorBanner(admin);
  await admin.locator('button', { hasText: '↔' }).first().click();
  await expectText(admin, 'Daftar Kandidat Hasil Pencocokan', 30_000);
}, { allow: [/GET \/api\/superadmin\/matching-results/] });

await step('Superadmin', 'Penugasan: kandidat & total sesuai hasil matching', admin, async () => {
  await admin.goto(`${BASE}/superadmin/assignments`);
  await admin.getByRole('button', { name: 'Tugaskan' }).first().waitFor({ timeout: 30_000 });
  await expectNoErrorBanner(admin);
  const total = await statValue(admin, 'Total Kandidat');
  if (facts.matchingCandidates && total !== facts.matchingCandidates) throw new Error(`Total ${total} ≠ hasil pencocokan ${facts.matchingCandidates}`);
  return `Total Kandidat ${total}`;
});
for (const [index, employee] of [[0, 'Karyawan Satu'], [1, 'Karyawan Satu'], [2, 'Karyawan Dua']]) {
  await step('Superadmin', `Tugaskan kandidat #${index + 1} ke ${employee}`, admin, async () => {
    await admin.getByRole('button', { name: 'Tugaskan' }).filter({ hasNotText: 'x' }).and(admin.locator(':not([disabled])')).first().click();
    const picker = admin.locator('#pegawai');
    await picker.waitFor({ timeout: 15_000 });
    const value = await picker.locator('option', { hasText: employee }).first().getAttribute('value');
    await picker.selectOption(value);
    await admin.getByRole('button', { name: 'Konfirmasi Penugasan' }).click();
    await expectText(admin, 'berhasil dikirim');
    await admin.getByRole('button', { name: 'Tugaskan' }).first().waitFor({ timeout: 30_000 });
  });
}
await step('Superadmin', 'Penugasan: navigasi halaman kandidat berikutnya', admin, async () => {
  const next = admin.getByRole('button', { name: 'Berikutnya' });
  if (!(await next.count())) return 'hanya satu halaman kandidat';
  await next.click();
  await admin.getByRole('button', { name: 'Tugaskan' }).first().waitFor({ timeout: 30_000 });
  await expectText(admin, 'Halaman 2');
});

for (const [route, title] of [
  ['/superadmin/monitoring', 'Monitoring progres petugas'],
  ['/superadmin/history', 'Riwayat proses'],
  ['/superadmin/report', 'Ringkasan laporan'],
]) {
  await step('Superadmin', title, admin, async () => {
    await admin.goto(`${BASE}${route}`);
    await expectNoErrorBanner(admin);
  });
}
await step('Superadmin', 'Monitoring: tab Proses Pencocokan menampilkan proses tersimpan', admin, async () => {
  await admin.goto(`${BASE}/superadmin/monitoring`);
  await admin.getByRole('button', { name: /Proses Pencocokan/ }).click();
  await admin.locator('tr', { hasText: `${DATASET_A} ↔ ${DATASET_B}` }).first().waitFor({ timeout: 15_000 });
  await expectNoErrorBanner(admin);
});
await step('Superadmin', 'Persetujuan registrasi: tombol Tolak membuka detail', admin, async () => {
  await admin.goto(`${BASE}/superadmin/registration-requests`);
  // Tabel menampilkan nama dan email pemohon, bukan username.
  const row = admin.locator('tr', { hasText: NEW_USER.email });
  await row.waitFor({ timeout: 20_000 });
  await row.getByRole('button', { name: 'Tolak' }).click();
  await admin.waitForURL(/\/superadmin\/registration-requests\/\d+$/, { timeout: 15_000 });
});
await step('Superadmin', 'Setujui registrasi akun baru', admin, async () => {
  await admin.getByRole('button', { name: 'Setujui' }).last().click();
  await expectText(admin, 'Registrasi disetujui');
});
await step('Superadmin', 'Daftar pengguna', admin, async () => {
  await admin.goto(`${BASE}/superadmin/registration-requests`);
  await admin.getByRole('button', { name: 'Daftar Pengguna' }).click();
  await expectText(admin, 'karyawan1');
  await expectNoErrorBanner(admin);
});

// ---------------------------------------------------------------- Employee
// Nama tombol ikut memuat teks ikon Material tanpa spasi (mis. "check_circleMATCH"),
// jadi cocokkan akhirannya; MATCH tidak boleh didahului "NON-".
const VERDICT_BUTTON = { MATCH: /(^|[^-])MATCH$/, 'NON-MATCH': /NON-MATCH$/, 'PERLU REVIEW': /PERLU REVIEW$/ };

async function verifyNext(page, verdict, note) {
  await page.goto(`${BASE}/employee/assignments`);
  await settle(page);
  const links = page.locator('a[href^="/employee/assignments/"]');
  const count = await links.count();
  for (let i = 0; i < count; i++) {
    await links.nth(i).click();
    await page.waitForURL(/\/employee\/assignments\/\d+$/, { timeout: 15_000 });
    // Navigasi sisi klien: data penugasan dimuat setelah networkidle, jadi tunggu
    // sampai tombol verdict atau status "Verifikasi Selesai" benar-benar tampil.
    const button = page.getByRole('button', { name: VERDICT_BUTTON[verdict] });
    await button.or(page.getByText('Verifikasi Selesai')).first().waitFor({ timeout: 20_000 });
    if (await button.count()) {
      if (note) await page.fill('textarea', note);
      await button.click();
      await page.getByRole('button', { name: 'Ya, Simpan' }).click();
      await expectText(page, 'Verifikasi Selesai');
      return page.url().split('/').pop();
    }
    await page.goBack();
    await settle(page);
  }
  throw new Error('Tidak ada penugasan yang belum diverifikasi');
}

const emp1 = await newPage('Employee karyawan1');
await step('Employee karyawan1', 'Login dan dasbor Employee', emp1, async () => {
  await login(emp1, 'karyawan1', 'karyawan123', '/employee/dashboard');
  await expectNoErrorBanner(emp1);
});
await step('Employee karyawan1', 'Daftar penugasan saya', emp1, async () => {
  await emp1.goto(`${BASE}/employee/assignments`);
  await settle(emp1);
  const count = await emp1.locator('a[href^="/employee/assignments/"]').count();
  if (count < 2) throw new Error(`Hanya ${count} penugasan, harusnya ≥ 2`);
  return `${count} penugasan`;
});
await step('Employee karyawan1', 'Verifikasi MATCH', emp1, async () => `penugasan #${await verifyNext(emp1, 'MATCH')}`);
await step('Employee karyawan1', 'Verifikasi NON-MATCH dengan catatan', emp1, async () =>
  `penugasan #${await verifyNext(emp1, 'NON-MATCH', 'Alamat berbeda kecamatan (uji E2E)')}`);
await step('Employee karyawan1', 'Akses halaman Superadmin ditolak', emp1, async () => {
  await emp1.goto(`${BASE}/superadmin/dashboard`);
  await settle(emp1);
  if (emp1.url().includes('/superadmin/')) throw new Error(`Employee bisa membuka ${emp1.url()}`);
  return `dialihkan ke ${new URL(emp1.url()).pathname}`;
}, { allow: [/.*/] });

const emp2 = await newPage('Employee karyawan2');
await step('Employee karyawan2', 'Verifikasi PERLU REVIEW', emp2, async () => {
  await login(emp2, 'karyawan2', 'karyawan123', '/employee/dashboard');
  return `penugasan #${await verifyNext(emp2, 'PERLU REVIEW', 'Perlu cek lapangan (uji E2E)')}`;
});

const fresh = await newPage('Akun baru');
await step('Akun baru', 'Akun yang sudah disetujui bisa login', fresh, async () => {
  await login(fresh, NEW_USER.username, NEW_USER.password, '/employee/dashboard');
  await expectNoErrorBanner(fresh);
});

// ---------------------------------------------------------------- Kepala BPS
const head = await newPage('Kepala BPS');
await step('Kepala BPS', 'Login dan dasbor Kepala BPS', head, async () => {
  await login(head, 'kepala', 'kepala123', '/kepala-bps/dashboard');
  await expectNoErrorBanner(head);
});
await step('Kepala BPS', 'Hasil akhir verifikasi', head, async () => {
  await head.goto(`${BASE}/kepala-bps/hasil-akhir`);
  await expectNoErrorBanner(head);
  const rows = await head.locator('tbody tr').count();
  if (rows < 3) throw new Error(`Hanya ${rows} baris hasil akhir, harusnya ≥ 3`);
  return `${rows} baris`;
});
await step('Kepala BPS', 'Filter hasil akhir "Perlu Review"', head, async () => {
  await head.selectOption('#filter-verifikasi', 'REVIEW');
  await settle(head);
  await head.waitForTimeout(500);
  const rows = await head.locator('tbody tr').allInnerTexts();
  if (rows.length === 0) throw new Error('Tidak ada baris');
  const wrong = rows.filter((text) => !/PERLU REVIEW/i.test(text));
  if (wrong.length) throw new Error(`${wrong.length} baris bukan REVIEW`);
  await head.selectOption('#filter-verifikasi', 'ALL');
  await settle(head);
  return `${rows.length} baris, semuanya Perlu Review`;
});
await step('Kepala BPS', 'Ekspor hasil akhir ke CSV', head, async () => {
  const [download] = await Promise.all([
    head.waitForEvent('download', { timeout: 30_000 }),
    head.locator('a[href^="/api/exports/hasil-akhir"]').click(),
  ]);
  const file = path.join(OUT, 'hasil-akhir.csv');
  await download.saveAs(file);
  const lines = readFileSync(file, 'utf8').trim().split(/\r?\n/);
  if (lines.length < 4) throw new Error(`CSV hanya ${lines.length} baris`);
  return `${lines.length - 1} baris data; header: ${lines[0].slice(0, 80)}`;
});
await step('Kepala BPS', 'Laporan Kepala BPS', head, async () => {
  await head.goto(`${BASE}/kepala-bps/report`);
  await expectNoErrorBanner(head);
});
await step('Kepala BPS', 'Akses halaman Superadmin ditolak', head, async () => {
  await head.goto(`${BASE}/superadmin/dashboard`);
  await settle(head);
  if (head.url().includes('/superadmin/')) throw new Error(`Kepala BPS bisa membuka ${head.url()}`);
  return `dialihkan ke ${new URL(head.url()).pathname}`;
}, { allow: [/.*/] });

// ---------------------------------------------------------------- Superadmin (setelah verifikasi)
await step('Superadmin', 'Hasil Matching memuat hasil verifikasi petugas', admin, async () => {
  await admin.goto(`${BASE}/superadmin/matching-results`);
  await expectText(admin, 'Daftar Kandidat Hasil Pencocokan', 30_000);
  const match = await statValue(admin, 'MATCH');
  if (!(match >= 1)) throw new Error(`MATCH = ${match}`);
  return `MATCH ${match}`;
});
await step('Superadmin', 'Monitoring setelah verifikasi', admin, async () => {
  await admin.goto(`${BASE}/superadmin/monitoring`);
  await expectNoErrorBanner(admin);
});
await step('Superadmin', 'Logout', admin, async () => {
  await logout(admin);
});

await browser.close();

const summary = {
  base: BASE,
  finishedAt: new Date().toISOString(),
  totals: {
    pass: results.filter((r) => r.status === 'PASS').length,
    warn: results.filter((r) => r.status === 'WARN').length,
    fail: results.filter((r) => r.status === 'FAIL').length,
  },
  facts,
  results,
};
writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(summary, null, 2));
writeFileSync(path.join(OUT, 'index.html'), renderHtml(summary));

function renderHtml({ base, finishedAt, totals, results: rows }) {
  const escape = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const tone = { PASS: '#1b7f3b', WARN: '#a15c00', FAIL: '#b3261e' };
  const items = rows.map((r) => `
    <section>
      <h2><span style="color:${tone[r.status]}">${r.status}</span> ${r.no}. [${escape(r.role)}] ${escape(r.name)}</h2>
      ${r.note ? `<p>${escape(r.note)}</p>` : ''}
      ${r.issues.map((i) => `<p class="issue">${escape(i.kind)}: ${escape(i.text)}</p>`).join('')}
      <details><summary>Screenshot (${(r.ms / 1000).toFixed(1)} detik)</summary><img loading="lazy" src="${encodeURI(r.screenshot)}" alt=""></details>
    </section>`).join('');
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Laporan E2E Demo</title><style>
body{font:15px/1.5 system-ui,sans-serif;max-width:1100px;margin:0 auto;padding:16px;color:#1d1b20;background:#fff}
h1{font-size:22px}h2{font-size:16px;margin:0}section{border-bottom:1px solid #ddd;padding:12px 0}
p{margin:4px 0}.issue{color:#b3261e;font-family:monospace;font-size:13px}img{max-width:100%;border:1px solid #ccc;margin-top:8px}
</style></head><body><h1>Laporan uji end-to-end demo</h1>
<p>${escape(base)} · ${escape(new Date(finishedAt).toLocaleString('id-ID'))} · PASS ${totals.pass} · WARN ${totals.warn} · FAIL ${totals.fail}</p>
<p>Berisi tangkapan layar data BPS — jangan dibagikan ke luar BPS.</p>${items}</body></html>`;
}
console.log(`\nPASS ${summary.totals.pass} · WARN ${summary.totals.warn} · FAIL ${summary.totals.fail} — laporan: ${path.join(OUT, 'report.json')}`);
process.exit(summary.totals.fail ? 1 : 0);
