import { env } from '../../../../config/env.js';
import type { TournamentRepository } from '../../domain/repositories/tournaments.repository.js';
import type { TournamentMemberRepository } from '../../domain/repositories/tournaments-member.repository.js';
import type { UserRepository } from '../../../auth/domain/repositories/user.repository.js';
import type { PasswordHasher } from '../../../auth/application/ports/password-hasher.port.js';
import type { TournamentMember } from '../../domain/entities/tournaments-member.entity.js';
import { EmailAlreadyInUseError } from '../../../auth/domain/errors/auth.errors.js';
import {
    TournamentNotFoundError,
    NotTournamentOwnerOrAdminError,
} from '../../domain/errors/tournaments.errors.js';

/**
 * Crea una cuenta de usuario nueva y la agrega como ADMIN del torneo, en un
 * solo paso. Pensado para cuando la persona a invitar todavía no tiene cuenta
 * en la plataforma (no hay proveedor de correo, así que no hay invitación por
 * email: el owner/admin define la contraseña inicial y se la comparte por
 * fuera).
 */
export class CreateMemberAccountUseCase {
    constructor(
        private readonly tournamentRepository: TournamentRepository,
        private readonly tournamentMemberRepository: TournamentMemberRepository,
        private readonly userRepository: UserRepository,
        private readonly passwordHasher: PasswordHasher,
    ) { }

    async execute(input: {
        tournamentId: string;
        requesterId: string;
        email: string;
        displayName: string;
        password: string;
    }): Promise<TournamentMember> {
        const tournament = await this.tournamentRepository.findById(input.tournamentId);
        if (!tournament) throw new TournamentNotFoundError();

        const requester = await this.tournamentMemberRepository.findByTournamentAndUser(
            input.tournamentId,
            input.requesterId,
        );
        if (!requester || (requester.roleId !== env.OWNER_ROLE_ID && requester.roleId !== env.ADMIN_ROLE_ID)) {
            throw new NotTournamentOwnerOrAdminError();
        }

        const email = input.email.toLowerCase().trim();
        const existing = await this.userRepository.findByEmail(email);
        if (existing) throw new EmailAlreadyInUseError(email);

        const passwordHash = await this.passwordHasher.hash(input.password);
        const user = await this.userRepository.create({
            email,
            passwordHash,
            displayName: input.displayName,
            avatarUrl: null,
        });

        // No hay transacción cruzando los dos repos (usuario y miembro son
        // agregados de módulos distintos). Si el alta del miembro fallara acá,
        // el usuario queda creado pero sin acceso a ningún torneo: no bloquea
        // nada (a diferencia del slug de torneo), así que no vale la pena la
        // complejidad de una transacción cross-módulo por este caso.
        return this.tournamentMemberRepository.create({
            tournamentId: input.tournamentId,
            userId: user.id,
            roleId: env.ADMIN_ROLE_ID,
        });
    }
}