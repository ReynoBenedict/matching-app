# Sistem Pencocokan Data BPS Kota Malang

Aplikasi web internal untuk mencocokkan record usaha antar dataset secara dinamis berbasis multi-atribut. Superadmin mengunggah dataset CSV, memilih atribut dan threshold, lalu menjalankan pencocokan; kandidat pasangan hasil pencocokan ditugaskan kepada Employee untuk diverifikasi (MATCH / NON-MATCH / REVIEW); Kepala BPS memantau ringkasan dan hasil akhir.

> Skor kemiripan **bukan** keputusan akhir dan **bukan** ukuran akurasi. Setiap kandidat tetap diverifikasi manusia. Belum ada *ground truth*, sehingga precision/recall belum pernah diukur.

## Fitur yang tersedia

| Area | Fitur |
|---|---|
| Akun | Registrasi mandiri (selalu sebagai Employee; role dari klien diabaikan) → menunggu persetujuan Superadmin → login. Setujui/tolak permohonan. Login gagal dicatat di `audit_logs`. |
| Sesi & akses | Cookie sesi `httpOnly` bertanda tangan HMAC-SHA256; otorisasi per peran di setiap route API (Superadmin = `ADMIN`, `EMPLOYEE`, Kepala BPS = `HEAD`) dan penjaga peran di layout. |
| Dataset | Unggah CSV (≤ 200 MB, header unik), validasi, pratinjau kolom/baris asli, hapus (berjenjang ke record, run, kandidat, penugasan). Tipe sumber generik `DATASET_A`–`DATASET_D`. |
| Pencocokan | Dua dataset per proses, satu atau lebih pasangan atribut, threshold 0–100 %. Dijalankan asinkron (job) melalui Model Service; *run* dan kandidat disimpan. |
| Penugasan | Superadmin menugaskan kandidat (satu pasangan per penugasan) ke Employee; pasangan yang sama tidak bisa ditugaskan dua kali. |
| Verifikasi | Employee memverifikasi penugasan miliknya; Superadmin dapat memverifikasi/mengubah penugasan mana pun (diperiksa di server). Perubahan menimpa nilai lama dan dicatat di `audit_logs` (tanpa tabel riwayat versi). |
| Pemantauan | Dasbor Superadmin, monitoring progres per Employee, hasil matching, riwayat proses, ringkasan laporan; dasbor dan hasil akhir Kepala BPS; ekspor hasil akhir ke CSV. |

**Belum tersedia** (dibandingkan SRS): kelola akun oleh Superadmin (tambah/ubah/nonaktifkan), unggah Excel, pembaruan dataset, lebih dari dua dataset per proses, distribusi tugas otomatis dan pemindahan alokasi, laporan PDF/Excel, UI khusus verifikasi langsung oleh Superadmin (API sudah ada), proteksi *lost update* saat dua pengguna mengubah hasil bersamaan, registri job persisten (job yang sedang berjalan hilang bila server restart; hasil yang selesai tetap tersimpan).

## Arsitektur

```
Browser ──> Next.js (UI + route handler REST API + Drizzle ORM) ──> PostgreSQL 16
                 │  POST /match                                        ▲
                 └──────────> Model Service (FastAPI) ─────────────────┘ (membaca record)
```

Model Service: normalisasi (NFKC, huruf kecil, tanda baca → spasi) → TF-IDF karakter 3–5 gram → Truncated SVD (≤ 128 komponen) → FAISS `IndexFlatIP` Top-K (`MATCHING_TOP_K`, bawaan 10) → skor per atribut `rapidfuzz.fuzz.ratio / 100` → rata-rata → saring dengan threshold. Pasangan di luar Top-K per record dataset A tidak pernah dinilai.

## Teknologi

Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4, Drizzle ORM 0.45 + drizzle-kit, PostgreSQL 16, bcryptjs; Python 3.12, FastAPI, scikit-learn, faiss-cpu, RapidFuzz, psycopg; Docker Compose; tsx dan Playwright untuk pengujian.

## Struktur direktori

