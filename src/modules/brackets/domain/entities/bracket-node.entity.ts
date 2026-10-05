import type { BracketStage } from '../services/bracket-builder.js';

export type BracketSourceKind = 'winner' | 'loser';

export interface BracketNode {
    id: string;
    phaseId: string;
    /** Fase de grupos de la que salieron los clasificados (null en llaves generadas antes de este dato). */
    sourcePhaseId: string | null;
    stage: BracketStage;
    round: number;
    position: number;
    /** 1 = partido único; 2 = ida y vuelta. */
    legs: 1 | 2;
    homeTeamId: string | null;
    awayTeamId: string | null;
    homeSeed: number | null;
    awaySeed: number | null;
    homeSourceNodeId: string | null;
    homeSourceKind: BracketSourceKind | null;
    awaySourceNodeId: string | null;
    awaySourceKind: BracketSourceKind | null;
    /** Partido de ida (o el único partido). */
    matchId: string | null;
    /** Partido de vuelta; en él, el local es el visitante del cruce. */
    secondLegMatchId: string | null;
    /** Penales del cruce a dos partidos (respecto a homeTeamId / awayTeamId del nodo). */
    homePenalties: number | null;
    awayPenalties: number | null;
    winnerTeamId: string | null;
    createdAt: Date;
    updatedAt: Date;
}