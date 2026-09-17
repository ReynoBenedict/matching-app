CREATE TYPE "public"."assignment_status" AS ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."dataset_status" AS ENUM('UPLOADING', 'VALIDATING', 'READY', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."verification_result" AS ENUM('MATCH', 'NON_MATCH', 'REVIEW');--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "assignments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"matching_run_id" integer,
	"record_a_id" integer NOT NULL,
	"record_b_id" integer NOT NULL,
	"employee_id" integer NOT NULL,
	"similarity_score" numeric(5, 4) NOT NULL,
	"status" "assignment_status" DEFAULT 'PENDING' NOT NULL,
	"created_by" integer NOT NULL,
	"verification_result" "verification_result",
	"verification_note" text,
	"verified_at" timestamp with time zone,
	"verified_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assignments_record_pair_unique" UNIQUE("record_a_id","record_b_id")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audit_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(100),
	"entity_id" integer,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dataset_columns" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "dataset_columns_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"dataset_id" integer NOT NULL,
	"column_name" varchar(100) NOT NULL,
	"data_type" varchar(50) NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"is_primary_key" boolean DEFAULT false NOT NULL,
	"column_order" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dataset_columns_dataset_id_column_name_unique" UNIQUE("dataset_id","column_name")
);
--> statement-breakpoint
CREATE TABLE "dataset_records" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "dataset_records_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"dataset_id" integer NOT NULL,
	"raw_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"idsbr" text NOT NULL,
	"nama_usaha" text,
	"alamat_usaha" text,
	"kode_wilayah" text,
	"kdprov" text,
	"kdkab" text,
	"kdkec" text,
	"kddesa" text,
	"nmprov" text,
	"nmkab" text,
	"nmkec" text,
	"nmdesa" text,
	"perusahaan_id" text,
	"status_perusahaan" text,
	"skor_kalo" text,
	"kegiatan_usaha" text,
	"rank_nama" text,
	"rank_alamat" text,
	"history_ref_profiling_id" timestamp with time zone,
	"skala_usaha" text,
	"sumber_data" text,
	"latitude" numeric,
	"longitude" numeric,
	"latlong_status" text,
	"gcid" text,
	"gcs_result" numeric,
	"allow_cancel" boolean,
	"allow_edit" boolean,
	"allow_flagging" boolean,
	"latitude_gc" numeric,
	"longitude_gc" numeric,
	"latlong_status_gc" text,
	"gc_username" text,
	"nama_usaha_gc" text,
	"alamat_usaha_gc" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dataset_records_dataset_id_idsbr_unique" UNIQUE("dataset_id","idsbr")
);
--> statement-breakpoint
CREATE TABLE "datasets" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "datasets_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"dataset_type" varchar(100) NOT NULL,
	"original_file_name" varchar(255),
	"source" varchar(255) NOT NULL,
	"status" "dataset_status" DEFAULT 'UPLOADING' NOT NULL,
	"uploaded_by" integer NOT NULL,
	"total_records" integer DEFAULT 0,
	"valid_records" integer DEFAULT 0,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matching_candidates" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "matching_candidates_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"matching_run_id" integer NOT NULL,
	"record_a_id" integer NOT NULL,
	"record_b_id" integer NOT NULL,
	"idsbr_a" text NOT NULL,
	"idsbr_b" text NOT NULL,
	"overall_score" numeric NOT NULL,
	"tfidf_similarity" numeric,
	"faiss_similarity" numeric,
	"rapidfuzz_similarity" numeric,
	"field_scores" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "matching_candidates_run_pair_unique" UNIQUE("matching_run_id","record_a_id","record_b_id")
);
--> statement-breakpoint
CREATE TABLE "matching_runs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "matching_runs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"dataset_a_id" integer NOT NULL,
	"dataset_b_id" integer NOT NULL,
	"threshold" numeric(5, 4) NOT NULL,
	"column_mappings" jsonb NOT NULL,
	"status" varchar(30) DEFAULT 'COMPLETED' NOT NULL,
	"created_by" integer NOT NULL,
	"total_candidates" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "registration_requests" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "registration_requests_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"full_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"username" varchar(100) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"requested_role" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"reviewed_by" integer,
	"reviewed_at" timestamp with time zone,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"full_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"username" varchar(100) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'EMPLOYEE' NOT NULL,
	"status" varchar(50) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_matching_run_id_fk" FOREIGN KEY ("matching_run_id") REFERENCES "public"."matching_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_record_a_id_fk" FOREIGN KEY ("record_a_id") REFERENCES "public"."dataset_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_record_b_id_fk" FOREIGN KEY ("record_b_id") REFERENCES "public"."dataset_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_employee_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_created_by_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_verified_by_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dataset_columns" ADD CONSTRAINT "dataset_columns_dataset_id_fk" FOREIGN KEY ("dataset_id") REFERENCES "public"."datasets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dataset_records" ADD CONSTRAINT "dataset_records_dataset_id_fk" FOREIGN KEY ("dataset_id") REFERENCES "public"."datasets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "datasets" ADD CONSTRAINT "datasets_uploaded_by_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matching_candidates" ADD CONSTRAINT "matching_candidates_run_fk" FOREIGN KEY ("matching_run_id") REFERENCES "public"."matching_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matching_candidates" ADD CONSTRAINT "matching_candidates_record_a_fk" FOREIGN KEY ("record_a_id") REFERENCES "public"."dataset_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matching_candidates" ADD CONSTRAINT "matching_candidates_record_b_fk" FOREIGN KEY ("record_b_id") REFERENCES "public"."dataset_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matching_runs" ADD CONSTRAINT "matching_runs_dataset_a_fk" FOREIGN KEY ("dataset_a_id") REFERENCES "public"."datasets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matching_runs" ADD CONSTRAINT "matching_runs_dataset_b_fk" FOREIGN KEY ("dataset_b_id") REFERENCES "public"."datasets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_requests" ADD CONSTRAINT "registration_requests_reviewed_by_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assignments_matching_run_id_idx" ON "assignments" USING btree ("matching_run_id");--> statement-breakpoint
