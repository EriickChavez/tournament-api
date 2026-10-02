CREATE TABLE "phase_bracket_nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phase_id" uuid NOT NULL,
	"stage" varchar(20) NOT NULL,
	"round" integer NOT NULL,
	"position" integer NOT NULL,
	"home_team_id" uuid,
	"away_team_id" uuid,
	"home_seed" integer,
	"away_seed" integer,
	"home_source_node_id" uuid,
	"home_source_kind" varchar(10),
	"away_source_node_id" uuid,
	"away_source_kind" varchar(10),
	"match_id" uuid,
	"winner_team_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "phase_bracket_nodes" ADD CONSTRAINT "phase_bracket_nodes_phase_id_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."phases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_bracket_nodes" ADD CONSTRAINT "phase_bracket_nodes_home_team_id_teams_id_fk" FOREIGN KEY ("home_team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_bracket_nodes" ADD CONSTRAINT "phase_bracket_nodes_away_team_id_teams_id_fk" FOREIGN KEY ("away_team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_bracket_nodes" ADD CONSTRAINT "phase_bracket_nodes_home_source_node_id_phase_bracket_nodes_id_fk" FOREIGN KEY ("home_source_node_id") REFERENCES "public"."phase_bracket_nodes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_bracket_nodes" ADD CONSTRAINT "phase_bracket_nodes_away_source_node_id_phase_bracket_nodes_id_fk" FOREIGN KEY ("away_source_node_id") REFERENCES "public"."phase_bracket_nodes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_bracket_nodes" ADD CONSTRAINT "phase_bracket_nodes_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_bracket_nodes" ADD CONSTRAINT "phase_bracket_nodes_winner_team_id_teams_id_fk" FOREIGN KEY ("winner_team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "phase_bracket_nodes_slot_uidx" ON "phase_bracket_nodes" USING btree ("phase_id","stage","round","position");