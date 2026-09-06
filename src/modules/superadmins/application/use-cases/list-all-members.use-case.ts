import { db } from '../../../../config/database.js';
import { tournamentMembers, roles } from '../../../tournaments/infrastructure/database/schema.js';
import { tournaments } from '../../../tournaments/infrastructure/database/schema.js';
import { users } from '../../../auth/infrastructure/database/schema.js';
import { eq, asc, sql } from 'drizzle-orm';
import { toOffset, type PaginationParams, type Paginated } from '../../../../shared/utils/pagination.js';

export interface MemberOverviewRow {
    id: string;
    displayName: string;
    email: string;
    avatarUrl: string | null;
    roleName: string;
    tournamentName: string;
    tournamentStartDate: string | null;
    tournamentEndDate: string | null;
}

export class ListAllMembersUseCase {
    async execute(pagination: PaginationParams): Promise<Paginated<MemberOverviewRow>> {
        const [rows, countRows] = await Promise.all([
            db
                .select({
                    id: tournamentMembers.id,
                    displayName: users.displayName,
                    email: users.email,
                    avatarUrl: users.avatarUrl,
                    roleName: roles.name,
                    tournamentName: tournaments.name,
                    tournamentStartDate: tournaments.startDate,
                    tournamentEndDate: tournaments.endDate,
                })
                .from(tournamentMembers)
                .innerJoin(users, eq(tournamentMembers.userId, users.id))
                .innerJoin(roles, eq(tournamentMembers.roleId, roles.id))
                .innerJoin(tournaments, eq(tournamentMembers.tournamentId, tournaments.id))
                .orderBy(asc(users.displayName))
                .limit(pagination.limit)
                .offset(toOffset(pagination)),
            db.select({ count: sql<number>`count(*)::int` }).from(tournamentMembers),
        ]);

        return { items: rows, total: countRows[0]?.count ?? 0 };
    }
}