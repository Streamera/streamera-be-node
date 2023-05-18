export type DonationSetting = {
    id?: number;
    user_id: number;
    to_chain: number;
    to_token_symbol: string;
    to_token_address: string;
    created_at?: string;
    updated_at?: string;
}