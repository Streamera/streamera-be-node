export type OverlayPosition = 'top-left' | 'top-center' | 'top-right' | 'middle-left' | 'middle-center' | 'middle-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

export type OverlayStyles = {
    id?: number;
    font_type: string;
    font_size: string;
    font_color: string;
    bg_color: string;
    bg_image: string;
    bar_empty_color: string;
    bar_filled_color: string;
    position: OverlayPosition;
    created_at?: string;
    updated_at?: string;
}