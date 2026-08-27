import { and, eq } from 'drizzle-orm';
import { db } from '../../../../config/database.js';
import { teams } from './schema.js';
import type { TeamRepository } from '../../domain/repositories/team.repository.js';
import type { Team } from '../../domain/entities/team.entity.js';

export class DrizzleTeamRepository implements TeamRepository {
    async findById(id: string): Promise<Team | null> {
        const [row] = await db.select().from(teams).where(eq(teams.id, id)).limit(1);
        return row ?? null;
    }

    async findByTournamentAndName(tournamentId: string, name: string): Promise<Team | null> {
        const [row] = await db
            .select()
            .from(teams)
            .where(and(eq(teams.tournamentId, tournamentId), eq(teams.name, name)))
            .limit(1);
        return row ?? null;
    }

    async findByTournamentId(tournamentId: string): Promise<Team[]> {
        return db.select().from(teams).where(eq(teams.tournamentId, tournamentId));
    }

    async create(input: {
        tournamentId: string;
        categoryId: string;
        name: string;
        abbreviation?: string | null | undefined;
        logoUrl?: string | null | undefined;
    }): Promise<Team> {
        const [row] = await db
            .insert(teams)
            .values({
                tournamentId: input.tournamentId,
                categoryId: input.categoryId,
                name: input.name,
                abbreviation: input.abbreviation ?? null,
                logoUrl: input.logoUrl ?? null,
            })
            .returning();
        if (!row) throw new Error('Failed to create team');
        return row;
    }

    async update(
        id: string,
        input: {
            categoryId?: string | undefined;
            name?: string | undefined;
            abbreviation?: string | null | undefined;
            logoUrl?: string | null | undefined;
        },
    ): Promise<Team> {
        const [row] = await db
            .update(teams)
            .set({ ...input, updatedAt: new Date() })
            .where(eq(teams.id, id))
            .returning();
        if (!row) throw new Error('Failed to update team');
        return row;
    }

    async delete(id: string): Promise<void> {
        const [row] = await db.delete(teams).where(eq(teams.id, id)).returning();
        if (!row) throw new Error('Failed to delete team');
    }
}