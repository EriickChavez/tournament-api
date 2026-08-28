import type { TeamStanding } from '../../domain/entities/team-standing.entity.js';
import type { TopScorer } from '../../domain/entities/top-scorer.entity.js';
import type { CardCount } from '../../domain/entities/card-count.entity.js';

export function toPublicTeamStanding(standing: TeamStanding) {
    return {
        teamId: standing.teamId,
        played: standing.played,
        won: standing.won,
        drawn: standing.drawn,
        lost: standing.lost,
        goalsFor: standing.goalsFor,
        goalsAgainst: standing.goalsAgainst,
        goalDifference: standing.goalDifference,
        points: standing.points,
    };
}

export function toPublicTopScorer(scorer: TopScorer) {
    return { playerId: scorer.playerId, goals: scorer.goals, assists: scorer.assists };
}

export function toPublicCardCount(card: CardCount) {
    return { playerId: card.playerId, yellowCards: card.yellowCards, redCards: card.redCards };
}