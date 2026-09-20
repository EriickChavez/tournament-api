-- ============================================================
-- Tournament API — Full schema (English)
-- Generated from current Drizzle schemas
-- ============================================================

-- * Users
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL UNIQUE,
	"password_hash" varchar(255) NOT NULL,
	"display_name" varchar(120) NOT NULL,
	"avatar_url" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "sessions" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Super admins
CREATE TABLE IF NOT EXISTS "super_admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL UNIQUE,
	"password_hash" varchar(255) NOT NULL,
	"display_name" varchar(120) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "super_admin_sessions" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"super_admin_id" uuid NOT NULL REFERENCES "super_admins"("id") ON DELETE CASCADE,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- * Roles
CREATE TABLE IF NOT EXISTS "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(60) NOT NULL UNIQUE,
	"description" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- * Tournaments
CREATE TABLE IF NOT EXISTS "tournaments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"subtitle" varchar(255),
	"description" text,
	"slug" varchar(220) NOT NULL UNIQUE,
	"start_date" date,
	"end_date" date,
	"timezone" varchar(60) DEFAULT 'America/Mexico_City' NOT NULL,
	"max_sponsors" integer DEFAULT 0 NOT NULL,
	"created_by_user_id" uuid REFERENCES "users"("id"),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by_user_id" uuid REFERENCES "users"("id"),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- * Tournament members
CREATE TABLE IF NOT EXISTS "tournament_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL REFERENCES "tournaments"("id"),
	"user_id" uuid NOT NULL REFERENCES "users"("id"),
	"role_id" uuid NOT NULL REFERENCES "roles"("id"),
	"status" varchar(30) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- * Categories
CREATE TABLE IF NOT EXISTS "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL REFERENCES "tournaments"("id") ON DELETE CASCADE,
	"title" varchar(200) NOT NULL,
	"min_age" integer,
	"max_age" integer,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_user_id" uuid REFERENCES "users"("id"),
	"updated_by_user_id" uuid REFERENCES "users"("id")
);

-- * Teams
CREATE TABLE IF NOT EXISTS "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL REFERENCES "tournaments"("id") ON DELETE CASCADE,
	"category_id" uuid NOT NULL REFERENCES "categories"("id"),
	"name" varchar(200) NOT NULL,
	"abbreviation" varchar(50),
	"logo_url" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_teams_tournament_name" UNIQUE ("tournament_id", "name")
);

-- * Players
CREATE TABLE IF NOT EXISTS "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL REFERENCES "tournaments"("id") ON DELETE CASCADE,
	"category_id" uuid NOT NULL REFERENCES "categories"("id"),
	"first_name" varchar(120) NOT NULL,
	"last_name" varchar(120) NOT NULL,
	"birth_date" date,
	"number" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- * Team ↔ Player (many-to-many)
CREATE TABLE IF NOT EXISTS "team_players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL REFERENCES "tournaments"("id") ON DELETE CASCADE,
	"team_id" uuid NOT NULL REFERENCES "teams"("id") ON DELETE CASCADE,
	"player_id" uuid NOT NULL REFERENCES "players"("id") ON DELETE CASCADE,
	"role" varchar(50),
	"is_captain" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_user_id" uuid REFERENCES "users"("id"),
	"updated_by_user_id" uuid REFERENCES "users"("id")
);

-- * Matches
CREATE TABLE IF NOT EXISTS "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL REFERENCES "tournaments"("id") ON DELETE CASCADE,
	"category_id" uuid NOT NULL REFERENCES "categories"("id"),
	"home_team_id" uuid NOT NULL REFERENCES "teams"("id"),
	"away_team_id" uuid NOT NULL REFERENCES "teams"("id"),
	"scheduled_at" timestamp with time zone NOT NULL,
	"venue" varchar(200),
	"status" varchar(30) DEFAULT 'scheduled' NOT NULL,
	"created_by_user_id" uuid REFERENCES "users"("id"),
	"updated_by_user_id" uuid REFERENCES "users"("id"),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- * Match events
CREATE TABLE IF NOT EXISTS "match_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL REFERENCES "tournaments"("id") ON DELETE CASCADE,
	"category_id" uuid NOT NULL REFERENCES "categories"("id"),
	"match_id" uuid NOT NULL REFERENCES "matches"("id") ON DELETE CASCADE,
	"event_type" varchar(30) NOT NULL,
	"minute" integer,
	"team_id" uuid NOT NULL REFERENCES "teams"("id"),
	"player_id" uuid REFERENCES "players"("id"),
	"assisted_by_player_id" uuid REFERENCES "players"("id"),
	"description" varchar(255),
	"created_by_user_id" uuid REFERENCES "users"("id"),
	"updated_by_user_id" uuid REFERENCES "users"("id"),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- * Standings
