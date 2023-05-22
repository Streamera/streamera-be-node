import OverlayPosition from '../OverlayStyles/types';
export type MilestoneStatus = 'active' | 'inactive';
export type MilestoneTimeframe = 'monthly' | 'weekly' | 'daily';

export type Milestone = {
    id?: number;
    user_id: number;
    title: string;
    target: string;
    style_id: number;
    status: MilestoneStatus;
    timeframe: MilestoneTimeframe;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string;
    font_type?: string;
    font_size?: string;
    font_color?: string;
    bg_color?: string;
    bg_image?: string;
    bar_empty_color?: string;
    bar_filled_color?: string;
    position?: OverlayPosition;
    profit?: string;
    percent?: number;
}