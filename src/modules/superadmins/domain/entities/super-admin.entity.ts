export interface SuperAdmin {
    id: string;
    email: string;
    passwordHash: string;
    displayName: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