CREATE TABLE IF NOT EXISTS "team_standings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL REFERENCES "tournaments"("id") ON DELETE CASCADE,
	"category_id" uuid NOT NULL REFERENCES "categories"("id"),
	"team_id" uuid NOT NULL REFERENCES "teams"("id"),
	"played" integer DEFAULT 0 NOT NULL,
	"won" integer DEFAULT 0 NOT NULL,
	"drawn" integer DEFAULT 0 NOT NULL,
	"lost" integer DEFAULT 0 NOT NULL,
	"goals_for" integer DEFAULT 0 NOT NULL,
	"goals_against" integer DEFAULT 0 NOT NULL,
	"goal_difference" integer DEFAULT 0 NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"rank" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_team_standings" UNIQUE ("tournament_id", "category_id", "team_id")
);

-- * Topscorers
CREATE TABLE IF NOT EXISTS "top_scorers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL REFERENCES "tournaments"("id") ON DELETE CASCADE,
	"category_id" uuid NOT NULL REFERENCES "categories"("id"),
	"player_id" uuid NOT NULL REFERENCES "players"("id"),
	"goals" integer DEFAULT 0 NOT NULL,
	"assists" integer DEFAULT 0 NOT NULL,
	"rank" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_top_scorers" UNIQUE ("tournament_id", "category_id", "player_id")
);
-- * card_counts
CREATE TABLE IF NOT EXISTS "card_counts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL REFERENCES "tournaments"("id") ON DELETE CASCADE,
	"category_id" uuid NOT NULL REFERENCES "categories"("id"),
	"player_id" uuid NOT NULL REFERENCES "players"("id"),
	"yellow_cards" integer DEFAULT 0 NOT NULL,
	"red_cards" integer DEFAULT 0 NOT NULL,
	"rank" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_card_counts" UNIQUE ("tournament_id", "category_id", "player_id")
);

-- * Branding
CREATE TABLE IF NOT EXISTS "tournament_branding" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL UNIQUE REFERENCES "tournaments"("id") ON DELETE CASCADE,
	"logo_url" varchar(512),
	"banner_url" varchar(512),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_user_id" uuid REFERENCES "users"("id"),
	"updated_by_user_id" uuid REFERENCES "users"("id")
);

-- * App sponsors (global)
CREATE TABLE IF NOT EXISTS "app_sponsors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" varchar(500) NOT NULL,
	"logo_url" varchar(512) NOT NULL,
	"logo_storage_key" varchar(512),
	"website_url" varchar(512),
	"pdf_url" varchar(512),
	"pdf_storage_key" varchar(512),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"start_date" date,
	"end_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_admin_id" uuid REFERENCES "super_admins"("id"),
	"updated_by_admin_id" uuid REFERENCES "super_admins"("id")
);

-- Tournament sponsors
CREATE TABLE IF NOT EXISTS "tournament_sponsors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL REFERENCES "tournaments"("id") ON DELETE CASCADE,
	"name" varchar(200) NOT NULL,
	"description" varchar(500) NOT NULL,
	"logo_url" varchar(512) NOT NULL,
	"logo_storage_key" varchar(512),
	"website_url" varchar(512),
	"pdf_url" varchar(512),
	"pdf_storage_key" varchar(512),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"start_date" date,
	"end_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_user_id" uuid REFERENCES "users"("id"),
	"updated_by_user_id" uuid REFERENCES "users"("id")
);

-- ============================================================
-- Indexes optimized for 10k+ users / multi-tenant load
-- ============================================================

-- Auth / Sessions
CREATE INDEX IF NOT EXISTS "idx_sessions_user_id" ON "sessions" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_sessions_expires_at" ON "sessions" ("expires_at");

CREATE INDEX IF NOT EXISTS "idx_super_admin_sessions_admin_id" ON "super_admin_sessions" ("super_admin_id");
CREATE INDEX IF NOT EXISTS "idx_super_admin_sessions_expires_at" ON "super_admin_sessions" ("expires_at");

-- Users (email uniqueness already covered by unique + lower index)
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_lower_unique" ON "users" (LOWER("email"));

-- Tournament members (very frequent lookups)
CREATE INDEX IF NOT EXISTS "idx_tournament_members_tournament" ON "tournament_members" ("tournament_id");
CREATE INDEX IF NOT EXISTS "idx_tournament_members_user" ON "tournament_members" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_tournament_members_role" ON "tournament_members" ("role_id");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_tournament_members_tournament_user" 
    ON "tournament_members" ("tournament_id", "user_id");

