import { RenewalStrategy } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsString, IsUrl, IsOptional, IsUUID, IsNumber, IsEnum, IsDate, IsIn, IsPositive, Min, Max } from "class-validator";

export class CreateBannerDto {
    @IsUrl()
    @IsNotEmpty()
    @IsString()
    image_url: string;

    @IsUrl()
    @IsNotEmpty()
    @IsString()
    destination_link: string;

    @Transform(({ value }) => value ? new Date(value) : null)
    @IsDate()
    @IsOptional()
    start_date?: Date;

    @Transform(({ value }) => value ? new Date(value) : null)
    @IsDate()
    @IsOptional()
    end_date?: Date;

    @IsUUID()
    @IsNotEmpty()
    user_id: string;

    @IsNumber()
    @IsNotEmpty()
    position_id: number;

    @IsEnum(RenewalStrategy)
    @IsNotEmpty()
    renewal_strategy: RenewalStrategy;

    @IsOptional()
    @IsNumber()
    @IsIn([30, 60, 90], { message: 'renewal_period must be one of: 30, 60, or 90' })
    renewal_period?: number;

    @IsNumber()
    @Min(1)
    @Max(3)     
    @IsPositive()
    @IsOptional()
    display_order?: number;
}
