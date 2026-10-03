import type { Match } from '../../../matches/domain/entities/match.entity.js';
import type { MatchRepository } from '../../../matches/domain/repositories/match.repository.js';
import type {
    MatchBracketSync,
    MatchChangeSnapshot,
} from '../../../matches/application/ports/match-bracket-sync.port.js';
import { determineWinnerTeamId } from '../../../matches/domain/services/match-outcome.js';
import type { BracketNode } from '../../domain/entities/bracket-node.entity.js';
import type {
    BracketRepository,
    BracketSlotUpdate,
} from '../../domain/repositories/bracket.repository.js';
import {
    BracketAdvanceConflictError,
    BracketMatchTeamsLockedError,
} from '../../domain/errors/bracket.errors.js';

/**
 * Hace avanzar la llave: cuando un partido de un cruce termina, el ganador (y el perdedor,
 * para el tercer lugar) entran al cruce siguiente. Implementa el puerto que usa matches.
 */
export class BracketAdvancer implements MatchBracketSync {
    constructor(
        private readonly bracketRepository: BracketRepository,
        private readonly matchRepository: MatchRepository,
    ) { }

    async assertCanApply(match: Match, next: MatchChangeSnapshot): Promise<void> {
        const node = await this.bracketRepository.findByMatchId(match.id);
        if (!node) return;

        // Los equipos de un cruce vienen de la llave; cambiarlos la dejaría incoherente.
        if (next.homeTeamId !== node.homeTeamId || next.awayTeamId !== node.awayTeamId) {
            throw new BracketMatchTeamsLockedError();
        }

        // Si el ganador no cambia, nada del cruce siguiente se ve afectado.
        if (determineWinnerTeamId(next) === node.winnerTeamId) return;

        // Si cambia, el cruce siguiente no debe tener ya un partido armado con el ganador anterior.
        const dependents = await this.bracketRepository.findDependents(node.id);
        if (dependents.some((dependent) => dependent.matchId !== null)) {
            throw new BracketAdvanceConflictError();
        }
    }

    async sync(matchId: string): Promise<void> {
        const node = await this.bracketRepository.findByMatchId(matchId);
        if (!node) return;

        const match = await this.matchRepository.findById(matchId);
        if (!match) return;

        const winner = determineWinnerTeamId(match);
        const loser = winner ? (winner === match.homeTeamId ? match.awayTeamId : match.homeTeamId) : null;

        const dependents = await this.bracketRepository.findDependents(node.id);
        await this.bracketRepository.applyResult(
            node.id,
            winner,
            this.slotUpdates(node, dependents, winner, loser),
        );
    }

    async releaseForDeletion(matchId: string): Promise<void> {
        const node = await this.bracketRepository.findByMatchId(matchId);
        if (!node) return;

        const dependents = await this.bracketRepository.findDependents(node.id);
        if (dependents.some((dependent) => dependent.matchId !== null)) {
            throw new BracketAdvanceConflictError();
        }

        // Sin partido no hay resultado: el cruce y los siguientes vuelven a quedar por definir.
        await this.bracketRepository.applyResult(
            node.id,
            null,
            this.slotUpdates(node, dependents, null, null),
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