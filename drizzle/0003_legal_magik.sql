CREATE TABLE "categorias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"torneo_id" uuid NOT NULL,
	"titulo" varchar(200) NOT NULL,
	"edades_min" integer,
	"edades_max" integer,
	"descripcion" text,
	"orden" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_user_id" uuid,
	"updated_by_user_id" uuid
);
--> statement-breakpoint
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_torneo_id_torneos_id_fk" FOREIGN KEY ("torneo_id") REFERENCES "public"."torneos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;