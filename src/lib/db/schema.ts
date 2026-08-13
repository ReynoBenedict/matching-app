import {
  pgTable,
  integer,
  varchar,
  text,
  timestamp,
  jsonb,
  index,
  unique,
  foreignKey,
  numeric,
  boolean,
  pgEnum,
} from 'drizzle-orm/pg-core';

/**
 * Users table
 * Stores authenticated users in the system
 */
export const users = pgTable(
  'users',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    fullName: varchar('full_name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    username: varchar('username', { length: 100 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    role: varchar('role', { length: 50 }).notNull().default('EMPLOYEE'),
    status: varchar('status', { length: 50 }).notNull().default('ACTIVE'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique('users_email_unique').on(table.email),
    unique('users_username_unique').on(table.username),
    index('users_username_idx').on(table.username),
    index('users_email_idx').on(table.email),
    index('users_status_idx').on(table.status),
    index('users_role_idx').on(table.role),
  ]
);

/**
 * Registration requests table
 * Stores pending registration requests awaiting approval
 */
export const registrationRequests = pgTable(
  'registration_requests',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    fullName: varchar('full_name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    username: varchar('username', { length: 100 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    requestedRole: varchar('requested_role', { length: 50 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('PENDING'),
    reviewedBy: integer('reviewed_by'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    rejectionReason: text('rejection_reason'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('registration_requests_status_idx').on(table.status),
    index('registration_requests_email_idx').on(table.email),
    index('registration_requests_username_idx').on(table.username),
    index('registration_requests_created_at_idx').on(table.createdAt),
    foreignKey({
      columns: [table.reviewedBy],
      foreignColumns: [users.id],
      name: 'registration_requests_reviewed_by_fk',
    }).onDelete('set null'),
  ]
);

/**
 * Audit logs table
 * Tracks authentication and account-related events for compliance and debugging
 */
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer('user_id'),
    action: varchar('action', { length: 100 }).notNull(),
    entityType: varchar('entity_type', { length: 100 }),
    entityId: integer('entity_id'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('audit_logs_user_id_idx').on(table.userId),
    index('audit_logs_action_idx').on(table.action),
    index('audit_logs_created_at_idx').on(table.createdAt),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'audit_logs_user_id_fk',
    }).onDelete('set null'),
  ]
);

/**
 * Dataset status enum
 * Represents the lifecycle of a dataset through Phase 3 workflow
 */
export const datasetStatusEnum = pgEnum('dataset_status', [
  'UPLOADING',
  'VALIDATING',
  'READY',
  'FAILED',
]);

/**
 * Datasets table
 * Stores metadata about imported/uploaded datasets
 * One dataset instance represents one upload (e.g., one CSV file)
 * Can represent DB_KENDENDES, Dir Pajak, OSS Badan Usaha, or OSS Perorangan
 */
export const datasets = pgTable(
  'datasets',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar('name', { length: 255 }).notNull(),
    datasetType: varchar('dataset_type', { length: 100 }).notNull(),
    originalFileName: varchar('original_file_name', { length: 255 }),
    source: varchar('source', { length: 255 }).notNull(),
    status: datasetStatusEnum('status').notNull().default('UPLOADING'),
    uploadedBy: integer('uploaded_by').notNull(),
    totalRecords: integer('total_records').default(0),
    validRecords: integer('valid_records').default(0),
    failureReason: text('failure_reason'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.uploadedBy],
      foreignColumns: [users.id],
      name: 'datasets_uploaded_by_fk',
    }).onDelete('set null'),
    index('datasets_status_idx').on(table.status),
    index('datasets_uploaded_by_idx').on(table.uploadedBy),
    index('datasets_created_at_idx').on(table.createdAt),
    index('datasets_dataset_type_idx').on(table.datasetType),
  ]
);

/**
 * Dataset columns table
 * Represents the schema/metadata of columns in a dataset
 * Allows validation and type checking of incoming data
 */
