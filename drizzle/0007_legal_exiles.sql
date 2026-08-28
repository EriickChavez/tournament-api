CREATE TABLE "tarjetas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"torneo_id" uuid NOT NULL,
	"categoria_id" uuid NOT NULL,
	"jugador_id" uuid NOT NULL,
	"amarillas" integer DEFAULT 0 NOT NULL,
	"rojas" integer DEFAULT 0 NOT NULL,
	"orden" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_tarjetas" UNIQUE("torneo_id","categoria_id","jugador_id")
);
--> statement-breakpoint
CREATE TABLE "posiciones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"torneo_id" uuid NOT NULL,
	"categoria_id" uuid NOT NULL,
	"equipo_id" uuid NOT NULL,
	"pj" integer DEFAULT 0 NOT NULL,
	"pg" integer DEFAULT 0 NOT NULL,
	"pe" integer DEFAULT 0 NOT NULL,
	"pp" integer DEFAULT 0 NOT NULL,
	"gf" integer DEFAULT 0 NOT NULL,
	"gc" integer DEFAULT 0 NOT NULL,
	"dg" integer DEFAULT 0 NOT NULL,
	"puntos" integer DEFAULT 0 NOT NULL,
	"orden" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_posiciones" UNIQUE("torneo_id","categoria_id","equipo_id")
);
--> statement-breakpoint
CREATE TABLE "goleadores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"torneo_id" uuid NOT NULL,
	"categoria_id" uuid NOT NULL,
	"jugador_id" uuid NOT NULL,
	"goles" integer DEFAULT 0 NOT NULL,
	"asistencias" integer DEFAULT 0 NOT NULL,
	"orden" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_goleadores" UNIQUE("torneo_id","categoria_id","jugador_id")
);
--> statement-breakpoint
ALTER TABLE "tarjetas" ADD CONSTRAINT "tarjetas_torneo_id_torneos_id_fk" FOREIGN KEY ("torneo_id") REFERENCES "public"."torneos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tarjetas" ADD CONSTRAINT "tarjetas_categoria_id_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tarjetas" ADD CONSTRAINT "tarjetas_jugador_id_jugadores_id_fk" FOREIGN KEY ("jugador_id") REFERENCES "public"."jugadores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posiciones" ADD CONSTRAINT "posiciones_torneo_id_torneos_id_fk" FOREIGN KEY ("torneo_id") REFERENCES "public"."torneos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posiciones" ADD CONSTRAINT "posiciones_categoria_id_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posiciones" ADD CONSTRAINT "posiciones_equipo_id_equipos_id_fk" FOREIGN KEY ("equipo_id") REFERENCES "public"."equipos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goleadores" ADD CONSTRAINT "goleadores_torneo_id_torneos_id_fk" FOREIGN KEY ("torneo_id") REFERENCES "public"."torneos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goleadores" ADD CONSTRAINT "goleadores_categoria_id_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goleadores" ADD CONSTRAINT "goleadores_jugador_id_jugadores_id_fk" FOREIGN KEY ("jugador_id") REFERENCES "public"."jugadores"("id") ON DELETE no action ON UPDATE no action;