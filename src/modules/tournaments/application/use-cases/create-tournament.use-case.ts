import { env } from '../../../../config/env.js';
import type { TournamentRepository } from '../../domain/repositories/tournaments.repository.js';
import type { TournamentMemberRepository } from '../../domain/repositories/tournaments-member.repository.js';
import type { SlugGenerator } from '../ports/slug-generator.port.js';
import { SlugAlreadyInUseError } from '../../domain/errors/tournaments.errors.js';
import type { Tournament } from '../../domain/entities/tournaments.entity.js';

export class CreateTournamentUseCase {
    constructor(
        private readonly tournamentRepository: TournamentRepository,
        private readonly tournamentMemberRepository: TournamentMemberRepository,
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

        const tournament = await this.tournamentRepository.create({
            name: input.name,
            subtitle: input.subtitle ?? null,
            description: input.description ?? null,
            slug,
            startDate: input.startDate ?? null,
            endDate: input.endDate ?? null,
            timezone: input.timezone,
            createdByUserId: input.userId,
        });

        await this.tournamentMemberRepository.create({
            tournamentId: tournament.id,
            userId: input.userId,
            roleId: env.OWNER_ROLE_ID,
        });

        return tournament;
    }
}