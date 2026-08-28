CREATE TABLE "equipos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"torneo_id" uuid NOT NULL,
	"categoria_id" uuid NOT NULL,
	"nombre" varchar(200) NOT NULL,
	"siglas" varchar(50),
	"logo_url" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_equipos_torneo_nombre" UNIQUE("torneo_id","nombre")
);
--> statement-breakpoint
CREATE TABLE "jugadores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"torneo_id" uuid NOT NULL,
	"categoria_id" uuid NOT NULL,
	"nombre" varchar(120) NOT NULL,
	"apellido" varchar(120) NOT NULL,
	"fecha_nacimiento" date,
	"numero" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_jugadores_torneo_numero" UNIQUE("torneo_id","numero")
);
--> statement-breakpoint
CREATE TABLE "equipo_jugador" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"torneo_id" uuid NOT NULL,
	"equipo_id" uuid NOT NULL,
	"jugador_id" uuid NOT NULL,
	"rol" varchar(50),
	"es_capitan" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_user_id" uuid,
	"updated_by_user_id" uuid
);
--> statement-breakpoint
ALTER TABLE "equipos" ADD CONSTRAINT "equipos_torneo_id_torneos_id_fk" FOREIGN KEY ("torneo_id") REFERENCES "public"."torneos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipos" ADD CONSTRAINT "equipos_categoria_id_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jugadores" ADD CONSTRAINT "jugadores_torneo_id_torneos_id_fk" FOREIGN KEY ("torneo_id") REFERENCES "public"."torneos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jugadores" ADD CONSTRAINT "jugadores_categoria_id_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipo_jugador" ADD CONSTRAINT "equipo_jugador_torneo_id_torneos_id_fk" FOREIGN KEY ("torneo_id") REFERENCES "public"."torneos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipo_jugador" ADD CONSTRAINT "equipo_jugador_equipo_id_equipos_id_fk" FOREIGN KEY ("equipo_id") REFERENCES "public"."equipos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipo_jugador" ADD CONSTRAINT "equipo_jugador_jugador_id_jugadores_id_fk" FOREIGN KEY ("jugador_id") REFERENCES "public"."jugadores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipo_jugador" ADD CONSTRAINT "equipo_jugador_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipo_jugador" ADD CONSTRAINT "equipo_jugador_updated_by_user_id_users_id_fk" FOREIGN KEY ("updated_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;