import {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  date,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// --- Enums ---

export const membershipRoleEnum = pgEnum("membership_role", ["owner", "member"]);

export const planEnum = pgEnum("plan", ["starter", "professional", "enterprise"]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "trialing",
  "past_due",
  "canceled",
  "incomplete",
]);

export const jobStatusEnum = pgEnum("job_status", ["draft", "published", "closed", "archived"]);

export const employmentTypeEnum = pgEnum("employment_type", [
  "full_time",
  "part_time",
  "contract",
  "internship",
]);

export const invitationStatusEnum = pgEnum("invitation_status", [
  "pending",
  "opened",
  "expired",
  "revoked",
]);

// A live interview session's lifecycle. "failed" covers dropped calls / connection errors —
// a live conversation can't be resumed mid-call the way async pre-recorded video could.
export const sessionStatusEnum = pgEnum("interview_session_status", [
  "not_started",
  "in_progress",
  "completed",
  "processing",
  "ready_for_review",
  "reviewed",
  "failed",
]);

export const decisionEnum = pgEnum("decision", ["none", "shortlisted", "maybe", "rejected"]);

export const processingJobTypeEnum = pgEnum("processing_job_type", [
  "generate_ai_report",
  "notify_employer_ready",
]);

export const processingJobStatusEnum = pgEnum("processing_job_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);

export const emailTypeEnum = pgEnum("email_type", [
  "candidate_invitation",
  "candidate_reminder",
  "employer_welcome",
  "password_reset",
  "employer_review_ready",
  "team_invitation",
]);

export const emailStatusEnum = pgEnum("email_status", ["queued", "sent", "delivered", "failed"]);

export const teamInvitationStatusEnum = pgEnum("team_invitation_status", [
  "pending",
  "accepted",
  "revoked",
  "expired",
]);

// --- Organizations & users ---

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  isPlatformAdmin: boolean("is_platform_admin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: membershipRoleEnum("role").notNull().default("member"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("memberships_org_user_unique").on(t.organizationId, t.userId)],
);

export const teamInvitations = pgTable(
  "team_invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: membershipRoleEnum("role").notNull().default("member"),
    tokenHash: text("token_hash").notNull().unique(),
    status: teamInvitationStatusEnum("status").notNull().default("pending"),
    invitedBy: uuid("invited_by").references(() => users.id, { onDelete: "set null" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("team_invitations_org_email_unique").on(t.organizationId, t.email)],
);

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- Jobs & AI interview configs ---

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    department: text("department"),
    location: text("location"),
    employmentType: employmentTypeEnum("employment_type"),
    // Free-text seniority label (e.g. "Entry-level", "Senior") — deliberately not an enum,
    // roles vary too much across employers to force a fixed ladder.
    seniorityLevel: text("seniority_level"),
    // Job description / requirements / interview context the employer provides — this is
    // what the AI uses to generate the interview structure, not shown to candidates verbatim.
    context: text("context"),
    // What the candidate actually reads on the intro screen before starting.
    candidateInstructions: text("candidate_instructions"),
    cameraRequired: boolean("camera_required").notNull().default(true),
    status: jobStatusEnum("status").notNull().default("draft"),
    // Hard ceiling on live interview length — a technical backstop alongside the prompt-level
    // instruction to keep the AI interview short and focused.
    maxDurationMinutes: integer("max_duration_minutes").notNull().default(20),
    deadlineAt: timestamp("deadline_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("jobs_org_status_idx").on(t.organizationId, t.status)],
);

type InterviewQuestionPlan = {
  topic: string;
  prompt: string;
  followUpGuidance?: string;
};

// The AI-generated interview structure for a job. One row per job, overwritten on regenerate —
// "reshuffle" is a fresh generation, not a version history.
export const aiInterviewConfigs = pgTable("ai_interview_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id")
    .notNull()
    .unique()
    .references(() => jobs.id, { onDelete: "cascade" }),
  interviewerRole: text("interviewer_role").notNull(),
  focusAreas: jsonb("focus_areas").$type<string[]>().notNull().default([]),
  questions: jsonb("questions").$type<InterviewQuestionPlan[]>().notNull().default([]),
  tone: text("tone").notNull(),
  openingLine: text("opening_line").notNull(),
  closingLine: text("closing_line").notNull(),
  followUpGuidance: text("follow_up_guidance").notNull(),
  avoidList: jsonb("avoid_list").$type<string[]>().notNull().default([]),
  // The optional note the employer typed the last time they regenerated ("more scenario-based", etc).
  guidanceNote: text("guidance_note"),
  model: text("model").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- Candidates & invitations ---

export const candidates = pgTable(
  "candidates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    name: text("name").notNull(),
    phone: text("phone"),
    // A synthetic identity used by "Preview Interview" so employers can test the live candidate
    // flow end-to-end. Excluded from every candidate-facing list, count, and usage metric.
    isPreview: boolean("is_preview").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("candidates_org_email_unique").on(t.organizationId, t.email)],
);

export const candidateInvitations = pgTable(
  "candidate_invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => candidates.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    status: invitationStatusEnum("status").notNull().default("pending"),
    invitedBy: uuid("invited_by").references(() => users.id, { onDelete: "set null" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("invitations_job_candidate_unique").on(t.jobId, t.candidateId),
    index("invitations_job_idx").on(t.jobId),
  ],
);

// --- Live interview sessions ---

export const interviewSessions = pgTable("interview_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  invitationId: uuid("invitation_id")
    .notNull()
    .unique()
    .references(() => candidateInvitations.id, { onDelete: "cascade" }),
  status: sessionStatusEnum("status").notNull().default("not_started"),
  // Correlates back to the ElevenLabs conversation for transcript/webhook lookups.
  elevenLabsConversationId: text("elevenlabs_conversation_id"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  failureReason: text("failure_reason"),
  decision: decisionEnum("decision").notNull().default("none"),
  decidedBy: uuid("decided_by").references(() => users.id, { onDelete: "set null" }),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// One recording per session — the candidate's webcam video captured client-side alongside
// the live voice conversation.
export const recordings = pgTable("recordings", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .unique()
    .references(() => interviewSessions.id, { onDelete: "cascade" }),
  storagePath: text("storage_path").notNull(),
  mimeType: text("mime_type").notNull(),
  durationSeconds: integer("duration_seconds"),
  sizeBytes: integer("size_bytes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

type TranscriptTurn = {
  role: "agent" | "candidate";
  text: string;
};

// One full-conversation transcript per session (not per question).
export const transcripts = pgTable("transcripts", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .unique()
    .references(() => interviewSessions.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  turns: jsonb("turns").$type<TranscriptTurn[]>(),
  provider: text("provider").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// The qualitative AI interview report — deliberately no numeric scores anywhere in this shape.
export const aiReports = pgTable("ai_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .unique()
    .references(() => interviewSessions.id, { onDelete: "cascade" }),
  summary: text("summary").notNull(),
  relevantExperience: jsonb("relevant_experience").$type<string[]>().notNull().default([]),
  strongSignals: jsonb("strong_signals").$type<string[]>().notNull().default([]),
  areasToReview: jsonb("areas_to_review").$type<string[]>().notNull().default([]),
  suggestedFollowUps: jsonb("suggested_follow_ups").$type<string[]>().notNull().default([]),
  model: text("model").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reviewNotes = pgTable("review_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => interviewSessions.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  note: text("note").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- Billing & usage ---

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .unique()
    .references(() => organizations.id, { onDelete: "cascade" }),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  plan: planEnum("plan").notNull().default("starter"),
  status: subscriptionStatusEnum("status").notNull().default("active"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const usageRecords = pgTable(
  "usage_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    periodStart: date("period_start").notNull(),
    interviewsCount: integer("interviews_count").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("usage_org_period_unique").on(t.organizationId, t.periodStart)],
);

// --- Operational tables ---

export const emailLog = pgTable("email_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, {
    onDelete: "set null",
  }),
  type: emailTypeEnum("type").notNull(),
  recipient: text("recipient").notNull(),
  providerId: text("provider_id"),
  status: emailStatusEnum("status").notNull().default("queued"),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const activityLog = pgTable(
  "activity_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("activity_org_created_idx").on(t.organizationId, t.createdAt)],
);

export const processingJobs = pgTable(
  "processing_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: processingJobTypeEnum("type").notNull(),
    payload: jsonb("payload").notNull(),
    status: processingJobStatusEnum("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(5),
    lastError: text("last_error"),
    runAfter: timestamp("run_after", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("processing_jobs_status_run_after_idx").on(t.status, t.runAfter)],
);
