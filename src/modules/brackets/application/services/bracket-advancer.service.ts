import type { Match } from '../../../matches/domain/entities/match.entity.js';
import type { MatchRepository } from '../../../matches/domain/repositories/match.repository.js';
import type {
    MatchBracketSync,
    MatchChangeSnapshot,
} from '../../../matches/application/ports/match-bracket-sync.port.js';
import { InvalidPenaltiesError } from '../../../matches/domain/errors/match-penalties.errors.js';
import type { BracketNode } from '../../domain/entities/bracket-node.entity.js';
import type {
    BracketRepository,
    BracketSlotUpdate,
} from '../../domain/repositories/bracket.repository.js';
import {
    determineTieWinner,
    needsPenalties,
    type LegResult,
} from '../../domain/services/tie-outcome.js';
import {
    BracketAdvanceConflictError,
    BracketMatchTeamsLockedError,
    BracketLegNotAvailableError,
    BracketPenaltiesNotApplicableError,
} from '../../domain/errors/bracket.errors.js';

type Penalties = { home: number | null; away: number | null };

/**
 * Hace avanzar la llave: cuando termina un cruce (un partido, o los dos de ida y vuelta),
 * el ganador (y el perdedor, para el tercer lugar) entran al cruce siguiente.
 * Implementa el puerto que usa matches.
 */
export class BracketAdvancer implements MatchBracketSync {
    constructor(
        private readonly bracketRepository: BracketRepository,
        private readonly matchRepository: MatchRepository,
    ) { }

    async assertCanApply(match: Match, next: MatchChangeSnapshot): Promise<void> {
        const node = await this.bracketRepository.findByMatchId(match.id);
        if (!node) return;

        // En la vuelta el local es el visitante del cruce.
        const isSecondLeg = node.secondLegMatchId === match.id;
        const expectedHome = isSecondLeg ? node.awayTeamId : node.homeTeamId;
        const expectedAway = isSecondLeg ? node.homeTeamId : node.awayTeamId;
        if (next.homeTeamId !== expectedHome || next.awayTeamId !== expectedAway) {
            throw new BracketMatchTeamsLockedError();
        }

        // Ganador del cruce tal como quedaría con el cambio.
        const legs = await this.loadLegs(node, { matchId: match.id, state: next });
        const winner = this.winnerOf(node, legs, {
            home: node.homePenalties,
            away: node.awayPenalties,
        });

        // Si el ganador no cambia, nada del cruce siguiente se ve afectado.
        if (winner === node.winnerTeamId) return;
        await this.assertNoLockedDependents(node);
    }

    async sync(matchId: string): Promise<void> {
        const node = await this.bracketRepository.findByMatchId(matchId);
        if (!node) return;

        const legs = await this.loadLegs(node);
        const winner = this.winnerOf(node, legs, {
            home: node.homePenalties,
            away: node.awayPenalties,
        });

        // Si el global ya no está empatado, los penales guardados quedaron obsoletos.
        const hasPenalties = node.homePenalties !== null || node.awayPenalties !== null;
        const stale =
            node.legs === 2 && hasPenalties && !this.needsPenaltiesFor(node, legs);

        await this.applyOutcome(node, winner, stale ? { home: null, away: null } : undefined);
    }

    async releaseForDeletion(matchId: string): Promise<void> {
        const node = await this.bracketRepository.findByMatchId(matchId);
        if (!node) return;

        await this.assertNoLockedDependents(node);

        // Sin uno de sus partidos el cruce no tiene resultado: vuelve a quedar por definir.
        await this.applyOutcome(node, null, node.legs === 2 ? { home: null, away: null } : undefined);
    }

    /**
     * Guarda (o borra, con null) los penales de un cruce a dos partidos y hace avanzar al ganador.
     * Solo aplican cuando los dos partidos terminaron y el global quedó empatado.
     */
    async applyNodePenalties(
        node: BracketNode,
        penalties: { home: number; away: number } | null,
    ): Promise<void> {
        if (node.legs !== 2) throw new BracketLegNotAvailableError();

        const legs = await this.loadLegs(node);
        if (penalties !== null) {
            if (!this.needsPenaltiesFor(node, legs)) throw new BracketPenaltiesNotApplicableError();
            if (penalties.home === penalties.away) {
                throw new InvalidPenaltiesError('A penalty shootout cannot end tied.');
            }
        }

        const next: Penalties = penalties ?? { home: null, away: null };
        const winner = this.winnerOf(node, legs, next);
        if (winner !== node.winnerTeamId) await this.assertNoLockedDependents(node);

        await this.applyOutcome(node, winner, next);
    }

    // ---- internos ----

    private needsPenaltiesFor(node: BracketNode, legs: LegResult[]): boolean {
        if (node.homeTeamId === null || node.awayTeamId === null) return false;
        return needsPenalties(
            { homeTeamId: node.homeTeamId, awayTeamId: node.awayTeamId, legs: node.legs },
            legs,
        );
    }

    private winnerOf(node: BracketNode, legs: LegResult[], penalties: Penalties): string | null {
        if (node.homeTeamId === null || node.awayTeamId === null) return null;
        return determineTieWinner(
            {
                homeTeamId: node.homeTeamId,
                awayTeamId: node.awayTeamId,
                legs: node.legs,
                penalties,
            },
            legs,
        );
    }

    /**
     * Los partidos que existen del cruce, en orden (ida, vuelta). Si se pasa `override`, ese
     * partido se toma con el estado propuesto en vez del guardado.
     */
    private async loadLegs(
        node: BracketNode,
        override?: { matchId: string; state: MatchChangeSnapshot },
    ): Promise<LegResult[]> {
        const legs: LegResult[] = [];
        for (const id of [node.matchId, node.secondLegMatchId]) {
            if (!id) continue;
            if (override && override.matchId === id) {
                legs.push(override.state);
                continue;
            }
            const match = await this.matchRepository.findById(id);
            if (match) legs.push(match);
        }
        return legs;
    }

    private async assertNoLockedDependents(node: BracketNode): Promise<void> {
        const dependents = await this.bracketRepository.findDependents(node.id);
        if (
            dependents.some(
                (dependent) => dependent.matchId !== null || dependent.secondLegMatchId !== null,
            )
        ) {
            throw new BracketAdvanceConflictError();
        }
    }

    private async applyOutcome(
        node: BracketNode,
        winner: string | null,
        penalties?: Penalties,
    ): Promise<void> {
        const loser =
            winner && node.homeTeamId && node.awayTeamId
                ? winner === node.homeTeamId
                    ? node.awayTeamId
                    : node.homeTeamId
                : null;

        const dependents = await this.bracketRepository.findDependents(node.id);
        await this.bracketRepository.applyResult(
            node.id,
            winner,
            this.slotUpdates(node, dependents, winner, loser),
            penalties,
        );
    }

    /** Qué equipo entra en cada lado de los cruces que dependen de este nodo. */
    private slotUpdates(
        node: BracketNode,
        dependents: BracketNode[],
        winner: string | null,
        loser: string | null,
    ): BracketSlotUpdate[] {
        const updates: BracketSlotUpdate[] = [];
        for (const dependent of dependents) {
            if (dependent.homeSourceNodeId === node.id) {
                updates.push({
                    nodeId: dependent.id,
                    side: 'home',
                    teamId: dependent.homeSourceKind === 'loser' ? loser : winner,
                });
            }
            if (dependent.awaySourceNodeId === node.id) {
                updates.push({
                    nodeId: dependent.id,
                    side: 'away',
                    teamId: dependent.awaySourceKind === 'loser' ? loser : winner,
                });
            }
        }
        return updates;
    }
}