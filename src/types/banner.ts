export interface Banner {
    id: string;
    title: string;
    description: string;
    image_url: string;
    gradient: string;
    icon: string;
    button_text?: string;
    display_order: number;
    active: boolean;
    created_at?: string;
    updated_at?: string;
}