-- Categories
CREATE INDEX IF NOT EXISTS "idx_categories_tournament" ON "categories" ("tournament_id");
CREATE INDEX IF NOT EXISTS "idx_categories_tournament_order" ON "categories" ("tournament_id", "sort_order");

-- Teams
CREATE INDEX IF NOT EXISTS "idx_teams_tournament" ON "teams" ("tournament_id");
CREATE INDEX IF NOT EXISTS "idx_teams_category" ON "teams" ("category_id");
CREATE INDEX IF NOT EXISTS "idx_teams_tournament_category" ON "teams" ("tournament_id", "category_id");

-- Players
CREATE INDEX IF NOT EXISTS "idx_players_tournament" ON "players" ("tournament_id");
CREATE INDEX IF NOT EXISTS "idx_players_category" ON "players" ("category_id");
CREATE INDEX IF NOT EXISTS "idx_players_tournament_category" ON "players" ("tournament_id", "category_id");

-- Team ↔ Player
CREATE INDEX IF NOT EXISTS "idx_team_players_team" ON "team_players" ("team_id");
CREATE INDEX IF NOT EXISTS "idx_team_players_player" ON "team_players" ("player_id");
CREATE INDEX IF NOT EXISTS "idx_team_players_tournament" ON "team_players" ("tournament_id");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_team_players_team_player" 
    ON "team_players" ("team_id", "player_id");

-- Matches (high traffic: calendars, filters by status/date)
CREATE INDEX IF NOT EXISTS "idx_matches_tournament" ON "matches" ("tournament_id");
CREATE INDEX IF NOT EXISTS "idx_matches_category" ON "matches" ("category_id");
CREATE INDEX IF NOT EXISTS "idx_matches_tournament_category" ON "matches" ("tournament_id", "category_id");
CREATE INDEX IF NOT EXISTS "idx_matches_scheduled_at" ON "matches" ("scheduled_at");
CREATE INDEX IF NOT EXISTS "idx_matches_status" ON "matches" ("status");
CREATE INDEX IF NOT EXISTS "idx_matches_home_team" ON "matches" ("home_team_id");
CREATE INDEX IF NOT EXISTS "idx_matches_away_team" ON "matches" ("away_team_id");
CREATE INDEX IF NOT EXISTS "idx_matches_tournament_scheduled" 
    ON "matches" ("tournament_id", "scheduled_at");

-- Match events
CREATE INDEX IF NOT EXISTS "idx_match_events_match" ON "match_events" ("match_id");
CREATE INDEX IF NOT EXISTS "idx_match_events_tournament" ON "match_events" ("tournament_id");
CREATE INDEX IF NOT EXISTS "idx_match_events_player" ON "match_events" ("player_id");
CREATE INDEX IF NOT EXISTS "idx_match_events_team" ON "match_events" ("team_id");
CREATE INDEX IF NOT EXISTS "idx_match_events_type" ON "match_events" ("event_type");

-- Standings (read-heavy)
CREATE INDEX IF NOT EXISTS "idx_team_standings_tournament_category" 
    ON "team_standings" ("tournament_id", "category_id");
CREATE INDEX IF NOT EXISTS "idx_team_standings_rank" 
    ON "team_standings" ("tournament_id", "category_id", "rank");

CREATE INDEX IF NOT EXISTS "idx_top_scorers_tournament_category" 
    ON "top_scorers" ("tournament_id", "category_id");
CREATE INDEX IF NOT EXISTS "idx_top_scorers_rank" 
    ON "top_scorers" ("tournament_id", "category_id", "rank");

CREATE INDEX IF NOT EXISTS "idx_card_counts_tournament_category" 
    ON "card_counts" ("tournament_id", "category_id");

-- Branding
CREATE INDEX IF NOT EXISTS "idx_tournament_branding_tournament" ON "tournament_branding" ("tournament_id");

-- Sponsors
CREATE INDEX IF NOT EXISTS "idx_app_sponsors_active_order" 
    ON "app_sponsors" ("is_active", "sort_order");
CREATE INDEX IF NOT EXISTS "idx_tournament_sponsors_tournament" 
    ON "tournament_sponsors" ("tournament_id");
CREATE INDEX IF NOT EXISTS "idx_tournament_sponsors_active_order" 
    ON "tournament_sponsors" ("tournament_id", "is_active", "sort_order");