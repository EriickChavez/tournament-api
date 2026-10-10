import { randomUUID } from 'node:crypto';
import { env } from '../../../../config/env.js';
import type { CompetitionGuard } from '../../../../shared/ports/competition-guard.port.js';
import type { TournamentRepository } from '../../../tournaments/domain/repositories/tournaments.repository.js';
import type { TournamentMemberRepository } from '../../../tournaments/domain/repositories/tournaments-member.repository.js';
import type { CategoryRepository } from '../../../categories/domain/repositories/category.repository.js';
import {
    TournamentNotFoundError,
    NotTournamentOwnerError,
} from '../../../tournaments/domain/errors/tournaments.errors.js';
import type { TournamentImportRepository } from '../../domain/repositories/tournament-import.repository.js';
import type { ImportPlan, ImportSummary } from '../../domain/entities/import-plan.js';
import { ImportValidationError, type ImportRowError } from '../../domain/errors/import.errors.js';
import type { SpreadsheetParser } from '../ports/spreadsheet-parser.port.js';
import { TEAMS_SHEET, TEAM_COLUMNS, MAX_TEAMS, PLAYERS_SHEET, PLAYER_COLUMNS, MAX_PLAYERS, validateRows } from '../ports/import-rows.js';


const MAX_REPORTED_ERRORS = 100;

