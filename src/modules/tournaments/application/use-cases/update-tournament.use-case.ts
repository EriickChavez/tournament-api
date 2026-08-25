import type { TournamentRepository } from '../../domain/repositories/tournaments.repository.js';
import type { TournamentMemberRepository } from '../../domain/repositories/tournaments-member.repository.js';
import type { SlugGenerator } from '../ports/slug-generator.port.js';
import { TournamentNotFoundError, NotTournamentOwnerError, SlugAlreadyInUseError } from '../../domain/errors/tournaments.errors.js';
import type { Tournament } from '../../domain/entities/tournaments.entity.js';
import { env } from '../../../../config/env.js';

export class UpdateTournamentUseCase {
    constructor(
        private readonly tournamentRepository: TournamentRepository,
        private readonly tournamentMemberRepository: TournamentMemberRepository,
        private readonly slugGenerator: SlugGenerator,
    ) { }

    async execute(input: {
        tournamentId: string;
        userId: string;
        name?: string | undefined;
        subtitle?: string | undefined;
        description?: string | undefined;
    }): Promise<Tournament> {
        const tournament = await this.tournamentRepository.findById(input.tournamentId);
        if (!tournament) throw new TournamentNotFoundError();

        const member = await this.tournamentMemberRepository.findByTournamentAndUser(
            input.tournamentId,
            input.userId,
        );
        if (!member || member.roleId !== env.OWNER_ROLE_ID) {
            throw new NotTournamentOwnerError();
        }

        let slug: string | undefined;
        if (input.name && input.name !== tournament.name) {
            slug = this.slugGenerator.generate(input.name);
            const existing = await this.tournamentRepository.findBySlug(slug);
            if (existing && existing.id !== tournament.id) {
                throw new SlugAlreadyInUseError(slug);
            }
        }

        return this.tournamentRepository.update(input.tournamentId, {
            name: input.name,
            subtitle: input.subtitle,
            description: input.description,
            slug,
            updatedByUserId: input.userId,
        });
    }
}