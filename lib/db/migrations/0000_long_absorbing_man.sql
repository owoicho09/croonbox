CREATE TYPE "public"."decision" AS ENUM('none', 'shortlisted', 'maybe', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."email_status" AS ENUM('queued', 'sent', 'delivered', 'failed');--> statement-breakpoint
CREATE TYPE "public"."email_type" AS ENUM('candidate_invitation', 'candidate_reminder', 'employer_verification', 'password_reset', 'employer_review_ready', 'team_invitation');--> statement-breakpoint
CREATE TYPE "public"."employment_type" AS ENUM('full_time', 'part_time', 'contract', 'internship');--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'opened', 'expired', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('draft', 'published', 'closed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."membership_role" AS ENUM('owner', 'member');--> statement-breakpoint
CREATE TYPE "public"."plan" AS ENUM('starter', 'professional', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."processing_job_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."processing_job_type" AS ENUM('generate_ai_report', 'notify_employer_ready');--> statement-breakpoint
CREATE TYPE "public"."interview_session_status" AS ENUM('not_started', 'in_progress', 'completed', 'processing', 'ready_for_review', 'reviewed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'trialing', 'past_due', 'canceled', 'incomplete');--> statement-breakpoint
CREATE TYPE "public"."team_invitation_status" AS ENUM('pending', 'accepted', 'revoked', 'expired');--> statement-breakpoint
CREATE TABLE "activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"actor_user_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_interview_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"interviewer_role" text NOT NULL,
	"focus_areas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"questions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tone" text NOT NULL,
	"opening_line" text NOT NULL,
	"closing_line" text NOT NULL,
	"follow_up_guidance" text NOT NULL,
	"avoid_list" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"guidance_note" text,
	"model" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_interview_configs_job_id_unique" UNIQUE("job_id")
);
--> statement-breakpoint
CREATE TABLE "ai_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"summary" text NOT NULL,
	"relevant_experience" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"strong_signals" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"areas_to_review" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"suggested_follow_ups" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"model" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_reports_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "candidate_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"status" "invitation_status" DEFAULT 'pending' NOT NULL,
	"invited_by" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "candidate_invitations_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"type" "email_type" NOT NULL,
	"recipient" text NOT NULL,
	"provider_id" text,
	"status" "email_status" DEFAULT 'queued' NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interview_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invitation_id" uuid NOT NULL,
	"status" "interview_session_status" DEFAULT 'not_started' NOT NULL,
	"elevenlabs_conversation_id" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"failure_reason" text,
	"decision" "decision" DEFAULT 'none' NOT NULL,
	"decided_by" uuid,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "interview_sessions_invitation_id_unique" UNIQUE("invitation_id")
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" text NOT NULL,
	"department" text,
	"location" text,
	"employment_type" "employment_type",
	"seniority_level" text,
	"context" text,
	"candidate_instructions" text,
	"camera_required" boolean DEFAULT true NOT NULL,
	"status" "job_status" DEFAULT 'draft' NOT NULL,
	"max_duration_minutes" integer DEFAULT 20 NOT NULL,
	"deadline_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "membership_role" DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "processing_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "processing_job_type" NOT NULL,
	"payload" jsonb NOT NULL,
	"status" "processing_job_status" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"last_error" text,
	"run_after" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recordings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"storage_path" text NOT NULL,
	"mime_type" text NOT NULL,
	"duration_seconds" integer,
	"size_bytes" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recordings_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "review_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"plan" "plan" DEFAULT 'starter' NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"current_period_end" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "team_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"email" text NOT NULL,
	"role" "membership_role" DEFAULT 'member' NOT NULL,
	"token_hash" text NOT NULL,
	"status" "team_invitation_status" DEFAULT 'pending' NOT NULL,
	"invited_by" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_invitations_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "transcripts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"text" text NOT NULL,
	"turns" jsonb,
	"provider" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transcripts_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "usage_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"period_start" date NOT NULL,
	"interviews_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"is_platform_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_interview_configs" ADD CONSTRAINT "ai_interview_configs_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_reports" ADD CONSTRAINT "ai_reports_session_id_interview_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."interview_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_invitations" ADD CONSTRAINT "candidate_invitations_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_invitations" ADD CONSTRAINT "candidate_invitations_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_invitations" ADD CONSTRAINT "candidate_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_invitation_id_candidate_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."candidate_invitations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recordings" ADD CONSTRAINT "recordings_session_id_interview_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."interview_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_notes" ADD CONSTRAINT "review_notes_session_id_interview_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."interview_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_notes" ADD CONSTRAINT "review_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invitations" ADD CONSTRAINT "team_invitations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invitations" ADD CONSTRAINT "team_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transcripts" ADD CONSTRAINT "transcripts_session_id_interview_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."interview_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_org_created_idx" ON "activity_log" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "invitations_job_candidate_unique" ON "candidate_invitations" USING btree ("job_id","candidate_id");--> statement-breakpoint
CREATE INDEX "invitations_job_idx" ON "candidate_invitations" USING btree ("job_id");--> statement-breakpoint
CREATE UNIQUE INDEX "candidates_org_email_unique" ON "candidates" USING btree ("organization_id","email");--> statement-breakpoint
CREATE INDEX "jobs_org_status_idx" ON "jobs" USING btree ("organization_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "memberships_org_user_unique" ON "memberships" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "processing_jobs_status_run_after_idx" ON "processing_jobs" USING btree ("status","run_after");--> statement-breakpoint
CREATE UNIQUE INDEX "team_invitations_org_email_unique" ON "team_invitations" USING btree ("organization_id","email");--> statement-breakpoint
CREATE UNIQUE INDEX "usage_org_period_unique" ON "usage_records" USING btree ("organization_id","period_start");