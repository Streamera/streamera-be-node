import OverlayPosition from '../OverlayStyles/types';
export type QRStatus = 'active' | 'inactive';

export type QR = {
    id?: number;
    user_id: number;
    qr: string;
    style_id: number;
    status: QRStatus;
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
    theme?: Theme;
}