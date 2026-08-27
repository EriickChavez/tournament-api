-- Catálogo de torneos (multi-torneo).
CREATE TABLE IF NOT EXISTS "torneos" (
	"id" uuid NOT NULL,
	"nombre" varchar(200) NOT NULL,
	"subtitulo" varchar(255),
	"descripcion" text,
	"slug" varchar(220) NOT NULL UNIQUE,
	"fecha_inicio" date,
	"fecha_fin" date,
	"zona_horaria" varchar(60) NOT NULL DEFAULT 'America/Mexico_City',
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone NOT NULL DEFAULT 'now()',
	"updated_by_user_id" uuid,
	"updated_at" timestamp with time zone NOT NULL DEFAULT 'now()',
	PRIMARY KEY ("id")
);
-- Categorías por torneo (p. ej. edades).
CREATE TABLE IF NOT EXISTS "categorias" (
	"id" uuid NOT NULL,
	"torneo_id" uuid NOT NULL,
	"titulo" varchar(200) NOT NULL,
	"edades_min" integer,
	"edades_max" integer,
	"descripcion" text,
	"orden" integer DEFAULT 0,
	"created_at" timestamp with time zone NOT NULL DEFAULT 'now()',
	"updated_at" timestamp with time zone NOT NULL DEFAULT 'now()',
	"created_by_user_id" uuid,
	"updated_by_user_id" uuid,
	PRIMARY KEY ("id")
);
-- Equipos participantes por torneo.
CREATE TABLE IF NOT EXISTS "equipos" (
	"id" uuid NOT NULL,
	"torneo_id" uuid NOT NULL,
	"nombre" varchar(200) NOT NULL,
	"siglas" varchar(50),
	"logo_url" varchar(500),
	"categoria_id" uuid,
	"created_at" timestamp with time zone NOT NULL DEFAULT 'now()',
	"updated_at" timestamp with time zone NOT NULL DEFAULT 'now()',
	PRIMARY KEY ("id"),
	CONSTRAINT "uq_equipos_torneo_nombre" UNIQUE (torneo_id,nombre)
);
-- Jugadores (asociados a una categoría dentro del torneo).
CREATE TABLE IF NOT EXISTS "jugadores" (
	"id" uuid NOT NULL,
	"torneo_id" uuid NOT NULL,
	"categoria_id" uuid NOT NULL,
	"nombre" varchar(120) NOT NULL,
	"apellido" varchar(120) NOT NULL,
	"fecha_nacimiento" date,
	"numero" integer,
	"created_at" timestamp with time zone NOT NULL DEFAULT 'now()',
	"updated_at" timestamp with time zone NOT NULL DEFAULT 'now()',
	PRIMARY KEY ("id"),
	CONSTRAINT "uq_jugadores_torneo_numero" UNIQUE (torneo_id,numero)
);
-- Relación muchos-a-muchos: qué jugadores pertenecen a qué equipo (dentro del torneo).
CREATE TABLE IF NOT EXISTS "equipo_jugador" (
	"id" uuid NOT NULL,
	"torneo_id" uuid NOT NULL,
	"equipo_id" uuid NOT NULL,
	"jugador_id" uuid NOT NULL,
	"rol" varchar(50),
	"es_capitan" boolean NOT NULL DEFAULT false,
	"created_at" timestamp with time zone NOT NULL DEFAULT 'now()',
	"updated_at" timestamp with time zone NOT NULL DEFAULT 'now()',
	"created_by_user_id" uuid,
	"updated_by_user_id" uuid,
	PRIMARY KEY ("id")
);
-- Calendario/fixtures por torneo y categoría (local vs visitante).
CREATE TABLE IF NOT EXISTS "partidos" (
	"id" uuid NOT NULL,
	"torneo_id" uuid NOT NULL,
	"categoria_id" uuid NOT NULL,
	"equipo_local_id" uuid NOT NULL,
	"equipo_visitante_id" uuid NOT NULL,
	"fecha_hora" timestamp with time zone NOT NULL,
	"sede" varchar(200),
	"estado" varchar(30) NOT NULL DEFAULT '''programado''',
	"created_by_user_id" uuid,
	"updated_by_user_id" uuid,
	"created_at" timestamp with time zone NOT NULL DEFAULT 'now()',
	"updated_at" timestamp with time zone NOT NULL DEFAULT 'now()',
	PRIMARY KEY ("id")
);
-- Eventos por partido: goles, asistencias, tarjetas, etc.
CREATE TABLE IF NOT EXISTS "eventos_partido" (
	"id" uuid NOT NULL,
	"torneo_id" uuid NOT NULL,
	"categoria_id" uuid NOT NULL,
	"partido_id" uuid NOT NULL,
	"tipo_evento" varchar(30) NOT NULL,
	"minuto" integer,
	"equipo_id" uuid NOT NULL,
	"jugador_id" uuid,
	"asistidor_id" uuid,
	"descripcion" varchar(255),
	"created_at" timestamp with time zone NOT NULL DEFAULT 'now()',
	"updated_at" timestamp with time zone NOT NULL DEFAULT 'now()',
	"created_by_user_id" uuid,
	"updated_by_user_id" uuid,
	PRIMARY KEY ("id")
);
-- Tabla de puntos/posiciones por torneo y categoría (por equipo).
CREATE TABLE IF NOT EXISTS "posiciones" (
	"id" uuid NOT NULL,
	"torneo_id" uuid NOT NULL,
	"categoria_id" uuid NOT NULL,
	"equipo_id" uuid NOT NULL,
	"pj" integer NOT NULL DEFAULT 0,
	"pg" integer NOT NULL DEFAULT 0,
	"pe" integer NOT NULL DEFAULT 0,
	"pp" integer NOT NULL DEFAULT 0,
	"gf" integer NOT NULL DEFAULT 0,
	"gc" integer NOT NULL DEFAULT 0,
	"dg" integer NOT NULL DEFAULT 0,
	"puntos" integer NOT NULL DEFAULT 0,
	"created_by_user_id" uuid,
	"orden" integer,
	"updated_by_user_id" uuid,
	"updated_at" timestamp with time zone NOT NULL DEFAULT 'now()',
	PRIMARY KEY ("id")
);
-- Materialización opcional del ranking de goleadores (puede recalcularse desde eventos).
CREATE TABLE IF NOT EXISTS "goleadores" (
	"id" uuid NOT NULL,
	"torneo_id" uuid NOT NULL,
	"categoria_id" uuid NOT NULL,
	"jugador_id" uuid NOT NULL,
	"goles" integer NOT NULL DEFAULT 0,
	"asistencias" integer NOT NULL DEFAULT 0,
	"orden" integer,
	"updated_at" timestamp with time zone NOT NULL DEFAULT 'now()',
	"created_by_user_id" uuid,
	"updated_by_user_id" uuid,
	PRIMARY KEY ("id")
);
-- Materialización opcional del ranking de tarjetas (puede recalcularse desde eventos).
CREATE TABLE IF NOT EXISTS "tarjetas" (
	"id" uuid NOT NULL,
	"torneo_id" uuid NOT NULL,
	"categoria_id" uuid NOT NULL,
	"jugador_id" uuid NOT NULL,
	"amarillas" integer NOT NULL DEFAULT 0,
	"rojas" integer NOT NULL DEFAULT 0,
	"orden" integer,
	"updated_at" timestamp with time zone NOT NULL DEFAULT 'now()',
	"created_by_user_id" uuid,
	"updated_by_user_id" uuid,
	PRIMARY KEY ("id")
);
-- Usuarios del sistema (auth).
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid NOT NULL,
	"email" varchar(255) NOT NULL UNIQUE,
	"password_hash" varchar(255) NOT NULL,
	"display_name" varchar(120),
	"avatar_url" varchar(500),
	"is_active" boolean NOT NULL DEFAULT true,
	"created_at" timestamp with time zone NOT NULL DEFAULT 'now()',
	"updated_at" timestamp with time zone NOT NULL DEFAULT 'now()',
	PRIMARY KEY ("id")
);
-- Catálogo de roles del sistema.
CREATE TABLE IF NOT EXISTS "roles" (
	"id" uuid NOT NULL,
	"name" varchar(60) NOT NULL UNIQUE,
	"description" varchar(255),
	"created_at" timestamp with time zone NOT NULL DEFAULT 'now()',
	"updated_at" timestamp with time zone NOT NULL DEFAULT 'now()',
	PRIMARY KEY ("id")
);
-- Membership: quién puede administrar/participar en cada torneo.
CREATE TABLE IF NOT EXISTS "torneo_members" (
	"id" uuid NOT NULL,
	"torneo_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"status" varchar(30) NOT NULL DEFAULT '''active''',
	"created_at" timestamp with time zone NOT NULL DEFAULT 'now()',
	"updated_at" timestamp with time zone NOT NULL DEFAULT 'now()',
	PRIMARY KEY ("id"),
	CONSTRAINT "uq_torneo_members_torneo_user" UNIQUE (torneo_id,user_id)
);
-- Branding separado por torneo (evita crecimiento/mezcla en tabla principal).
CREATE TABLE IF NOT EXISTS "torneo_branding" (
	"id" uuid NOT NULL,
	"torneo_id" uuid NOT NULL,
	"logo_url" varchar(512),
	"banner_url" varchar(512),
	"created_at" timestamp with time zone NOT NULL DEFAULT 'now()',
	"updated_at" timestamp with time zone NOT NULL DEFAULT 'now()',
	"created_by_user_id" uuid,
	"updated_by_user_id" uuid,
	PRIMARY KEY ("id"),
	CONSTRAINT "uq_torneo_branding_torneo_id" UNIQUE (torneo_id)
);
ALTER TABLE "torneos" ADD CONSTRAINT "torneos_fk7" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");
ALTER TABLE "torneos" ADD CONSTRAINT "torneos_fk9" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_fk1" FOREIGN KEY ("torneo_id") REFERENCES "torneos"("id");
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_fk9" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_fk10" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");
ALTER TABLE "equipos" ADD CONSTRAINT "equipos_fk1" FOREIGN KEY ("torneo_id") REFERENCES "torneos"("id");
ALTER TABLE "equipos" ADD CONSTRAINT "equipos_fk5" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id");
ALTER TABLE "jugadores" ADD CONSTRAINT "jugadores_fk1" FOREIGN KEY ("torneo_id") REFERENCES "torneos"("id");
ALTER TABLE "jugadores" ADD CONSTRAINT "jugadores_fk2" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id");
ALTER TABLE "equipo_jugador" ADD CONSTRAINT "equipo_jugador_fk1" FOREIGN KEY ("torneo_id") REFERENCES "torneos"("id");
ALTER TABLE "equipo_jugador" ADD CONSTRAINT "equipo_jugador_fk2" FOREIGN KEY ("equipo_id") REFERENCES "equipos"("id");
ALTER TABLE "equipo_jugador" ADD CONSTRAINT "equipo_jugador_fk3" FOREIGN KEY ("jugador_id") REFERENCES "jugadores"("id");
ALTER TABLE "equipo_jugador" ADD CONSTRAINT "equipo_jugador_fk8" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");
ALTER TABLE "equipo_jugador" ADD CONSTRAINT "equipo_jugador_fk9" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");
ALTER TABLE "partidos" ADD CONSTRAINT "partidos_fk1" FOREIGN KEY ("torneo_id") REFERENCES "torneos"("id");
ALTER TABLE "partidos" ADD CONSTRAINT "partidos_fk2" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id");
ALTER TABLE "partidos" ADD CONSTRAINT "partidos_fk3" FOREIGN KEY ("equipo_local_id") REFERENCES "equipos"("id");
ALTER TABLE "partidos" ADD CONSTRAINT "partidos_fk4" FOREIGN KEY ("equipo_visitante_id") REFERENCES "equipos"("id");
ALTER TABLE "partidos" ADD CONSTRAINT "partidos_fk8" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");
ALTER TABLE "partidos" ADD CONSTRAINT "partidos_fk9" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");
ALTER TABLE "eventos_partido" ADD CONSTRAINT "eventos_partido_fk1" FOREIGN KEY ("torneo_id") REFERENCES "torneos"("id");
ALTER TABLE "eventos_partido" ADD CONSTRAINT "eventos_partido_fk2" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id");
ALTER TABLE "eventos_partido" ADD CONSTRAINT "eventos_partido_fk3" FOREIGN KEY ("partido_id") REFERENCES "partidos"("id");
ALTER TABLE "eventos_partido" ADD CONSTRAINT "eventos_partido_fk6" FOREIGN KEY ("equipo_id") REFERENCES "equipos"("id");
ALTER TABLE "eventos_partido" ADD CONSTRAINT "eventos_partido_fk7" FOREIGN KEY ("jugador_id") REFERENCES "jugadores"("id");
ALTER TABLE "eventos_partido" ADD CONSTRAINT "eventos_partido_fk8" FOREIGN KEY ("asistidor_id") REFERENCES "jugadores"("id");
ALTER TABLE "eventos_partido" ADD CONSTRAINT "eventos_partido_fk12" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");
ALTER TABLE "eventos_partido" ADD CONSTRAINT "eventos_partido_fk13" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");
ALTER TABLE "posiciones" ADD CONSTRAINT "posiciones_fk1" FOREIGN KEY ("torneo_id") REFERENCES "torneos"("id");
ALTER TABLE "posiciones" ADD CONSTRAINT "posiciones_fk2" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id");
ALTER TABLE "posiciones" ADD CONSTRAINT "posiciones_fk3" FOREIGN KEY ("equipo_id") REFERENCES "equipos"("id");
ALTER TABLE "posiciones" ADD CONSTRAINT "posiciones_fk12" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");
ALTER TABLE "posiciones" ADD CONSTRAINT "posiciones_fk14" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");
ALTER TABLE "goleadores" ADD CONSTRAINT "goleadores_fk1" FOREIGN KEY ("torneo_id") REFERENCES "torneos"("id");
ALTER TABLE "goleadores" ADD CONSTRAINT "goleadores_fk2" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id");
ALTER TABLE "goleadores" ADD CONSTRAINT "goleadores_fk3" FOREIGN KEY ("jugador_id") REFERENCES "jugadores"("id");
ALTER TABLE "goleadores" ADD CONSTRAINT "goleadores_fk8" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");
ALTER TABLE "goleadores" ADD CONSTRAINT "goleadores_fk9" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");
ALTER TABLE "tarjetas" ADD CONSTRAINT "tarjetas_fk1" FOREIGN KEY ("torneo_id") REFERENCES "torneos"("id");
ALTER TABLE "tarjetas" ADD CONSTRAINT "tarjetas_fk2" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id");
ALTER TABLE "tarjetas" ADD CONSTRAINT "tarjetas_fk3" FOREIGN KEY ("jugador_id") REFERENCES "jugadores"("id");
ALTER TABLE "tarjetas" ADD CONSTRAINT "tarjetas_fk8" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");
ALTER TABLE "tarjetas" ADD CONSTRAINT "tarjetas_fk9" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");
ALTER TABLE "torneo_members" ADD CONSTRAINT "torneo_members_fk1" FOREIGN KEY ("torneo_id") REFERENCES "torneos"("id");
ALTER TABLE "torneo_members" ADD CONSTRAINT "torneo_members_fk2" FOREIGN KEY ("user_id") REFERENCES "users"("id");
ALTER TABLE "torneo_members" ADD CONSTRAINT "torneo_members_fk3" FOREIGN KEY ("role_id") REFERENCES "roles"("id");
ALTER TABLE "torneo_branding" ADD CONSTRAINT "torneo_branding_fk1" FOREIGN KEY ("torneo_id") REFERENCES "torneos"("id");
ALTER TABLE "torneo_branding" ADD CONSTRAINT "torneo_branding_fk6" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id");
ALTER TABLE "torneo_branding" ADD CONSTRAINT "torneo_branding_fk7" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id");
CREATE INDEX "idx_equipos_torneo_id" ON "equipos" USING btree ("torneo_id");
CREATE INDEX "idx_equipos_torneo_categoria" ON "equipos" USING btree ("torneo_id", "categoria_id");
CREATE INDEX "idx_equipos_torneo_categoria_id" ON "equipos" USING btree ("torneo_id", "categoria_id");
CREATE INDEX "idx_jugadores_torneo_categoria" ON "jugadores" USING btree ("torneo_id", "categoria_id");
CREATE INDEX "idx_jugadores_torneo_numero" ON "jugadores" USING btree ("torneo_id", "numero");
CREATE INDEX "idx_jugadores_torneo_categoria_id" ON "jugadores" USING btree ("torneo_id", "categoria_id");
CREATE INDEX "idx_torneo_members_torneo" ON "torneo_members" USING btree ("torneo_id");
CREATE INDEX "idx_torneo_members_user" ON "torneo_members" USING btree ("user_id");
CREATE INDEX "idx_torneo_members_role" ON "torneo_members" USING btree ("role_id");
COMMENT ON TABLE "torneos" IS 'Catálogo de torneos (multi-torneo).';
COMMENT ON TABLE "categorias" IS 'Categorías por torneo (p. ej. edades).';
COMMENT ON TABLE "equipos" IS 'Equipos participantes por torneo.';
COMMENT ON TABLE "jugadores" IS 'Jugadores (asociados a una categoría dentro del torneo).';
COMMENT ON TABLE "equipo_jugador" IS 'Relación muchos-a-muchos: qué jugadores pertenecen a qué equipo (dentro del torneo).';
COMMENT ON TABLE "partidos" IS 'Calendario/fixtures por torneo y categoría (local vs visitante).';
COMMENT ON COLUMN "partidos"."estado" IS 'programado|en_curso|finalizado';
COMMENT ON TABLE "eventos_partido" IS 'Eventos por partido: goles, asistencias, tarjetas, etc.';
COMMENT ON COLUMN "eventos_partido"."tipo_evento" IS 'gol|asistencia|tarjeta_amarilla|tarjeta_roja|cambio|otro';
COMMENT ON COLUMN "eventos_partido"."minuto" IS 'minuto del evento';
COMMENT ON COLUMN "eventos_partido"."jugador_id" IS 'para goles/tarjetas; puede ser null si el evento no aplica a jugador';
COMMENT ON COLUMN "eventos_partido"."asistidor_id" IS 'opcional para goles';
COMMENT ON TABLE "posiciones" IS 'Tabla de puntos/posiciones por torneo y categoría (por equipo).';
COMMENT ON COLUMN "posiciones"."pj" IS 'partidos jugados';
COMMENT ON COLUMN "posiciones"."gf" IS 'goles a favor';
COMMENT ON COLUMN "posiciones"."gc" IS 'goles en contra';
COMMENT ON COLUMN "posiciones"."dg" IS 'diferencia de goles';
COMMENT ON COLUMN "posiciones"."orden" IS 'posición/ranking calculado';
COMMENT ON TABLE "goleadores" IS 'Materialización opcional del ranking de goleadores (puede recalcularse desde eventos).';
COMMENT ON TABLE "tarjetas" IS 'Materialización opcional del ranking de tarjetas (puede recalcularse desde eventos).';
COMMENT ON TABLE "users" IS 'Usuarios del sistema (auth).';
COMMENT ON COLUMN "users"."password_hash" IS 'Hash de contraseña (nunca guardar password en texto plano).';
COMMENT ON TABLE "roles" IS 'Catálogo de roles del sistema.';
COMMENT ON COLUMN "roles"."name" IS 'admin|staff|referee|viewer';
COMMENT ON TABLE "torneo_members" IS 'Membership: quién puede administrar/participar en cada torneo.';
COMMENT ON COLUMN "torneo_members"."status" IS 'active|invited|suspended';
COMMENT ON TABLE "torneo_branding" IS 'Branding separado por torneo (evita crecimiento/mezcla en tabla principal).';