export type Trigger = {
    id?: number;
    user_id: string;
    style_id: number;
    content: string;
    type: string;
    status: string;
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
    position?: string;
}