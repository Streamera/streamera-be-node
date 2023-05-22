import OverlayPosition from '../OverlayStyles/types';
export type AnnouncementStatus = 'active' | 'inactive';

export type Announcement = {
    id?: string;
    user_id: number;
    style_id: number;
    content: string;
    speed: string;
    start_at: string;
    end_at: string;
    status: AnnouncementStatus;
    created_at: string;
    updated_at: string;
    deleted_at: string;
    font_type?: string;
    font_size?: string;
    font_color?: string;
    bg_color?: string;
    bg_image?: string;
    bar_empty_color?: string;
    bar_filled_color?: string;
    position?: OverlayPosition;
}