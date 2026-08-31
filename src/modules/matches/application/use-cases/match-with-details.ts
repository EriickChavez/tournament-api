import type { Match } from '../../domain/entities/match.entity.js';
import type { Team } from '../../../teams/domain/entities/team.entity.js';
import type { Category } from '../../../categories/domain/entities/category.entity.js';

export type MatchWithDetails = Match & {
    homeTeam: Team;
    awayTeam: Team;
    category: Category;
};