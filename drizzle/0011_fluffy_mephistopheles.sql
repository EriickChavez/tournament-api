CREATE TABLE "torneo_branding" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"torneo_id" uuid NOT NULL,
	"logo_url" varchar(512),
	"banner_url" varchar(512),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_user_id" uuid,
	"updated_by_user_id" uuid,
	CONSTRAINT "torneo_branding_torneo_id_unique" UNIQUE("torneo_id")
);
--> statement-breakpoint
ALTER TABLE "torneo_branding" ADD CONSTRAINT "torneo_branding_torneo_id_torneos_id_fk" FOREIGN KEY ("torneo_id") REFERENCES "public"."torneos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "torneo_branding" ADD CONSTRAINT "torneo_branding_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "torneo_branding" ADD CONSTRAINT "torneo_branding_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;