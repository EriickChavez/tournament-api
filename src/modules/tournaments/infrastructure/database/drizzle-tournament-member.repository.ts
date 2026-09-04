import { and, asc, eq, sql } from 'drizzle-orm';
import { db } from '../../../../config/database.js';
import { roles, tournamentMembers } from './schema.js';
import { TournamentMemberRepository } from '../../domain/repositories/tournaments-member.repository.js';
import { TournamentMember, TournamentMemberWithUser } from '../../domain/entities/tournaments-member.entity.js';
import { users } from '../../../auth/infrastructure/database/schema.js';
import { toOffset, type PaginationParams, type Paginated } from '../../../../shared/utils/pagination.js';

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

    async findById(id: string): Promise<TournamentMember | null> {
        const [row] = await db.select().from(tournamentMembers).where(eq(tournamentMembers.id, id)).limit(1);
        return row ?? null;
    }

    async listByTournament(
        tournamentId: string,
        pagination: PaginationParams,
    ): Promise<Paginated<TournamentMemberWithUser>> {
        const condition = eq(tournamentMembers.tournamentId, tournamentId);

        const [rows, countRows] = await Promise.all([
            db
                .select({
                    id: tournamentMembers.id,
                    tournamentId: tournamentMembers.tournamentId,
                    userId: tournamentMembers.userId,
                    roleId: tournamentMembers.roleId,
                    status: tournamentMembers.status,
                    createdAt: tournamentMembers.createdAt,
                    updatedAt: tournamentMembers.updatedAt,
                    displayName: users.displayName,
                    avatarUrl: users.avatarUrl,
                    roleName: roles.name,
                })
                .from(tournamentMembers)
                .innerJoin(users, eq(tournamentMembers.userId, users.id))
                .innerJoin(roles, eq(tournamentMembers.roleId, roles.id))
                .where(condition)
                .orderBy(asc(users.displayName))
                .limit(pagination.limit)
                .offset(toOffset(pagination)),
            db
                .select({ count: sql<number>`count(*)::int` })
                .from(tournamentMembers)
                .where(condition),
        ]);

        return {
            items: rows,
            total: countRows[0]?.count ?? 0,
        };
    }

    async updateRole(id: string, roleId: string): Promise<TournamentMember> {
        const [row] = await db
            .update(tournamentMembers)
            .set({ roleId, updatedAt: new Date() })
            .where(eq(tournamentMembers.id, id))
            .returning();
        if (!row) throw new Error('Failed to update tournament member');
        return row;
    }

    async delete(id: string): Promise<void> {
        const result = await db.delete(tournamentMembers).where(eq(tournamentMembers.id, id)).returning();
        if (!result[0]) throw new Error('Failed to delete tournament member');
    }
}