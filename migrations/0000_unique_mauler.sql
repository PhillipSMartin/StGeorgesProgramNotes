CREATE TABLE "admin_credentials" (
	"id" serial PRIMARY KEY NOT NULL,
	"password_hash" text NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "archived_statistics" (
	"id" serial PRIMARY KEY NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"snapshot" jsonb NOT NULL,
	"total_count" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "content_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"content_id" integer NOT NULL,
	"section" text NOT NULL,
	"language" text NOT NULL,
	"content" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"source_type" text DEFAULT 'manual' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "program_content" (
	"id" serial PRIMARY KEY NOT NULL,
	"section" text NOT NULL,
	"language" text NOT NULL,
	"content" text NOT NULL,
	"order" integer DEFAULT 0,
	"published" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "program_footer" (
	"id" serial PRIMARY KEY NOT NULL,
	"language" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "program_footer_language_unique" UNIQUE("language")
);
--> statement-breakpoint
CREATE TABLE "program_intro" (
	"id" serial PRIMARY KEY NOT NULL,
	"language" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "program_intro_language_unique" UNIQUE("language")
);
--> statement-breakpoint
CREATE TABLE "program_pieces" (
	"id" serial PRIMARY KEY NOT NULL,
	"language" text NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"composer" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"piece_order" integer DEFAULT 0 NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "supported_languages" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"label" text NOT NULL,
	"native_label" text NOT NULL,
	"dir" text DEFAULT 'ltr' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"order" integer DEFAULT 0,
	CONSTRAINT "supported_languages_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "tracking_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");