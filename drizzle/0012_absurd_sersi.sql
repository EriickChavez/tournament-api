CREATE TABLE "patrocinadores_app" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
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
	"created_by_admin_id" uuid,
	"updated_by_admin_id" uuid
);
--> statement-breakpoint
ALTER TABLE "patrocinadores_app" ADD CONSTRAINT "patrocinadores_app_created_by_admin_id_super_admins_id_fk" FOREIGN KEY ("created_by_admin_id") REFERENCES "public"."super_admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patrocinadores_app" ADD CONSTRAINT "patrocinadores_app_updated_by_admin_id_super_admins_id_fk" FOREIGN KEY ("updated_by_admin_id") REFERENCES "public"."super_admins"("id") ON DELETE no action ON UPDATE no action;