import type { MatchEvent } from '../../domain/entities/match-event.entity.js';
import type { MatchEventRepository } from '../../domain/repositories/match-event.repository.js';
import type { MatchRepository } from '../../../matches/domain/repositories/match.repository.js';
import { MatchNotFoundError } from '../../../matches/domain/errors/match.errors.js';

export class ListMatchEventsUseCase {
    constructor(
        private readonly matchEventRepository: MatchEventRepository,
        private readonly matchRepository: MatchRepository,
    ) { }

    async execute(matchId: string): Promise<MatchEvent[]> {
        const match = await this.matchRepository.findById(matchId);
        if (!match) throw new MatchNotFoundError();

        return this.matchEventRepository.findByMatchId(matchId);
    }
}
