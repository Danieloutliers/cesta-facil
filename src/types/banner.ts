export interface Banner {
    id: string;
    title: string;
    description: string;
    image_url: string;
    gradient: string;
    icon: string;
    button_text?: string;
    link?: string;
    display_order: number;
    active: boolean;
    use_blur?: boolean;
    blur_amount?: number;
    created_at?: string;
    updated_at?: string;
}
