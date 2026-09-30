import { and, eq, inArray } from 'drizzle-orm';
import { db } from '../../../../config/database.js';
import { teams } from '../../../teams/infrastructure/database/schema.js';
import { players, teamPlayers } from '../../../players/infrastructure/database/schema.js';
import type {
    ExistingPlayer,
    ExistingTeam,
    TournamentImportRepository,
} from '../../domain/repositories/tournament-import.repository.js';
import type { ImportPlan } from '../../domain/entities/import-plan.js';

// Lotes chicos: cada INSERT es una sentencia y el pool tiene statement_timeout de 10s.
const CHUNK_SIZE = 500;

function chunk<T>(items: T[], size = CHUNK_SIZE): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
    return out;
}

export class DrizzleTournamentImportRepository implements TournamentImportRepository {
    async findExistingTeams(tournamentId: string, names: string[]): Promise<ExistingTeam[]> {
        if (names.length === 0) return [];
        return db
            .select({ id: teams.id, name: teams.name, categoryId: teams.categoryId })
            .from(teams)
            .where(and(eq(teams.tournamentId, tournamentId), inArray(teams.name, names)));
    }

    async findPlayersByTeamIds(teamIds: string[]): Promise<ExistingPlayer[]> {
        if (teamIds.length === 0) return [];
        return db
            .select({
                teamId: teamPlayers.teamId,
                firstName: players.firstName,
                lastName: players.lastName,
                number: players.number,
            })
            .from(teamPlayers)
            .innerJoin(players, eq(players.id, teamPlayers.playerId))
            .where(inArray(teamPlayers.teamId, teamIds));
    }

    async importAll(plan: ImportPlan): Promise<void> {
        await db.transaction(async (tx) => {
            for (const batch of chunk(plan.teams)) {
                await tx.insert(teams).values(
                    batch.map((t) => ({
                        id: t.id,
                        tournamentId: plan.tournamentId,
                        categoryId: t.categoryId,
                        name: t.name,
                        abbreviation: t.abbreviation,
                        logoUrl: t.logoUrl,
                    })),
                );
            }

            for (const batch of chunk(plan.players)) {
                await tx.insert(players).values(
                    batch.map((p) => ({
                        id: p.id,
                        tournamentId: plan.tournamentId,
                        categoryId: p.categoryId,
                        firstName: p.firstName,
                        lastName: p.lastName,
                        birthDate: p.birthDate,
                        number: p.number,
                    })),
                );
                await tx.insert(teamPlayers).values(
                    batch.map((p) => ({
                        tournamentId: plan.tournamentId,
                        teamId: p.teamId,
                        playerId: p.id,
                        role: p.role,
                        isCaptain: p.isCaptain,
                        createdByUserId: plan.userId,
                    })),
                );
            }
        });
    }
}