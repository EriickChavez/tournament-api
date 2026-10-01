export interface StandingMatch {
    homeTeamId: string;
    awayTeamId: string;
    homeGoals: number;
    awayGoals: number;
}

export interface StandingRow {
    teamId: string;
    position: number;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
    /**
     * Identifica el conjunto de equipos que siguen empatados después de todos los
     * desempates (requieren decisión manual). null si no hay empate.
     */
    tieGroup: number | null;
    /** true si el orden de este equipo lo decidió el admin (desempate manual). */
    resolvedManually: boolean;
}

interface Stats {
    teamId: string;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    points: number;
}

const goalDifference = (s: Stats): number => s.goalsFor - s.goalsAgainst;

const sameKey = (a: Stats, b: Stats): boolean =>
    a.points === b.points &&
    goalDifference(a) === goalDifference(b) &&
    a.goalsFor === b.goalsFor;

// Orden de desempate: puntos, diferencia de goles, goles a favor.
const compareStats = (a: Stats, b: Stats): number =>
    b.points - a.points ||
    goalDifference(b) - goalDifference(a) ||
    b.goalsFor - a.goalsFor ||
    a.teamId.localeCompare(b.teamId); // solo para que el orden sea determinista

function accumulate(teamIds: string[], matches: StandingMatch[]): Map<string, Stats> {
    const stats = new Map<string, Stats>(
        teamIds.map((teamId) => [
            teamId,
            { teamId, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0 },
        ]),
    );

    for (const match of matches) {
        const home = stats.get(match.homeTeamId);
        const away = stats.get(match.awayTeamId);
        if (!home || !away) continue; // solo cuentan partidos entre equipos del conjunto

        home.played += 1;
        away.played += 1;
        home.goalsFor += match.homeGoals;
        home.goalsAgainst += match.awayGoals;
        away.goalsFor += match.awayGoals;
        away.goalsAgainst += match.homeGoals;

        if (match.homeGoals > match.awayGoals) {
            home.won += 1;
            away.lost += 1;
            home.points += 3;
        } else if (match.homeGoals < match.awayGoals) {
            away.won += 1;
            home.lost += 1;
            away.points += 3;
        } else {
            home.drawn += 1;
            away.drawn += 1;
            home.points += 1;
            away.points += 1;
        }
    }

    return stats;
}

/** Parte una lista ya ordenada en bloques de equipos con la misma clave (puntos, DG, GF). */
function splitByKey(sorted: Stats[]): Stats[][] {
    const blocks: Stats[][] = [];
    for (const item of sorted) {
        const block = blocks[blocks.length - 1];
        const head = block?.[0];
        if (block && head && sameKey(head, item)) block.push(item);
        else blocks.push([item]);
    }
    return blocks;
}

/**
 * Tabla de un grupo con los desempates de la plataforma:
 * 1) puntos, 2) diferencia de goles, 3) goles a favor, 4) head-to-head entre los empatados,
 * 5) decisión manual del admin. Si aun así quedan empatados, se marcan con `tieGroup`.
 * Solo recibe partidos terminados; los que no involucran a dos equipos del grupo se ignoran.
 */
export function computeGroupStandings(
    teamIds: string[],
    matches: StandingMatch[],
    /** Decisión manual del admin: menor número = mejor posición. Solo aplica a empates sin resolver. */
    manualRanks?: ReadonlyMap<string, number>,
): StandingRow[] {
    const overall = accumulate(teamIds, matches);
    const sorted = [...overall.values()].sort(compareStats);

    const rows: StandingRow[] = [];
    let nextTieGroup = 1;

    const push = (stats: Stats, tieGroup: number | null, resolvedManually = false) => {
        rows.push({
            teamId: stats.teamId,
            position: rows.length + 1,
            played: stats.played,
            won: stats.won,
            drawn: stats.drawn,
            lost: stats.lost,
            goalsFor: stats.goalsFor,
            goalsAgainst: stats.goalsAgainst,
            goalDifference: goalDifference(stats),
            points: stats.points,
            tieGroup,
            resolvedManually,
        });
    };

    // El empate queda resuelto solo si todos tienen número manual y no se repite.
    const isFullyRanked = (items: Stats[]): boolean => {
        const ranks = items.map((s) => manualRanks?.get(s.teamId));
        return (
            ranks.every((r): r is number => r !== undefined) &&
            new Set(ranks).size === ranks.length
        );
    };

    for (const block of splitByKey(sorted)) {
        if (block.length === 1) {
            const only = block[0];
            if (only) push(only, null);
            continue;
        }

        // Head-to-head: mini-tabla solo con los partidos entre los equipos empatados.
        const miniStats = accumulate(
            block.map((s) => s.teamId),
            matches,
        );
        const miniOf = (s: Stats): Stats => miniStats.get(s.teamId) ?? s;
        const ordered = [...block].sort((a, b) => compareStats(miniOf(a), miniOf(b)));

        // Sub-bloques que siguen iguales en la mini-tabla: empate sin resolver.
        let subBlock: Stats[] = [];
        const flush = () => {
            if (subBlock.length === 0) return;
            if (subBlock.length === 1 || subBlock.every((s) => s.played === 0)) {
                // Un solo equipo, o grupo que aún no juega: no hay empate real que resolver.
                for (const s of subBlock) push(s, null);
            } else if (isFullyRanked(subBlock)) {
                // El admin ya decidió el orden de todos los empatados.
                const rankOf = (s: Stats) => manualRanks?.get(s.teamId) ?? 0;
                for (const s of [...subBlock].sort((a, b) => rankOf(a) - rankOf(b))) {
                    push(s, null, true);
                }
            } else {
                const tieGroup = nextTieGroup;
                nextTieGroup += 1;
                for (const s of subBlock) push(s, tieGroup);
            }
            subBlock = [];
        };

        for (const item of ordered) {
            const head = subBlock[0];
            if (head && !sameKey(miniOf(head), miniOf(item))) flush();
            subBlock.push(item);
        }
        flush();
    }

    return rows;
}