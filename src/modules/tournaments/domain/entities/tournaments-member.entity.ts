export interface TournamentMember {
    id: string;
    tournamentId: string;
    userId: string;
    roleId: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface TournamentMemberWithUser extends TournamentMember {
    displayName: string;
    avatarUrl: string | null;
}