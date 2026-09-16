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
    // Original row preserved so flexible CSV schemas can be matched without
    // forcing every upload into the legacy 35-column schema.
    rawData: jsonb('raw_data').notNull().default({}),
    // Only stable identifiers are required. Legacy fields are nullable because
    // uploads may use arbitrary schemas; the complete source row lives in rawData.
    idsbr: text('idsbr').notNull(),
    namaUsaha: text('nama_usaha'),
    alamatUsaha: text('alamat_usaha'),
    kodeWilayah: text('kode_wilayah'),
    kdprov: text('kdprov'),
    kdkab: text('kdkab'),
    kdkec: text('kdkec'),
    kddesa: text('kddesa'),
    nmprov: text('nmprov'),
    nmkab: text('nmkab'),
    nmkec: text('nmkec'),
    nmdesa: text('nmdesa'),
    perusahaanId: text('perusahaan_id'),
    statusPerusahaan: text('status_perusahaan'),
    skorKalo: text('skor_kalo'),
    kegiatanUsaha: text('kegiatan_usaha'),
    rankNama: text('rank_nama'),
    rankAlamat: text('rank_alamat'),
    historyRefProfilingId: timestamp('history_ref_profiling_id', {
      withTimezone: true,
    }),
    skalaUsaha: text('skala_usaha'),
    sumberData: text('sumber_data'),
    latitude: numeric('latitude'),
    longitude: numeric('longitude'),
    latlongStatus: text('latlong_status'),
    gcid: text('gcid'),
    gcsResult: numeric('gcs_result'),
    allowCancel: boolean('allow_cancel'),
    allowEdit: boolean('allow_edit'),
    allowFlagging: boolean('allow_flagging'),
    latitudeGc: numeric('latitude_gc'),
    longitudeGc: numeric('longitude_gc'),
    latlongStatusGc: text('latlong_status_gc'),
    gcUsername: text('gc_username'),
    namaUsahaGc: text('nama_usaha_gc'),
    alamatUsahaGc: text('alamat_usaha_gc'),
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


/** Persisted matching runs and candidates. */
export const matchingRuns = pgTable(
  'matching_runs',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    datasetAId: integer('dataset_a_id').notNull(),
    datasetBId: integer('dataset_b_id').notNull(),
    threshold: numeric('threshold', { precision: 5, scale: 4 }).notNull(),
    columnMappings: jsonb('column_mappings').notNull(),
    status: varchar('status', { length: 30 }).notNull().default('COMPLETED'),
    createdBy: integer('created_by').notNull(),
    totalCandidates: integer('total_candidates').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [
    foreignKey({
      columns: [table.datasetAId],
      foreignColumns: [datasets.id],
      name: 'matching_runs_dataset_a_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.datasetBId],
      foreignColumns: [datasets.id],
      name: 'matching_runs_dataset_b_fk',
    }).onDelete('cascade'),
    index('matching_runs_dataset_pair_idx').on(table.datasetAId, table.datasetBId),
    index('matching_runs_created_at_idx').on(table.createdAt),
  ]
);

export const matchingCandidates = pgTable(
  'matching_candidates',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    matchingRunId: integer('matching_run_id').notNull(),
    recordAId: integer('record_a_id').notNull(),
    recordBId: integer('record_b_id').notNull(),
    idsbrA: text('idsbr_a').notNull(),
    idsbrB: text('idsbr_b').notNull(),
    overallScore: numeric('overall_score').notNull(),
    tfidfSimilarity: numeric('tfidf_similarity'),
    faissSimilarity: numeric('faiss_similarity'),
    rapidfuzzSimilarity: numeric('rapidfuzz_similarity'),
    fieldScores: jsonb('field_scores').notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    foreignKey({ columns: [table.matchingRunId], foreignColumns: [matchingRuns.id], name: 'matching_candidates_run_fk' }).onDelete('cascade'),
    foreignKey({ columns: [table.recordAId], foreignColumns: [datasetRecords.id], name: 'matching_candidates_record_a_fk' }).onDelete('cascade'),
    foreignKey({ columns: [table.recordBId], foreignColumns: [datasetRecords.id], name: 'matching_candidates_record_b_fk' }).onDelete('cascade'),
    index('matching_candidates_run_idx').on(table.matchingRunId),
    index('matching_candidates_pair_idx').on(table.recordAId, table.recordBId),
    unique('matching_candidates_run_pair_unique').on(table.matchingRunId, table.recordAId, table.recordBId),
  ]
);

/**
 * Assignment status enum
 * Represents the lifecycle of an assignment to an employee
 */
export const assignmentStatusEnum = pgEnum('assignment_status', [
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
]);

/**
 * Verification result enum
 * Represents the employee's verification decision (MATCH or NON-MATCH)
 * Phase 5C: Added for employee labeling workflow
 */
export const verificationResultEnum = pgEnum('verification_result', [
  'MATCH',
  'NON_MATCH',
  'REVIEW',
]);

/**
 * Assignments table
 * Represents assignments of matching candidates to employees for verification
 * Each assignment links a matching candidate pair to an employee
 */
export const assignments = pgTable(
  'assignments',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    matchingRunId: integer('matching_run_id'),
    recordAId: integer('record_a_id').notNull(),
    recordBId: integer('record_b_id').notNull(),
    employeeId: integer('employee_id').notNull(),
    similarityScore: numeric('similarity_score', { precision: 5, scale: 4 }).notNull(),
    status: assignmentStatusEnum('status').notNull().default('PENDING'),
    createdBy: integer('created_by').notNull(),
    // Phase 5C: Employee verification fields
    verificationResult: verificationResultEnum('verification_result'),
    verificationNote: text('verification_note'),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    verifiedBy: integer('verified_by'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.matchingRunId],
      foreignColumns: [matchingRuns.id],
      name: 'assignments_matching_run_id_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.recordAId],
      foreignColumns: [datasetRecords.id],
      name: 'assignments_record_a_id_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.recordBId],
      foreignColumns: [datasetRecords.id],
      name: 'assignments_record_b_id_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.employeeId],
      foreignColumns: [users.id],
      name: 'assignments_employee_id_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: 'assignments_created_by_fk',
    }).onDelete('set null'),
    // Phase 5C: Verified by foreign key
    foreignKey({
      columns: [table.verifiedBy],
      foreignColumns: [users.id],
      name: 'assignments_verified_by_fk',
    }).onDelete('set null'),
    index('assignments_matching_run_id_idx').on(table.matchingRunId),
    index('assignments_employee_id_idx').on(table.employeeId),
    index('assignments_status_idx').on(table.status),
    index('assignments_created_at_idx').on(table.createdAt),
    index('assignments_verification_result_idx').on(table.verificationResult),
    unique('assignments_record_pair_unique').on(
      table.recordAId,
      table.recordBId
    ),
  ]
);
