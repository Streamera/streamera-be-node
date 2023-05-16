// export type User = {
//     id?: number;
//     user_id: number;
//     from_chain: number;
//     from_token_symbol: string;
//     from_token_address: string;
//     from_amount: string;
//     to_chain: number;
//     to_token_symbol: string;
//     to_token_address: string;
//     to_amount: string;
//     tx_hash: string;
//     usd_worth: string;
//     status: string;
//     created_at: string;
//     updated_at: string;
// }

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