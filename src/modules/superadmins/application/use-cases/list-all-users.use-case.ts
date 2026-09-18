import { db } from '../../../../config/database.js';
import { tournamentMembers, roles, tournaments } from '../../../tournaments/infrastructure/database/schema.js';
import { users } from '../../../auth/infrastructure/database/schema.js';
import { eq, asc, sql, inArray } from 'drizzle-orm';
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
        // Se pagina por USUARIO (no por fila del join): antes el LIMIT/OFFSET se aplicaba
        // a usuario×torneo mientras `total` contaba usuarios, así que las páginas salían
        // partidas/duplicadas y totalPages no cuadraba. El orden lleva id como desempate
        // para que la paginación sea estable con nombres repetidos.
        const [pageUsers, countRows] = await Promise.all([
            db
                .select({
                    id: users.id,
                    displayName: users.displayName,
                    email: users.email,
                    avatarUrl: users.avatarUrl,
                })
                .from(users)
                .orderBy(asc(users.displayName), asc(users.id))
                .limit(pagination.limit)
                .offset(toOffset(pagination)),
            db.select({ count: sql<number>`count(*)::int` }).from(users),
        ]);

        const memberships =
            pageUsers.length === 0
                ? []
                : await db
                    .select({
                        userId: tournamentMembers.userId,
                        memberId: tournamentMembers.id,
                        roleId: roles.id,
                        roleName: roles.name,
                        tournamentId: tournaments.id,
                        tournamentName: tournaments.name,
                        tournamentStartDate: tournaments.startDate,
                        tournamentEndDate: tournaments.endDate,
                    })
                    .from(tournamentMembers)
                    .innerJoin(roles, eq(tournamentMembers.roleId, roles.id))
                    .innerJoin(tournaments, eq(tournamentMembers.tournamentId, tournaments.id))
                    .where(
                        inArray(
                            tournamentMembers.userId,
                            pageUsers.map((user) => user.id),
                        ),
                    )
                    .orderBy(asc(tournaments.name), asc(tournamentMembers.id));

        const membershipsByUser = new Map<string, typeof memberships>();
        for (const membership of memberships) {
            const list = membershipsByUser.get(membership.userId) ?? [];
            list.push(membership);
            membershipsByUser.set(membership.userId, list);
        }

        const items = pageUsers.flatMap((user): UserOverviewRow[] => {
            const userMemberships = membershipsByUser.get(user.id) ?? [];

            if (userMemberships.length === 0) {
                return [
                    {
                        userId: user.id,
                        memberId: null,
                        displayName: user.displayName,
                        email: user.email,
                        avatarUrl: user.avatarUrl,
                        roleId: null,
                        roleName: null,
                        tournamentId: null,
                        tournamentName: null,
                        tournamentStartDate: null,
                        tournamentEndDate: null,
                    },
                ];
            }

            return userMemberships.map((membership) => ({
                userId: user.id,
                memberId: membership.memberId,
                displayName: user.displayName,
                email: user.email,
                avatarUrl: user.avatarUrl,
                roleId: membership.roleId,
                roleName: membership.roleName,
                tournamentId: membership.tournamentId,
                tournamentName: membership.tournamentName,
                tournamentStartDate: membership.tournamentStartDate,
                tournamentEndDate: membership.tournamentEndDate,
            }));
        });

        return { items, total: countRows[0]?.count ?? 0 };
    }
}