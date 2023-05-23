import OverlayPosition from '../OverlayStyles/types';
export type TriggerType = 'alltime' | 'milestone' | 'poll';
export type TriggerStatus = 'active' | 'inactive';

export type Trigger = {
    id?: number;
    user_id: number;
    style_id: number;
    content: string;
    caption: string;
    type: TriggerType;
    status: TriggerStatus;
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
    theme?: Theme;
}