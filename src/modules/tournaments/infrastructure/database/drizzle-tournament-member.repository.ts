import { and, eq } from 'drizzle-orm';
import { db } from '../../../../config/database.js';
import { tournamentMembers } from './schema.js';
import { TournamentMemberRepository } from '../../domain/repositories/tournaments-member.repository.js';
import { TournamentMember } from '../../domain/entities/tournaments-member.entity.js';

export class DrizzleTournamentMemberRepository implements TournamentMemberRepository {
    async create(input: {
        tournamentId: string;
        userId: string;
        roleId: string;
    }): Promise<TournamentMember> {
        const [row] = await db
            .insert(tournamentMembers)
            .values({ tournamentId: input.tournamentId, userId: input.userId, roleId: input.roleId })
            .returning();
        if (!row) throw new Error('Failed to create tournament member');
        return row;
    }

    async findByTournamentAndUser(tournamentId: string, userId: string): Promise<TournamentMember | null> {
        const [row] = await db
            .select()
            .from(tournamentMembers)
            .where(and(eq(tournamentMembers.tournamentId, tournamentId), eq(tournamentMembers.userId, userId)))
            .limit(1);
        return row ?? null;
    }
}