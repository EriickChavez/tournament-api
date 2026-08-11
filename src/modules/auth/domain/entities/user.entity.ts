export type UserStatus = 'ACTIVE' | 'SUSPENDED';

export interface User {
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    status: UserStatus;
    emailVerifiedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
