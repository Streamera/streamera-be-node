export type UserStatus = 'active' | 'inactive';

export type User = {
    id?: number;
    name: string;
    wallet: string;
    signature: string;
    profile_picture: string;
    status?: UserStatus;
    created_at?: string;
    updated_at?: string | null;
    to_chain?: number;
    to_token_symbol?: string;
    to_token_address?: string;
    twitch?: string;
    discord?: string;
    youtube?: string;
    instagram?: string;
    tiktok?: string;
    twitter?: string;
    facebook?: string;
    email?: string;
    quick_amount: number[] | string[];
}