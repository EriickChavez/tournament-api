ALTER TABLE "phase_bracket_nodes" ADD COLUMN "legs" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "phase_bracket_nodes" ADD COLUMN "second_leg_match_id" uuid;--> statement-breakpoint
ALTER TABLE "phase_bracket_nodes" ADD COLUMN "home_penalties" integer;--> statement-breakpoint
ALTER TABLE "phase_bracket_nodes" ADD COLUMN "away_penalties" integer;--> statement-breakpoint
ALTER TABLE "phase_bracket_nodes" ADD CONSTRAINT "phase_bracket_nodes_second_leg_match_id_matches_id_fk" FOREIGN KEY ("second_leg_match_id") REFERENCES "public"."matches"("id") ON DELETE set null ON UPDATE no action;