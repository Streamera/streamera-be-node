export type PaymentStatus = 'pending' | 'success' | 'failed';

export type Payment = {
    id?: number;
    from_user: number;
    from_wallet: string;
    from_chain: number;
    from_token_symbol: string;
    from_token_address: string;
    from_amount: string;
    to_user: number;
    to_wallet: string;
    to_chain: number;
    to_token_symbol: string;
    to_token_address: string;
    // to_amount: string;
    tx_hash: string;
    usd_worth: string;
    status: PaymentStatus;
    created_at?: string;
    updated_at?: string | null;
}

export type PaymentAggregate = {
    from_user: number | null;
    name: string;
    amount_usd: number;
}

export type History = {
    send: Payment[];
    receive: Payment[];
}