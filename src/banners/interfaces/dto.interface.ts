import { RenewalStrategy } from "@prisma/client";

export interface BannerFormFields {
    start_date?: string | Date;
    end_date?: string | Date;
    position_id?: string | number;
    renewal_strategy?: string | RenewalStrategy;
    renewal_period?: string | number;
    display_order?: string | number;
    image_url?: string;
    destination_link?: string;
    user_id?: string;
    [key: string]: any;
};