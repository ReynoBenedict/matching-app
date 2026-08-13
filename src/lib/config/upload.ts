/**
 * Upload configuration constants
 */

export const UPLOAD_CONFIG = {
  // Maximum file size: 50MB
  MAX_FILE_SIZE: 50 * 1024 * 1024,

  // Supported file extensions
  SUPPORTED_EXTENSIONS: ['csv'],

  // Supported MIME types
  SUPPORTED_MIME_TYPES: ['text/csv', 'application/csv'],

  // Dataset types that can be uploaded
  SUPPORTED_DATASET_TYPES: [
    'DB_KENDEDES',
    'DIR_PAJAK',
    'OSS_BADAN_USAHA',
    'OSS_PERORANGAN',
  ],

  // Maximum records per dataset for safety
  MAX_RECORDS_PER_DATASET: 1000000,
};

/**
 * Dataset contract field definitions
 * All 35 fields from Phase 3A specification
 */
export const DATASET_CONTRACT = {
  REQUIRED_FIELDS: [
    'idsbr',
    'nama_usaha',
    'alamat_usaha',
    'kode_wilayah',
    'kdprov',
    'kdkab',
    'kdkec',
    'kddesa',
    'nmprov',
    'nmkab',
    'nmkec',
    'nmdesa',
    'perusahaan_id',
    'status_perusahaan',
    'history_ref_profiling_id',
    'sumber_data',
    'latitude',
    'longitude',
    'latlong_status',
    'gcid',
    'gcs_result',
    'allow_cancel',
    'allow_edit',
    'allow_flagging',
    'latitude_gc',
    'longitude_gc',
    'latlong_status_gc',
    'gc_username',
  ],

  OPTIONAL_FIELDS: [
    'skor_kalo',
    'kegiatan_usaha',
    'rank_nama',
    'rank_alamat',
    'skala_usaha',
    'nama_usaha_gc',
    'alamat_usaha_gc',
  ],

  FIELD_TYPES: {
    // String fields
    idsbr: 'string',
    nama_usaha: 'string',
    alamat_usaha: 'string',
    kode_wilayah: 'string',
    kdprov: 'string',
    kdkab: 'string',
    kdkec: 'string',
    kddesa: 'string',
    nmprov: 'string',
    nmkab: 'string',
    nmkec: 'string',
    nmdesa: 'string',
    perusahaan_id: 'string',
    status_perusahaan: 'string',
    sumber_data: 'string',
    latlong_status: 'string',
    latlong_status_gc: 'string',
    gcid: 'string',
    gc_username: 'string',
    skala_usaha: 'string',
    kegiatan_usaha: 'string',
    skor_kalo: 'string',
    rank_nama: 'string',
    rank_alamat: 'string',
    nama_usaha_gc: 'string',
    alamat_usaha_gc: 'string',

    // Numeric fields
    latitude: 'float',
    longitude: 'float',
    gcs_result: 'float',
    latitude_gc: 'float',
    longitude_gc: 'float',

    // Boolean fields
    allow_cancel: 'boolean',
    allow_edit: 'boolean',
    allow_flagging: 'boolean',

    // Date fields
    history_ref_profiling_id: 'date',
  } as const,
};