```
src/
  app/            halaman (login, register, pending, superadmin/*, employee/*, kepala-bps/*, datasets, matching)
  app/api/        route handler REST (auth, datasets, matching, assignments, superadmin, kepala-bps, reports, exports, health)
  components/     komponen UI per domain (layouts, datasets, matching, assignments, employee, reports)
  lib/auth/       sesi, otorisasi, penjaga peran
  lib/db/         schema Drizzle, koneksi, seed
  lib/services/   logika bisnis (upload, matching/*, assignment, monitoring, report)
  lib/config/, lib/constants/
drizzle/          migrasi SQL (sumber kebenaran skema; jangan diedit manual)
model_service/    Model Service FastAPI (app.py, requirements.txt, Dockerfile)
tests/            uji threshold, uji matching, fixtures/ (CSV sintetis)
docs/             catatan teknis (upload, integrasi)
```

Uji integrasi per fitur berada di `src/**/__tests__/`.

## Prasyarat

Node.js ≥ 20 dan npm; Docker + Docker Compose; (opsional, untuk menjalankan Model Service tanpa Docker) Python 3.12.

## Menjalankan untuk development

```bash
npm ci
cp .env.example .env.local
#   ubah: DATABASE_URL=postgresql://bps_user:bps_password@localhost:5432/bps_data_matching
#         MODEL_SERVICE_URL=http://localhost:8000
#         NEXTAUTH_SECRET=<string acak>
docker compose up -d postgres     # basis data
npm run db:migrate                # terapkan migrasi drizzle/
npm run db:seed                   # 7 akun demo (idempoten)

# Model Service — pilih salah satu:
docker compose up -d model
# atau tanpa Docker:
cd model_service
python -m venv .venv
.venv/Scripts/pip install -r requirements.txt        # Linux/macOS: .venv/bin/pip
DATABASE_URL=postgresql://bps_user:bps_password@localhost:5432/bps_data_matching .venv/Scripts/uvicorn app:app --port 8000
cd ..

npm run dev                       # http://localhost:3000
```

Production build lokal: `npm run build && npm start` (port 3000; port lain: `npm start -- -p 3100`).

## Menjalankan untuk demo

Dua mode dengan database terpisah (stack `docker-compose.demo.yml`, project `bps-demo`):

| Perintah (dari root project) | Untuk | Dataset | Database |
|---|---|---|---|
| `.\demo-bps.cmd` | Demo ke BPS | data asli BPS di `datasets/` (tidak di-commit) | `bps_demo` |
| `.\demo-pkl.cmd` | Presentasi PKL | data sintetis `tests/fixtures/` | `pkl_demo` |

Script `scripts/demo.ps1` menyalakan Docker Desktop bila perlu, Postgres (`127.0.0.1:5433`) dan Model Service (`127.0.0.1:8100`), menjalankan migrasi + seed, mengunggah dataset bila database masih kosong (`scripts/load-demo-data.ts`; untuk mode BPS daftar berkasnya dibaca dari `datasets/demo-manifest.json` yang ikut di-ignore, format `[{ "file": "datasets/a.csv", "name": "Dataset A", "type": "DATASET_A" }, …]`), lalu menjalankan production build di **http://localhost:3100**. Tambahkan `-Build` setelah kode berubah, `-Lan` agar bisa dibuka dari perangkat lain di jaringan yang sama. Berhenti dengan Ctrl+C.

## Menjalankan seluruh stack dengan Docker Compose

```bash
cp .env.example .env              # ganti NEXTAUTH_SECRET
docker compose up -d --build      # app :3000, postgres :5432, model :8000
# Image app tidak menjalankan migrasi/seed otomatis; jalankan dari host:
DATABASE_URL=postgresql://bps_user:bps_password@localhost:5432/bps_data_matching npm run db:migrate
DATABASE_URL=postgresql://bps_user:bps_password@localhost:5432/bps_data_matching npm run db:seed
```

### Port dan URL

| Service | Port | Variabel |
|---|---|---|
| App (Next.js) | 3000 | `NEXTAUTH_URL` |
| PostgreSQL | 5432 | `DATABASE_URL` |
| Model Service | 8000 (`GET /health`, `POST /match`) | `MODEL_SERVICE_URL` |

### Variabel lingkungan

Lihat `.env.example`. Penting: `NEXTAUTH_SECRET` (wajib; tanpa nilai ini dipakai rahasia acak per proses sehingga semua sesi berakhir saat restart), `SESSION_COOKIE_SECURE` (cookie `Secure` hanya pada HTTPS — biarkan kosong untuk akses HTTP di LAN; jika tidak, browser membuang cookie dan login tampak gagal), `MATCHING_PROVIDER=model_service`, `MATCHING_TOP_K` (dibaca Model Service).

