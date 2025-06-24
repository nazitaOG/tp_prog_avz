import { RenewalStrategy } from "@prisma/client";
import { Type } from "class-transformer";
import { IsNotEmpty, IsString, IsUrl, IsOptional, IsUUID, IsNumber, IsDate, IsIn, IsPositive, Min, Max, IsInt, IsDefined, IsEnum } from "class-validator";

export class CreateBannerDto {
    @IsUrl() @IsNotEmpty() @IsString()
    image_url: string;

    @IsUrl()
    @IsNotEmpty()
    @IsString()
    destination_link: string;

    @Type(() => Date)
    @IsDate()
    @IsOptional()
    start_date?: Date;

    @Type(() => Date)
    @IsDate()
    @IsOptional()
    end_date?: Date;

    @IsUUID()
    @IsNotEmpty()
    user_id: string;

    @IsDefined()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    position_id: number;

    @IsEnum(RenewalStrategy)
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
