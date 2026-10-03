import type { BracketNode } from '../entities/bracket-node.entity.js';
import type { BracketNodeDraft } from '../services/bracket-builder.js';

/** Cambio de equipo en un lado de un cruce que depende del resultado de otro. */
export interface BracketSlotUpdate {
    nodeId: string;
    side: 'home' | 'away';
    teamId: string | null;
}

export interface BracketRepository {
    findByPhaseId(phaseId: string): Promise<BracketNode[]>;
    findById(id: string): Promise<BracketNode | null>;
    findByMatchId(matchId: string): Promise<BracketNode | null>;
    /** Cruces cuyo local o visitante sale del resultado del nodo indicado. */
    findDependents(nodeId: string): Promise<BracketNode[]>;
    /**
     * Reemplaza todo el cuadro de la fase de forma atómica. Resuelve las claves temporales
     * de los borradores a ids reales para enlazar cada nodo con su origen.
     */
    replaceAll(phaseId: string, drafts: BracketNodeDraft[]): Promise<BracketNode[]>;
    /**
     * Liga el nodo con su partido solo si todavía no tiene uno (atómico). Devuelve el nodo
     * actualizado, o null si ya tenía partido.
     */
    attachMatch(nodeId: string, matchId: string): Promise<BracketNode | null>;
    /** Guarda el ganador del nodo y los equipos de los cruces siguientes, en una transacción. */
    applyResult(
        nodeId: string,
        winnerTeamId: string | null,
        slotUpdates: BracketSlotUpdate[],
    ): Promise<void>;
}