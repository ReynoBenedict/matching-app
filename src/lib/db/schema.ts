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