export const datasetColumns = pgTable(
  'dataset_columns',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    datasetId: integer('dataset_id').notNull(),
    columnName: varchar('column_name', { length: 100 }).notNull(),
    dataType: varchar('data_type', { length: 50 }).notNull(),
    isRequired: boolean('is_required').notNull().default(true),
    isPrimaryKey: boolean('is_primary_key').notNull().default(false),
    columnOrder: integer('column_order'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.datasetId],
      foreignColumns: [datasets.id],
      name: 'dataset_columns_dataset_id_fk',
    }).onDelete('cascade'),
    index('dataset_columns_dataset_id_idx').on(table.datasetId),
    unique('dataset_columns_dataset_id_column_name_unique').on(
      table.datasetId,
      table.columnName
    ),
  ]
);

/**
 * Dataset records table
 * Stores actual data records from uploaded datasets
 * Each record belongs to exactly one dataset
 * Idsbr (from dataset contract) is unique within a dataset, not globally
 */
export const datasetRecords = pgTable(
  'dataset_records',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    datasetId: integer('dataset_id').notNull(),
    idsbr: varchar('idsbr', { length: 100 }).notNull(),
    namaUsaha: varchar('nama_usaha', { length: 500 }).notNull(),
    alamatUsaha: varchar('alamat_usaha', { length: 1000 }).notNull(),
    kodeWilayah: varchar('kode_wilayah', { length: 50 }).notNull(),
    kdprov: varchar('kdprov', { length: 50 }).notNull(),
    kdkab: varchar('kdkab', { length: 50 }).notNull(),
    kdkec: varchar('kdkec', { length: 50 }).notNull(),
    kddesa: varchar('kddesa', { length: 50 }).notNull(),
    nmprov: varchar('nmprov', { length: 255 }).notNull(),
    nmkab: varchar('nmkab', { length: 255 }).notNull(),
    nmkec: varchar('nmkec', { length: 255 }).notNull(),
    nmdesa: varchar('nmdesa', { length: 255 }).notNull(),
    perusahaanId: varchar('perusahaan_id', { length: 100 }).notNull(),
    statusPerusahaan: varchar('status_perusahaan', { length: 50 }).notNull(),
    skorKalo: text('skor_kalo'),
    kegiatanUsaha: text('kegiatan_usaha'),
    rankNama: text('rank_nama'),
    rankAlamat: text('rank_alamat'),
    historyRefProfilingId: timestamp('history_ref_profiling_id', {
      withTimezone: true,
    }).notNull(),
    skalaUsaha: varchar('skala_usaha', { length: 100 }),
    sumberData: varchar('sumber_data', { length: 255 }).notNull(),
    latitude: numeric('latitude', { precision: 10, scale: 8 }).notNull(),
    longitude: numeric('longitude', { precision: 11, scale: 8 }).notNull(),
    latlongStatus: varchar('latlong_status', { length: 100 }).notNull(),
    gcid: varchar('gcid', { length: 100 }).notNull(),
    gcsResult: numeric('gcs_result', { precision: 5, scale: 2 }).notNull(),
    allowCancel: boolean('allow_cancel').notNull(),
    allowEdit: boolean('allow_edit').notNull(),
    allowFlagging: boolean('allow_flagging').notNull(),
    latitudeGc: numeric('latitude_gc', { precision: 10, scale: 8 }).notNull(),
    longitudeGc: numeric('longitude_gc', { precision: 11, scale: 8 }).notNull(),
    latlongStatusGc: varchar('latlong_status_gc', { length: 100 }).notNull(),
    gcUsername: varchar('gc_username', { length: 100 }).notNull(),
    namaUsahaGc: varchar('nama_usaha_gc', { length: 500 }),
    alamatUsahaGc: varchar('alamat_usaha_gc', { length: 1000 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.datasetId],
      foreignColumns: [datasets.id],
      name: 'dataset_records_dataset_id_fk',
    }).onDelete('cascade'),
    index('dataset_records_dataset_id_idx').on(table.datasetId),
    index('dataset_records_idsbr_idx').on(table.idsbr),
    unique('dataset_records_dataset_id_idsbr_unique').on(
      table.datasetId,
      table.idsbr
    ),
  ]
);
