import { eq } from 'drizzle-orm';
import { db } from '../../../../config/database.js';
import { matches } from './schema.js';
import { lockMatch, syncMatchScore } from './match-score-sync.js';
import { DrizzleMatchRepository } from './drizzle-match.repository.js';
import type { MatchLifecycleRepository } from '../../domain/repositories/match-lifecycle.repository.js';
import type { Match, MatchStatus } from '../../domain/entities/match.entity.js';
import {
    MatchNotFoundError,
    InvalidMatchTransitionError,
} from '../../domain/errors/match.errors.js';

export class DrizzleMatchLifecycleRepository implements MatchLifecycleRepository {
    private readonly matchRepository = new DrizzleMatchRepository();

    async transition(input: {
        matchId: string;
        from: MatchStatus[];
        to: MatchStatus;
        userId: string;
    }): Promise<Match> {
        await db.transaction(async (tx) => {
            const match = await lockMatch(tx, input.matchId);
            if (!match) throw new MatchNotFoundError();
            if (!input.from.includes(match.status as MatchStatus)) {
                throw new InvalidMatchTransitionError(match.status, input.to);
            }

            if (input.to === 'finished') await syncMatchScore(tx, match, input.userId);

            await tx
                .update(matches)
                .set({ status: input.to, updatedByUserId: input.userId, updatedAt: new Date() })
                .where(eq(matches.id, input.matchId));
        });

        const updated = await this.matchRepository.findById(input.matchId);
        if (!updated) throw new MatchNotFoundError();
        return updated;
    }
}