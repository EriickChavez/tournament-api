import type { BracketStage } from '../services/bracket-builder.js';

export type BracketSourceKind = 'winner' | 'loser';

export interface BracketNode {
    id: string;
    phaseId: string;
    stage: BracketStage;
    round: number;
    position: number;
    homeTeamId: string | null;
    awayTeamId: string | null;
    homeSeed: number | null;
    awaySeed: number | null;
    homeSourceNodeId: string | null;
    homeSourceKind: BracketSourceKind | null;
    awaySourceNodeId: string | null;
    awaySourceKind: BracketSourceKind | null;
    matchId: string | null;
    winnerTeamId: string | null;
    createdAt: Date;
    updatedAt: Date;
}