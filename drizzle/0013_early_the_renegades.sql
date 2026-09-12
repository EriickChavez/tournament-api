CREATE TABLE "patrocinadores_torneo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"torneo_id" uuid NOT NULL,
	"nombre" varchar(200) NOT NULL,
	"descripcion" varchar(500) NOT NULL,
	"logo_url" varchar(512) NOT NULL,
	"logo_storage_key" varchar(512),
	"website_url" varchar(512),
	"pdf_url" varchar(512),
	"pdf_storage_key" varchar(512),
	"orden" integer DEFAULT 0 NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"fecha_inicio" date,
	"fecha_fin" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_user_id" uuid,
	"updated_by_user_id" uuid
);
--> statement-breakpoint
ALTER TABLE "torneos" ADD COLUMN "max_sponsors" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "patrocinadores_torneo" ADD CONSTRAINT "patrocinadores_torneo_torneo_id_torneos_id_fk" FOREIGN KEY ("torneo_id") REFERENCES "public"."torneos"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "patrocinadores_torneo" ADD CONSTRAINT "patrocinadores_torneo_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "patrocinadores_torneo" ADD CONSTRAINT "patrocinadores_torneo_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;