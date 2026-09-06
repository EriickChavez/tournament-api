import { db } from '../../../../config/database.js';
import { tournaments, roles } from '../../../tournaments/infrastructure/database/schema.js';
import { ne } from 'drizzle-orm';
import { env } from '../../../../config/env.js';

export class ListLookupOptionsUseCase {
    async execute() {
        const [tournamentRows, roleRows] = await Promise.all([
            db.select({ id: tournaments.id, name: tournaments.name }).from(tournaments),
            db.select({ id: roles.id, name: roles.name }).from(roles).where(ne(roles.id, env.OWNER_ROLE_ID)),
        ]);
        return { tournaments: tournamentRows, roles: roleRows };
    }
}