## Akun demo (hanya development lokal)

Dibuat oleh `npm run db:seed`. **Ganti atau hapus sebelum deployment.**

| Peran | Username | Password |
|---|---|---|
| Superadmin (`ADMIN`) | `admin`, `superadmin` | `admin123`, `superadmin123` |
| Kepala BPS (`HEAD`) | `kepala` | `kepala123` |
| Employee | `karyawan1`, `karyawan2`, `karyawan3` | `karyawan123` |
| Employee nonaktif | `karyawan_nonaktif` | `karyawan123` |

## Data contoh

`tests/fixtures/sintetis_A.csv` dan `sintetis_B.csv` berisi data **fiktif** (12 record, kolom `idsbr,nama_usaha,alamat_usaha,kdkec`) untuk mencoba unggah → pencocokan (atribut `nama_usaha` + `alamat_usaha`, threshold 70 %) → penugasan → verifikasi.

## Pengujian

```bash
npm run type-check          # TypeScript
npm run lint                # ESLint
npm run test:threshold      # uji murni konversi threshold
# Uji integrasi berikut menulis ke basis data pada DATABASE_URL — gunakan DB development/uji, bukan produksi:
npm test                    # layanan penugasan
npm run test:ui             # alur penugasan Superadmin
npm run test:labeling       # alur pelabelan Employee
npm run build               # production build
```

`npm run test:e2e` (Playwright) dan `tests/matching.test.ts` mengasumsikan server di `localhost:3001`/`3000` dengan data awal tertentu dan belum menjadi bagian pengujian rutin.

### Uji end-to-end alur demo

`scripts/e2e-demo.mjs` menjalankan seluruh fitur per peran lewat Chromium (registrasi → unggah/hapus dataset → pencocokan → hasil → penugasan → verifikasi MATCH/NON-MATCH/REVIEW → hasil akhir & ekspor CSV → guard peran) dan menulis laporan bergambar ke `test-results/demo-e2e/index.html` (di-ignore git karena berisi data BPS). Skrip ini **mengubah data**, jadi jalankan terhadap salinan uji `bps_e2e`, bukan `bps_demo`:

```powershell
# database uji bersih dari template bps_e2e_base (berisi 4 dataset BPS)
docker compose -f docker-compose.demo.yml exec -T postgres psql -U bps_user -d postgres -c "DROP DATABASE IF EXISTS bps_e2e WITH (FORCE)" -c "CREATE DATABASE bps_e2e TEMPLATE bps_e2e_base"
docker start bps-e2e-model   # Model Service uji, port 8200, membaca bps_e2e
$env:DATABASE_URL="postgresql://bps_user:bps_password@localhost:5433/bps_e2e"; $env:MODEL_SERVICE_URL="http://localhost:8200"; $env:MATCHING_PROVIDER="model_service"; npx next start -p 3200
# terminal lain:
node scripts/e2e-demo.mjs
```

## Troubleshooting

| Gejala | Penyebab / solusi |
|---|---|
| Login berhasil (HTTP 200) tetapi kembali ke halaman login | Cookie `Secure` di HTTP: kosongkan `SESSION_COOKIE_SECURE`, pastikan `NEXTAUTH_URL` diawali `http://` |
| Semua pengguna logout setelah restart | `NEXTAUTH_SECRET` belum diisi |
| Pencocokan gagal | Model Service belum berjalan atau `MODEL_SERVICE_URL` / `DATABASE_URL` Model Service salah; cek `GET http://localhost:8000/health` |
| `relation "users" already exists` saat migrate | DB lama dibuat dengan `db:push`; reset volume: `docker compose down -v`, lalu migrate + seed |
| Port terpakai | `npm run dev -- -p 3001` |
| Unggah ditolak "Unsupported dataset type" | Gunakan tipe `DATASET_A`–`DATASET_D` (dropdown form unggah) |

## Keamanan dan data

- **Jangan commit** dataset asli BPS, `.env*` (kecuali `.env.example`), dump basis data, atau berkas unggahan. Folder `datasets/` dan workspace laporan di-ignore.
- Dataset asli bersifat terbatas: gunakan nama generik (Dataset A–D) di dokumentasi publik dan data sintetis untuk demonstrasi atau tangkapan layar.
- Endpoint `POST /api/dev/seed` hanya aktif saat `NODE_ENV=development`.

Dokumentasi tambahan: `DEVELOPMENT.md`, `docs/`.
