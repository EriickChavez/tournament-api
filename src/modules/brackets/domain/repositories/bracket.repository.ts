import type { BracketNode } from '../entities/bracket-node.entity.js';
import type { BracketNodeDraft } from '../services/bracket-builder.js';

export interface BracketRepository {
    findByPhaseId(phaseId: string): Promise<BracketNode[]>;
    findById(id: string): Promise<BracketNode | null>;
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
}