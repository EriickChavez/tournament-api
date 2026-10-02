CREATE TABLE "phase_closures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phase_id" uuid NOT NULL,
	"qualifiers_per_group" integer NOT NULL,
	"best_next_count" integer NOT NULL,
	"closed_by_user_id" uuid,
	"closed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "phase_qualified_teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phase_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"phase_group_id" uuid,
	"position" integer NOT NULL,
	"via" varchar(20) NOT NULL,
	"points" integer NOT NULL,
	"goal_difference" integer NOT NULL,
	"goals_for" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "phase_closures" ADD CONSTRAINT "phase_closures_phase_id_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."phases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_closures" ADD CONSTRAINT "phase_closures_closed_by_user_id_users_id_fk" FOREIGN KEY ("closed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_qualified_teams" ADD CONSTRAINT "phase_qualified_teams_phase_id_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."phases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_qualified_teams" ADD CONSTRAINT "phase_qualified_teams_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_qualified_teams" ADD CONSTRAINT "phase_qualified_teams_phase_group_id_phase_groups_id_fk" FOREIGN KEY ("phase_group_id") REFERENCES "public"."phase_groups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "phase_closures_phase_uidx" ON "phase_closures" USING btree ("phase_id");--> statement-breakpoint
CREATE UNIQUE INDEX "phase_qualified_teams_phase_team_uidx" ON "phase_qualified_teams" USING btree ("phase_id","team_id");