function normalizeText(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

// Clave para detectar "el mismo jugador": nombre y apellido sin mayúsculas ni acentos.
const nameKey = (firstName: string, lastName: string): string =>
    `${normalizeText(firstName)}|${normalizeText(lastName)}`;

interface TeamRef {
    id: string;
    categoryId: string;
    isExisting: boolean;
}

export class ImportTournamentDataUseCase {
    constructor(
        private readonly parser: SpreadsheetParser,
        private readonly importRepository: TournamentImportRepository,
        private readonly tournamentRepository: TournamentRepository,
        private readonly tournamentMemberRepository: TournamentMemberRepository,
        private readonly categoryRepository: CategoryRepository,
        private readonly competitionGuard: CompetitionGuard,
    ) { }

    async execute(input: {
        tournamentId: string;
        userId: string;
        file: Buffer;
        dryRun: boolean;
    }): Promise<ImportSummary> {
        const tournament = await this.tournamentRepository.findById(input.tournamentId);
        if (!tournament) throw new TournamentNotFoundError();

        const member = await this.tournamentMemberRepository.findByTournamentAndUser(
            input.tournamentId,
            input.userId,
        );
        if (!member || member.roleId !== env.OWNER_ROLE_ID) throw new NotTournamentOwnerError();

        const sheets = await this.parser.parse(input.file, [
            {
                name: TEAMS_SHEET,
                requiredColumns: TEAM_COLUMNS.required,
                optionalColumns: TEAM_COLUMNS.optional,
                maxRows: MAX_TEAMS,
            },
            {
                name: PLAYERS_SHEET,
                requiredColumns: PLAYER_COLUMNS.required,
                optionalColumns: PLAYER_COLUMNS.optional,
                maxRows: MAX_PLAYERS,
            },
        ]);

        const { teams, players, errors } = validateRows(
            sheets[TEAMS_SHEET] ?? [],
            sheets[PLAYERS_SHEET] ?? [],
        );
        const allErrors: ImportRowError[] = [...errors];

        // Categorías: deben existir en el torneo (se comparan por título, sin distinguir mayúsculas).
        const categories = await this.categoryRepository.findByTournamentId(input.tournamentId);
        const categoryIdByTitle = new Map(
            categories.map((c) => [c.title.trim().toLowerCase(), c.id]),
        );

        // Equipos que ya existen y sus jugadores actuales.
        const existingTeams = await this.importRepository.findExistingTeams(
            input.tournamentId,
            teams.map((t) => t.name),
        );
        const existingTeamByName = new Map(existingTeams.map((t) => [t.name, t]));
        const existingPlayers = await this.importRepository.findPlayersByTeamIds(
            existingTeams.map((t) => t.id),
        );

        const namesByTeamId = new Map<string, Set<string>>();
        const numbersByTeamId = new Map<string, Map<number, string>>();
        for (const p of existingPlayers) {
            const names = namesByTeamId.get(p.teamId) ?? new Set<string>();
            names.add(nameKey(p.firstName, p.lastName));
            namesByTeamId.set(p.teamId, names);

            if (p.number !== null) {
                const numbers = numbersByTeamId.get(p.teamId) ?? new Map<number, string>();
                numbers.set(p.number, `${p.firstName} ${p.lastName}`);
                numbersByTeamId.set(p.teamId, numbers);
            }
        }

        // Los IDs de equipos nuevos se generan aquí (no en la BD) para enlazar jugadores
        // sin depender del orden del RETURNING.
        const teamRefs = new Map<string, TeamRef>();
        const planTeams: ImportPlan['teams'] = [];

        for (const team of teams) {
            const categoryId = categoryIdByTitle.get(team.categoryTitle.toLowerCase());
            if (!categoryId) {
                allErrors.push({
                    sheet: TEAMS_SHEET,
                    row: team.row,
                    field: 'categoria',
                    message: `Category "${team.categoryTitle}" does not exist in this tournament. Create it first.`,
                });
                continue;
            }

            const existing = existingTeamByName.get(team.name);
            if (existing) {
                if (existing.categoryId !== categoryId) {
                    allErrors.push({
                        sheet: TEAMS_SHEET,
                        row: team.row,
                        field: 'categoria',
                        message: `Team "${team.name}" already exists in a different category.`,
                    });
                    continue;
                }
                teamRefs.set(team.name, { id: existing.id, categoryId, isExisting: true });
                continue;
            }

            const id = randomUUID();
            teamRefs.set(team.name, { id, categoryId, isExisting: false });
            planTeams.push({
                id,
                categoryId,
                name: team.name,
                abbreviation: team.abbreviation,
                logoUrl: team.logoUrl,
            });
        }

        let playersSkipped = 0;
        const planPlayers: ImportPlan['players'] = [];

        for (const player of players) {
            const ref = teamRefs.get(player.teamName);
            if (!ref) continue; // el equipo ya tiene un error reportado

            if (ref.isExisting) {
                const alreadyThere = namesByTeamId
                    .get(ref.id)
                    ?.has(nameKey(player.firstName, player.lastName));
                if (alreadyThere) {
                    playersSkipped += 1;
                    continue;
                }

                const numberOwner = numbersByTeamId.get(ref.id)?.get(player.number);
                if (numberOwner !== undefined) {
                    allErrors.push({
                        sheet: PLAYERS_SHEET,
                        row: player.row,
                        field: 'numero',
                        message: `Jersey number ${player.number} is already used by ${numberOwner} in "${player.teamName}".`,
                    });
                    continue;
                }
            }

            planPlayers.push({
                id: randomUUID(),
                categoryId: ref.categoryId,
                teamId: ref.id,
                firstName: player.firstName,
                lastName: player.lastName,
                birthDate: player.birthDate,
                number: player.number,
                isCaptain: player.isCaptain,
                role: player.role,
            });
        }

        // Solo se revisan las categorías a las que de verdad se agregarían equipos o jugadores:
        // volver a subir el mismo archivo (todo omitido) no falla aunque la categoría ya empezara.
        const touchedCategoryIds = new Set<string>([
            ...planTeams.map((team) => team.categoryId),
            ...planPlayers.map((player) => player.categoryId),
        ]);
        for (const categoryId of touchedCategoryIds) {
            await this.competitionGuard.assertRosterOpen(categoryId);
        }

        if (allErrors.length > 0) {
            allErrors.sort((a, b) => a.sheet.localeCompare(b.sheet) || a.row - b.row);
            throw new ImportValidationError(allErrors.slice(0, MAX_REPORTED_ERRORS), allErrors.length);
        }

        const plan: ImportPlan = {
            tournamentId: input.tournamentId,
            userId: input.userId,
            teams: planTeams,
            players: planPlayers,
        };

        if (!input.dryRun) await this.importRepository.importAll(plan);

        return {
            teamsCreated: plan.teams.length,
            teamsExisting: teamRefs.size - plan.teams.length,
            playersCreated: plan.players.length,
            playersSkipped,
        };
    }
}