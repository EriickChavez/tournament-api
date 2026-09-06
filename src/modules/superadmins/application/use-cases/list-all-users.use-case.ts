import { db } from '../../../../config/database.js';
import { tournamentMembers, roles, tournaments } from '../../../tournaments/infrastructure/database/schema.js';
import { users } from '../../../auth/infrastructure/database/schema.js';
import { eq, asc, sql } from 'drizzle-orm';
import { toOffset, type PaginationParams, type Paginated } from '../../../../shared/utils/pagination.js';

export interface UserOverviewRow {
    userId: string;
    memberId: string | null;
    displayName: string;
    email: string;
    avatarUrl: string | null;
    roleId: string | null;
    roleName: string | null;
    tournamentId: string | null;
    tournamentName: string | null;
    tournamentStartDate: string | null;
    tournamentEndDate: string | null;
}

export class ListAllUsersUseCase {
    async execute(pagination: PaginationParams): Promise<Paginated<UserOverviewRow>> {
        const [rows, countRows] = await Promise.all([
            db
                .select({
                    userId: users.id,
                    memberId: tournamentMembers.id,
                    displayName: users.displayName,
                    email: users.email,
                    avatarUrl: users.avatarUrl,
                    roleId: roles.id,
                    roleName: roles.name,
                    tournamentId: tournaments.id,
                    tournamentName: tournaments.name,
                    tournamentStartDate: tournaments.startDate,
                    tournamentEndDate: tournaments.endDate,
                })
                .from(users)
                .leftJoin(tournamentMembers, eq(tournamentMembers.userId, users.id))
                .leftJoin(roles, eq(tournamentMembers.roleId, roles.id))
                .leftJoin(tournaments, eq(tournamentMembers.tournamentId, tournaments.id))
                .orderBy(asc(users.displayName))
                .limit(pagination.limit)
                .offset(toOffset(pagination)),
            db.select({ count: sql<number>`count(*)::int` }).from(users),
        ]);

        return { items: rows, total: countRows[0]?.count ?? 0 };
    }
}