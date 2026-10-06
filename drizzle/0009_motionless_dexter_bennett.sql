CREATE TABLE "category_closures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"champion_team_id" uuid,
	"closed_by_user_id" uuid,
	"closed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "category_closures" ADD CONSTRAINT "category_closures_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_closures" ADD CONSTRAINT "category_closures_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_closures" ADD CONSTRAINT "category_closures_champion_team_id_teams_id_fk" FOREIGN KEY ("champion_team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_closures" ADD CONSTRAINT "category_closures_closed_by_user_id_users_id_fk" FOREIGN KEY ("closed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "category_closures_category_uidx" ON "category_closures" USING btree ("category_id");