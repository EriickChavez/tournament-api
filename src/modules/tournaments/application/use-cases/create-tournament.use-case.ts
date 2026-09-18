import { env } from '../../../../config/env.js';
import type { TournamentRepository } from '../../domain/repositories/tournaments.repository.js';
import type { SlugGenerator } from '../ports/slug-generator.port.js';
import { SlugAlreadyInUseError } from '../../domain/errors/tournaments.errors.js';
import type { Tournament } from '../../domain/entities/tournaments.entity.js';

export class CreateTournamentUseCase {
    constructor(
        private readonly tournamentRepository: TournamentRepository,
        private readonly slugGenerator: SlugGenerator,
    ) { }

    async execute(input: {
        name: string;
        subtitle?: string | undefined;
        description?: string | undefined;
        startDate?: string | null | undefined;
        endDate?: string | null | undefined;
        timezone?: string | undefined;
        userId: string;
    }): Promise<Tournament> {
        const slug = this.slugGenerator.generate(input.name);

        const existing = await this.tournamentRepository.findBySlug(slug);
        if (existing) throw new SlugAlreadyInUseError(slug);

        // El torneo y su miembro OWNER se crean en una sola transacción: antes
        // eran dos escrituras sueltas y si la segunda fallaba quedaba un torneo
        // huérfano que bloqueaba el slug en el siguiente intento.
        return this.tournamentRepository.createWithOwner(
            {
                name: input.name,
                subtitle: input.subtitle ?? null,
                description: input.description ?? null,
                slug,
                startDate: input.startDate ?? null,
                endDate: input.endDate ?? null,
                timezone: input.timezone,
                createdByUserId: input.userId,
            },
            env.OWNER_ROLE_ID,
        );
    }
}