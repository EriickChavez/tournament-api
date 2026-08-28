import type { TeamStanding } from '../entities/team-standing.entity.js';

export interface TeamStandingRepository {
    findByTournamentAndCategory(tournamentId: string, categoryId: string): Promise<TeamStanding[]>;
    upsert(input: {
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
    }): Promise<TeamStanding>;
}