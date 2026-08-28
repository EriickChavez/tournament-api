import { db } from '../../../../config/database.js';
import { players, teamPlayers } from './schema.js';
import type { PlayerRepository } from '../../domain/repositories/player.repository.js';
import type { Player } from '../../domain/entities/player.entity.js';
import { and, asc, eq, sql } from 'drizzle-orm';
import { toOffset, type PaginationParams, type Paginated } from '../../../../shared/utils/pagination.js';

type PlayerRow = typeof players.$inferSelect;
type TeamPlayerRow = typeof teamPlayers.$inferSelect;

function toPlayer(player: PlayerRow, membership: TeamPlayerRow): Player {
    return {
        id: player.id,
        tournamentId: player.tournamentId,
        categoryId: player.categoryId,
        firstName: player.firstName,
        lastName: player.lastName,
        birthDate: player.birthDate,
        number: player.number,
        teamId: membership.teamId,
        isCaptain: membership.isCaptain,
        role: membership.role,
        createdAt: player.createdAt,
        updatedAt: player.updatedAt,
    };
}

export class DrizzlePlayerRepository implements PlayerRepository {
    async findById(id: string): Promise<Player | null> {
        const [row] = await db
            .select({
                player: players,
                membership: teamPlayers,
            })
            .from(players)
            .innerJoin(teamPlayers, eq(teamPlayers.playerId, players.id))
            .where(eq(players.id, id))
            .limit(1);

        if (!row) return null;
        return toPlayer(row.player, row.membership);
    }

    async findByTournamentAndNumber(tournamentId: string, number: number): Promise<Player | null> {
        const [row] = await db
            .select({
                player: players,
                membership: teamPlayers,
            })
            .from(players)
            .innerJoin(teamPlayers, eq(teamPlayers.playerId, players.id))
            .where(and(eq(players.tournamentId, tournamentId), eq(players.number, number)))
            .limit(1);

        if (!row) return null;
        return toPlayer(row.player, row.membership);
    }

    async findByTournamentId(
        tournamentId: string,
        pagination: PaginationParams,
    ): Promise<Paginated<Player>> {
        const condition = eq(players.tournamentId, tournamentId);

        const [rows, countRows] = await Promise.all([
            db
                .select({ player: players, membership: teamPlayers })
                .from(players)
                .innerJoin(teamPlayers, eq(teamPlayers.playerId, players.id))
                .where(condition)
                .orderBy(asc(players.lastName), asc(players.firstName))
                .limit(pagination.limit)
                .offset(toOffset(pagination)),
            db
                .select({ count: sql<number>`count(*)::int` })
                .from(players)
                .innerJoin(teamPlayers, eq(teamPlayers.playerId, players.id))
                .where(condition),
        ]);

        return {
            items: rows.map((row) => toPlayer(row.player, row.membership)),
            total: countRows[0]?.count ?? 0,
        };
    }

    async create(input: {
        tournamentId: string;
        categoryId: string;
        teamId: string;
        firstName: string;
        lastName: string;
        birthDate?: string | null | undefined;
        number: number;
        isCaptain?: boolean | undefined;
        role?: string | null | undefined;
        createdByUserId: string;
    }): Promise<Player> {
        return db.transaction(async (tx) => {
            const [playerRow] = await tx
                .insert(players)
                .values({
                    tournamentId: input.tournamentId,
                    categoryId: input.categoryId,
                    firstName: input.firstName,
                    lastName: input.lastName,
                    birthDate: input.birthDate ?? null,
                    number: input.number,
                })
                .returning();

            if (!playerRow) throw new Error('Failed to create player');

            const [membershipRow] = await tx
                .insert(teamPlayers)
                .values({
                    tournamentId: input.tournamentId,
                    teamId: input.teamId,
                    playerId: playerRow.id,
                    role: input.role ?? null,
                    isCaptain: input.isCaptain ?? false,
                    createdByUserId: input.createdByUserId,
                })
                .returning();

            if (!membershipRow) throw new Error('Failed to assign player to team');

            return toPlayer(playerRow, membershipRow);
        });
    }

    async update(
        id: string,
        input: {
            categoryId?: string | undefined;
            teamId?: string | undefined;
            firstName?: string | undefined;
            lastName?: string | undefined;
            birthDate?: string | null | undefined;
            number?: number | undefined;
            isCaptain?: boolean | undefined;
            role?: string | null | undefined;
            updatedByUserId: string;
        },
    ): Promise<Player> {
        return db.transaction(async (tx) => {
            const playerPatch: Record<string, unknown> = {
                updatedAt: new Date(),
            };
            if (input.categoryId !== undefined) playerPatch.categoryId = input.categoryId;
            if (input.firstName !== undefined) playerPatch.firstName = input.firstName;
            if (input.lastName !== undefined) playerPatch.lastName = input.lastName;
            if (input.birthDate !== undefined) playerPatch.birthDate = input.birthDate;
            if (input.number !== undefined) playerPatch.number = input.number;

            const [playerRow] = await tx
                .update(players)
                .set(playerPatch)
                .where(eq(players.id, id))
                .returning();

            if (!playerRow) throw new Error('Failed to update player');

            const membershipPatch: Record<string, unknown> = {
                updatedAt: new Date(),
                updatedByUserId: input.updatedByUserId,
            };
            if (input.teamId !== undefined) membershipPatch.teamId = input.teamId;
            if (input.isCaptain !== undefined) membershipPatch.isCaptain = input.isCaptain;
            if (input.role !== undefined) membershipPatch.role = input.role;

            const [membershipRow] = await tx
                .update(teamPlayers)
                .set(membershipPatch)
                .where(eq(teamPlayers.playerId, id))
                .returning();

            if (!membershipRow) throw new Error('Failed to update player team assignment');

            return toPlayer(playerRow, membershipRow);
        });
    }

    async delete(id: string): Promise<void> {
        await db.transaction(async (tx) => {
            await tx.delete(teamPlayers).where(eq(teamPlayers.playerId, id));
            const [row] = await tx.delete(players).where(eq(players.id, id)).returning();
            if (!row) throw new Error('Failed to delete player');
        });
    }
}