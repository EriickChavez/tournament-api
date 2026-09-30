import { CellValue } from 'exceljs';
import { z } from 'zod';
import { ImportRowError } from '../../domain/errors/import.errors';
import { SheetRow } from './spreadsheet-parser.port';

export const TEAMS_SHEET = 'Equipos';
export const PLAYERS_SHEET = 'Jugadores';

export const TEAM_COLUMNS = {
    required: ['categoria', 'nombre'],
    optional: ['abreviatura', 'logo_url'],
};
export const PLAYER_COLUMNS = {
    required: ['equipo', 'nombre', 'apellido', 'numero'],
    optional: ['fecha_nacimiento', 'capitan', 'posicion'],
};
export const MAX_TEAMS = 500;
export const MAX_PLAYERS = 10_000;

// Mismos límites que createTeamSchema / createPlayerSchema, con los nombres de columna del Excel.
const teamRowSchema = z.object({
    categoria: z.string().min(1).max(200),
    nombre: z.string().min(1).max(200),
    abreviatura: z.string().max(50).optional(),
    logo_url: z.string().url().max(500).optional(),
});

const isRealDate = (value: string): boolean =>
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;

const playerRowSchema = z.object({
    equipo: z.string().min(1).max(200),
    nombre: z.string().min(1).max(120),
    apellido: z.string().min(1).max(120),
    fecha_nacimiento: z
        .string()
        .refine(isRealDate, 'Use a real date in YYYY-MM-DD format.')
        .optional(),
    numero: z.number().int().min(0).max(999),
    capitan: z.enum(['SI', 'NO']).optional(),
    posicion: z.string().max(50).optional(),
});

// ---- Normalización de celdas: Excel entrega tipos mezclados (número, fecha, texto) ----

function asText(value: CellValue | undefined): string | undefined {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'string') return value.trim() || undefined;
    if (typeof value === 'number') return String(value);
    return undefined;
}

function asNumber(value: CellValue | undefined): number | string | undefined {
    if (value === null || value === undefined) return undefined;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const text = value.trim();
        if (text === '') return undefined;
        return /^\d+$/.test(text) ? Number(text) : text; // si no es número, Zod lo rechaza
    }
    return undefined;
}

function asIsoDate(value: CellValue | undefined): string | undefined {
    if (value === null || value === undefined) return undefined;
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? 'invalid' : value.toISOString().slice(0, 10);
    }
    if (typeof value === 'number') {
        // Número serial de Excel (días desde 1899-12-30).
        const date = new Date(Math.round((value - 25569) * 86_400_000));
        return Number.isNaN(date.getTime()) ? 'invalid' : date.toISOString().slice(0, 10);
    }
    if (typeof value === 'string') return value.trim() || undefined;
    return undefined;
}

function asYesNo(value: CellValue | undefined): string | undefined {
    const text = asText(value);
    if (!text) return undefined;
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase(); // acepta "Sí", "si", "SI"
}

export interface ValidTeamRow {
    row: number;
    categoryTitle: string;
    name: string;
    abbreviation: string | null;
    logoUrl: string | null;
}

export interface ValidPlayerRow {
    row: number;
    teamName: string;
    firstName: string;
    lastName: string;
    birthDate: string | null;
    number: number;
    isCaptain: boolean;
    role: string | null;
}

function pushZodIssues(
    errors: ImportRowError[],
    sheet: string,
    row: number,
    error: z.ZodError,
): void {
    for (const issue of error.issues) {
        errors.push({ sheet, row, field: String(issue.path[0] ?? ''), message: issue.message });
    }
}

export function validateRows(
    teamRows: SheetRow[],
    playerRows: SheetRow[],
): { teams: ValidTeamRow[]; players: ValidPlayerRow[]; errors: ImportRowError[] } {
    const errors: ImportRowError[] = [];
    const teams: ValidTeamRow[] = [];
    const players: ValidPlayerRow[] = [];

    const teamRowByName = new Map<string, number>();
    for (const { rowNumber, cells } of teamRows) {
        const parsed = teamRowSchema.safeParse({
            categoria: asText(cells.categoria),
            nombre: asText(cells.nombre),
            abreviatura: asText(cells.abreviatura),
            logo_url: asText(cells.logo_url),
        });
        if (!parsed.success) {
            pushZodIssues(errors, TEAMS_SHEET, rowNumber, parsed.error);
            continue;
        }
        const data = parsed.data;
        const firstRow = teamRowByName.get(data.nombre);
        if (firstRow !== undefined) {
            errors.push({
                sheet: TEAMS_SHEET,
                row: rowNumber,
                field: 'nombre',
                message: `Duplicate team "${data.nombre}" (already on row ${firstRow}).`,
            });
            continue;
        }
        teamRowByName.set(data.nombre, rowNumber);
        teams.push({
            row: rowNumber,
            categoryTitle: data.categoria,
            name: data.nombre,
            abbreviation: data.abreviatura ?? null,
            logoUrl: data.logo_url ?? null,
        });
    }

    const jerseyRow = new Map<string, number>();
    for (const { rowNumber, cells } of playerRows) {
        const parsed = playerRowSchema.safeParse({
            equipo: asText(cells.equipo),
            nombre: asText(cells.nombre),
            apellido: asText(cells.apellido),
            fecha_nacimiento: asIsoDate(cells.fecha_nacimiento),
            numero: asNumber(cells.numero),
            capitan: asYesNo(cells.capitan),
            posicion: asText(cells.posicion),
        });
        if (!parsed.success) {
            pushZodIssues(errors, PLAYERS_SHEET, rowNumber, parsed.error);
            continue;
        }
        const data = parsed.data;
        if (!teamRowByName.has(data.equipo)) {
            errors.push({
                sheet: PLAYERS_SHEET,
                row: rowNumber,
                field: 'equipo',
                message: `Team "${data.equipo}" does not exist in the "${TEAMS_SHEET}" sheet.`,
            });
            continue;
        }
        const key = `${data.equipo}#${data.numero}`;
        const firstRow = jerseyRow.get(key);
        if (firstRow !== undefined) {
            errors.push({
                sheet: PLAYERS_SHEET,
                row: rowNumber,
                field: 'numero',
                message: `Jersey number ${data.numero} is already used in "${data.equipo}" (row ${firstRow}).`,
            });
            continue;
        }
        jerseyRow.set(key, rowNumber);
        players.push({
            row: rowNumber,
            teamName: data.equipo,
            firstName: data.nombre,
            lastName: data.apellido,
            birthDate: data.fecha_nacimiento ?? null,
            number: data.numero,
            isCaptain: data.capitan === 'SI',
            role: data.posicion ?? null,
        });
    }

    return { teams, players, errors };
}