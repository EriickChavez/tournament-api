CREATE TABLE "match_referees" (
	"match_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"assigned_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "match_referees_match_id_user_id_pk" PRIMARY KEY("match_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "match_events" ADD COLUMN "substitute_player_id" uuid;--> statement-breakpoint
ALTER TABLE "match_events" ADD COLUMN "occurred_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "match_events" ADD COLUMN "derived_from_event_id" uuid;--> statement-breakpoint
ALTER TABLE "match_referees" ADD CONSTRAINT "match_referees_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_referees" ADD CONSTRAINT "match_referees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_referees" ADD CONSTRAINT "match_referees_assigned_by_user_id_users_id_fk" FOREIGN KEY ("assigned_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "match_referees_user_idx" ON "match_referees" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_substitute_player_id_players_id_fk" FOREIGN KEY ("substitute_player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_derived_from_event_id_match_events_id_fk" FOREIGN KEY ("derived_from_event_id") REFERENCES "public"."match_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "match_events_match_player_idx" ON "match_events" USING btree ("match_id","player_id");