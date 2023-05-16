export type UserStatus = 'active' | 'inactive';

export type User = {
    id?: number;
    name: string;
    wallet: string;
    signature: string;
    profile_picture: string;
    status?: UserStatus;
    created_at?: string;
    updated_at?: string;
}