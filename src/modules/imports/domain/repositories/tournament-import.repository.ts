import type { ImportPlan } from '../entities/import-plan.js';

export interface ExistingTeam {
    id: string;
    name: string;
    categoryId: string;
}

export interface ExistingPlayer {
    teamId: string;
    firstName: string;
    lastName: string;
    number: number | null;
}

export interface TournamentImportRepository {
    findExistingTeams(tournamentId: string, names: string[]): Promise<ExistingTeam[]>;
    findPlayersByTeamIds(teamIds: string[]): Promise<ExistingPlayer[]>;
    /** Inserta equipos y jugadores en una sola transacción (todo o nada). */
    importAll(plan: ImportPlan): Promise<void>;
}