import OverlayPosition from '../OverlayStyles/types';
export type LeaderboardStatus = 'active' | 'inactive';
export type LeaderboardTimeframe = 'monthly' | 'weekly' | 'daily';

export type Leaderboard = {
    id?: number;
    user_id: number;
    title: string;
    style_id: number;
    status: LeaderboardStatus;
    timeframe: LeaderboardTimeframe;
    created_at?: string;
    updated_at?: string;
    font_type?: string;
    font_size?: string;
    font_color?: string;
    bg_color?: string;
    bg_image?: string;
    bar_empty_color?: string;
    bar_filled_color?: string;
    position?: OverlayPosition;
}