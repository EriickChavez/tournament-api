import { and, eq, or } from 'drizzle-orm';
import { db } from '../../../../config/database.js';
import { env } from '../../../../config/env.js';
import { users } from '../../../auth/infrastructure/database/schema.js';
import { UserNotFoundError } from '../../../auth/domain/errors/auth.errors.js';
import { tournaments, tournamentMembers } from '../../../tournaments/infrastructure/database/schema.js';
import { categories } from '../../../categories/infrastructure/database/schema.js';
import { matches } from '../../../matches/infrastructure/database/schema.js';
import { matchEvents } from '../../../match-events/infrastructure/database/schema.js';
import { teamPlayers } from '../../../players/infrastructure/database/schema.js';

export interface DeleteUserResult {
    tournamentsDeleted: number;
}

/**
 * Borrado seguro y en cascada de un usuario normal, ejecutado por un superadmin.
 *
 * Un usuario puede tener torneos propios (rol OWNER), y esos torneos arrastran
 * categorías, equipos, jugadores, partidos, eventos y standings. Todas esas tablas
 * ya tienen ON DELETE CASCADE por torneo_id en la base de datos, PERO:
 *
 *  - torneo_members.torneo_id NO tiene cascade (para no perder membresías por accidente
 *    en un update normal), así que hay que vaciarla a mano antes de borrar el torneo.
 *  - varias tablas guardan created_by_user_id / updated_by_user_id apuntando a `users.id`
 *    SIN cascade (son de auditoría, no de pertenencia). Si este usuario colaboró como
 *    ADMIN/EDITOR en el torneo de alguien más, esas columnas seguirían apuntando a él
 *    y la base de datos rechazaría el DELETE final por violación de FK.
 *  - el usuario también puede ser miembro (no owner) de torneos ajenos.
 *
 * Todo corre dentro de una sola transacción: si algo falla a la mitad, no queda
 * ningún registro huérfano ni un torneo a medio borrar.
 */
export class DeleteUserUseCase {
    async execute(userId: string): Promise<DeleteUserResult> {
        const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
        if (!user) throw new UserNotFoundError();

        return db.transaction(async (tx) => {
            // 1) Torneos propios del usuario (rol OWNER). Se borran por completo.
            const ownedTournaments = await tx
                .select({ id: tournamentMembers.tournamentId })
                .from(tournamentMembers)
                .where(and(eq(tournamentMembers.userId, userId), eq(tournamentMembers.roleId, env.OWNER_ROLE_ID)));

            for (const { id: tournamentId } of ownedTournaments) {
                // torneo_members.torneo_id no tiene ON DELETE CASCADE: hay que vaciarlo
                // primero (incluye a otros usuarios invitados a ESTE torneo).
                await tx.delete(tournamentMembers).where(eq(tournamentMembers.tournamentId, tournamentId));

                // Esto sí dispara cascada por torneo_id en: categorias, equipos, jugadores,
                // partidos, eventos_partido, equipo_jugador, team_standings, top_scorers, card_counts.
                await tx.delete(tournaments).where(eq(tournaments.id, tournamentId));
            }

            // 2) Rastros de auditoría en torneos AJENOS (donde este usuario no es owner
            // pero sí creó/actualizó algo como colaborador). No se pueden borrar esos
            // registros -no son suyos-, solo se desvincula la referencia (columnas nullable).
            await tx
                .update(tournaments)
                .set({ createdByUserId: null, updatedByUserId: null })
                .where(or(eq(tournaments.createdByUserId, userId), eq(tournaments.updatedByUserId, userId)));

            await tx
                .update(categories)
                .set({ createdByUserId: null, updatedByUserId: null })
                .where(or(eq(categories.createdByUserId, userId), eq(categories.updatedByUserId, userId)));

            await tx
                .update(matches)
                .set({ createdByUserId: null, updatedByUserId: null })
                .where(or(eq(matches.createdByUserId, userId), eq(matches.updatedByUserId, userId)));

            await tx
                .update(matchEvents)
                .set({ createdByUserId: null, updatedByUserId: null })
                .where(or(eq(matchEvents.createdByUserId, userId), eq(matchEvents.updatedByUserId, userId)));

            await tx
                .update(teamPlayers)
                .set({ createdByUserId: null, updatedByUserId: null })
                .where(or(eq(teamPlayers.createdByUserId, userId), eq(teamPlayers.updatedByUserId, userId)));

            await tx.delete(tournamentMembers).where(eq(tournamentMembers.userId, userId));
            await tx.delete(users).where(eq(users.id, userId));

            return { tournamentsDeleted: ownedTournaments.length };
        });
    }
}