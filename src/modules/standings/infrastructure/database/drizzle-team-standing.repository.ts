import { and, eq, sql } from 'drizzle-orm';
import { db } from '../../../../config/database.js';
import { teamStandings } from './schema.js';
import type { TeamStandingRepository } from '../../domain/repositories/team-standing.repository.js';
import type { TeamStanding } from '../../domain/entities/team-standing.entity.js';

export class DrizzleTeamStandingRepository implements TeamStandingRepository {
    async findByTournamentAndCategory(tournamentId: string, categoryId: string): Promise<TeamStanding[]> {
        return db
            .select()
            .from(teamStandings)
            .where(and(eq(teamStandings.tournamentId, tournamentId), eq(teamStandings.categoryId, categoryId)))
            .orderBy(sql`${teamStandings.points} DESC, ${teamStandings.goalDifference} DESC`);
    }

    async upsert(input: {
        tournamentId: string;
        categoryId: string;
        teamId: string;
        played: number;
        won: number;
        drawn: number;
        lost: number;
        goalsFor: number;
        goalsAgainst: number;
        points: number;
    }): Promise<TeamStanding> {
        const [row] = await db
            .insert(teamStandings)
            .values({
                tournamentId: input.tournamentId,
                categoryId: input.categoryId,
                teamId: input.teamId,
                played: input.played,
                won: input.won,
                drawn: input.drawn,
                lost: input.lost,
                goalsFor: input.goalsFor,
                goalsAgainst: input.goalsAgainst,
                goalDifference: input.goalsFor - input.goalsAgainst,
                points: input.points,
                updatedAt: new Date(),
            })
            .onConflictDoUpdate({
                target: [teamStandings.tournamentId, teamStandings.categoryId, teamStandings.teamId],
                set: {
                    played: input.played,
                    won: input.won,
                    drawn: input.drawn,
                    lost: input.lost,
                    goalsFor: input.goalsFor,
                    goalsAgainst: input.goalsAgainst,
                    goalDifference: input.goalsFor - input.goalsAgainst,
                    points: input.points,
                    updatedAt: new Date(),
                },
            })
            .returning();
        if (!row) throw new Error('Failed to upsert team standing');
        return row;
    }
}