CREATE INDEX "assignments_employee_id_idx" ON "assignments" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "assignments_status_idx" ON "assignments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "assignments_created_at_idx" ON "assignments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "assignments_verification_result_idx" ON "assignments" USING btree ("verification_result");--> statement-breakpoint
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "dataset_columns_dataset_id_idx" ON "dataset_columns" USING btree ("dataset_id");--> statement-breakpoint
CREATE INDEX "dataset_records_dataset_id_idx" ON "dataset_records" USING btree ("dataset_id");--> statement-breakpoint
CREATE INDEX "dataset_records_idsbr_idx" ON "dataset_records" USING btree ("idsbr");--> statement-breakpoint
CREATE INDEX "datasets_status_idx" ON "datasets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "datasets_uploaded_by_idx" ON "datasets" USING btree ("uploaded_by");--> statement-breakpoint
CREATE INDEX "datasets_created_at_idx" ON "datasets" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "datasets_dataset_type_idx" ON "datasets" USING btree ("dataset_type");--> statement-breakpoint
CREATE INDEX "matching_candidates_run_idx" ON "matching_candidates" USING btree ("matching_run_id");--> statement-breakpoint
CREATE INDEX "matching_candidates_pair_idx" ON "matching_candidates" USING btree ("record_a_id","record_b_id");--> statement-breakpoint
CREATE INDEX "matching_runs_dataset_pair_idx" ON "matching_runs" USING btree ("dataset_a_id","dataset_b_id");--> statement-breakpoint
CREATE INDEX "matching_runs_created_at_idx" ON "matching_runs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "registration_requests_status_idx" ON "registration_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "registration_requests_email_idx" ON "registration_requests" USING btree ("email");--> statement-breakpoint
CREATE INDEX "registration_requests_username_idx" ON "registration_requests" USING btree ("username");--> statement-breakpoint
CREATE INDEX "registration_requests_created_at_idx" ON "registration_requests" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "users_username_idx" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_status_idx" ON "users" USING btree ("status");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");