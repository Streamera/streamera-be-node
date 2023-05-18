import OverlayPosition from '../OverlayStyles/types';
export type PollStatus = 'active' | 'inactive';

export type Poll = {
    id?: number;
    user_id: string;
    title: string;
    start_at: string;
    end_at: string;
    status: PollStatus;
    style_id: number;
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
    options?: any;
}