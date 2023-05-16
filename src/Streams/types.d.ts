export type StreamStatus = 'live' | 'ended' | 'scheduled';

export type Streams = {
    id?: number;
    user_id: number;
    title: string;
    description: string;
    thumbnail: string;
    start_at: string;
    end_at: string;
    status: string;
    created_at?: string;
    updated_at?: string | null;
    deleted_at?: string | null;
}