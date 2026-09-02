/**
 * Dataset Schema Constants
 * Define the required common schema for all four BPS dataset sources
 * Used for validation and UI reference without accessing actual sensitive records
 */

export interface DatasetFieldDefinition {
  fieldName: string;
  type: string;
  required: boolean;
  description: string;
}

export const DATASET_REQUIRED_FIELDS: DatasetFieldDefinition[] = [
  { fieldName: 'idsbr', type: 'String', required: true, description: 'Primary Key / ID untuk data dari dataset' },
  { fieldName: 'nama_usaha', type: 'String', required: true, description: 'Nama usaha yang didatakan' },
  { fieldName: 'alamat_usaha', type: 'String', required: true, description: 'Alamat usaha yang didatakan' },
  { fieldName: 'kode_wilayah', type: 'String', required: true, description: 'Kode wilayah usaha' },
  { fieldName: 'kdprov', type: 'String', required: true, description: 'Kode provinsi' },
  { fieldName: 'kdkab', type: 'String', required: true, description: 'Kode kabupaten' },
  { fieldName: 'kdkec', type: 'String', required: true, description: 'Kode kecamatan' },
  { fieldName: 'kddesa', type: 'String', required: true, description: 'Kode desa' },
  { fieldName: 'nmprov', type: 'String', required: true, description: 'Nama provinsi' },
  { fieldName: 'nmkab', type: 'String', required: true, description: 'Nama kabupaten' },
  { fieldName: 'nmkec', type: 'String', required: true, description: 'Nama kecamatan' },
  { fieldName: 'nmdesa', type: 'String', required: true, description: 'Nama desa' },
  { fieldName: 'perusahaan_id', type: 'String', required: true, description: 'ID perusahaan' },
  { fieldName: 'status_perusahaan', type: 'String', required: true, description: 'Status keaktifan perusahaan' },
  { fieldName: 'history_ref_profiling_id', type: 'Date', required: true, description: 'Tanggal history profiling' },
  { fieldName: 'sumber_data', type: 'String', required: true, description: 'Sumber data' },
  { fieldName: 'latitude', type: 'Float', required: true, description: 'Titik latitude usaha' },
  { fieldName: 'longitude', type: 'Float', required: true, description: 'Titik longitude usaha' },
  { fieldName: 'latlong_status', type: 'String', required: true, description: 'Status validitas latitude dan longitude' },
  { fieldName: 'gcid', type: 'String', required: true, description: 'ID tindakan ground check' },
  { fieldName: 'gcs_result', type: 'Float', required: true, description: 'Skala hasil ground check' },
  { fieldName: 'allow_cancel', type: 'Boolean', required: true, description: 'Status diperbolehkan pembatalan' },
  { fieldName: 'allow_edit', type: 'Boolean', required: true, description: 'Status diperbolehkan edit' },
  { fieldName: 'allow_flagging', type: 'Boolean', required: true, description: 'Status diperbolehkan flagging' },
  { fieldName: 'latitude_gc', type: 'Float', required: true, description: 'Latitude data ground check' },
  { fieldName: 'longitude_gc', type: 'Float', required: true, description: 'Longitude data ground check' },
  { fieldName: 'latlong_status_gc', type: 'String', required: true, description: 'Status validitas koordinat ground check' },
  { fieldName: 'gc_username', type: 'String', required: true, description: 'User yang melakukan ground check' },
];

export const DATASET_OPTIONAL_FIELDS: DatasetFieldDefinition[] = [
  { fieldName: 'skor_kalo', type: 'Unknown', required: false, description: 'Optional score field' },
  { fieldName: 'kegiatan_usaha', type: 'String', required: false, description: 'Rincian/deskripsi kegiatan usaha' },
  { fieldName: 'rank_nama', type: 'Unknown', required: false, description: 'Optional name ranking' },
  { fieldName: 'rank_alamat', type: 'Unknown', required: false, description: 'Optional address ranking' },
  { fieldName: 'skala_usaha', type: 'String', required: false, description: 'Deskripsi skala usaha' },
  { fieldName: 'nama_usaha_gc', type: 'String', required: false, description: 'Nama usaha berdasarkan ground check' },
  { fieldName: 'alamat_usaha_gc', type: 'String', required: false, description: 'Alamat usaha berdasarkan ground check' },
];

export const DATASET_SOURCES = [
  { id: 'DB_KENDEDES', label: 'DB Kendedes', description: 'Database Kendedes (CSV)' },
  { id: 'DIR_PAJAK', label: 'Dir Pajak', description: 'Direktori Pajak (CSV)' },
  { id: 'OSS_BADAN_USAHA', label: 'OSS – Badan Usaha', description: 'OSS Badan Usaha (CSV)' },
  { id: 'OSS_PERORANGAN', label: 'OSS – Perorangan', description: 'OSS Perorangan (CSV)' },
];

export const TOTAL_SCHEMA_FIELDS = DATASET_REQUIRED_FIELDS.length + DATASET_OPTIONAL_FIELDS.length;
