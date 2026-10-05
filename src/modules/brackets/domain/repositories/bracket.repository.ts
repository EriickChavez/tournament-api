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
    /** Busca el cruce por cualquiera de sus dos partidos (ida o vuelta). */
    findByMatchId(matchId: string): Promise<BracketNode | null>;
    /** Cruces cuyo local o visitante sale del resultado del nodo indicado. */
    findDependents(nodeId: string): Promise<BracketNode[]>;
    /** true si existe alguna llave generada a partir de esa fase de grupos. */
    existsBySourcePhaseId(sourcePhaseId: string): Promise<boolean>;
    /**
     * Reemplaza todo el cuadro de la fase de forma atómica, guardando de qué fase de grupos
     * sale. Resuelve las claves temporales de los borradores a ids reales para enlazar cada
     * nodo con su origen.
     */
    replaceAll(
        phaseId: string,
        sourcePhaseId: string,
        drafts: BracketNodeDraft[],
    ): Promise<BracketNode[]>;
    /** Elimina todos los nodos de la llave de una fase. */
    deleteByPhaseId(phaseId: string): Promise<void>;
    /**
     * Liga el nodo con su partido de ida (leg 1) o de vuelta (leg 2) solo si ese lugar está
     * libre (atómico). Devuelve el nodo actualizado, o null si ya tenía partido.
     */
    attachMatch(nodeId: string, leg: 1 | 2, matchId: string): Promise<BracketNode | null>;
    /**
     * Guarda el ganador del nodo y los equipos de los cruces siguientes, en una transacción.
     * Si se pasan `penalties`, también reemplaza los penales del cruce (null = borrarlos).
     */
    applyResult(
        nodeId: string,
        winnerTeamId: string | null,
        slotUpdates: BracketSlotUpdate[],
        penalties?: { home: number | null; away: number | null },
    ): Promise<void>;
}