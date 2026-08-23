export interface User {
    id: string;
    email: string;
    passwordHash: string;
    displayName: string;
    avatarUrl: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}