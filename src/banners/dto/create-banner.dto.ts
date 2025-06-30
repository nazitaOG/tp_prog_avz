import { RenewalStrategy } from "@prisma/client";
import { Type, Transform } from "class-transformer";
import {
    IsNotEmpty,
    IsString,
    IsUrl,
    IsOptional,
    IsNumber,
    IsDate,
    IsIn,
    IsPositive,
    Min,
    Max,
    IsInt,
    IsDefined,
    IsEnum,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateBannerDto {
    @ApiProperty({
        description: 'The destination link of the banner',
        example: 'https://www.google.com',
        required: true,
    })
    @IsUrl()
    @IsNotEmpty()
    @IsString()
    destination_link: string;

    @ApiProperty({
        description: 'The start date of the banner',
        example: '2025-01-01',
        required: false,
    })
    @IsOptional()
    @Transform(({ value }) => value === '' ? undefined : new Date(value))
    @IsDate()
    start_date?: Date;

    @ApiProperty({
        description: 'The end date of the banner',
        example: '2025-01-31',
        required: false,
    })
    @IsOptional()
    @Transform(({ value }) => value === '' ? undefined : new Date(value))
    @IsDate()
    end_date?: Date;

    @ApiProperty({
        description: 'The position id of the banner',
        example: 1,
        required: true,
    })
    @IsDefined()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    position_id: number;

    @ApiProperty({
        description: 'The renewal strategy of the banner',
        example: 'automatic',
        required: true,
    })
    @IsEnum(RenewalStrategy)
    renewal_strategy: RenewalStrategy;

    @ApiProperty({
        description: 'The renewal period of the banner',
        example: 30,
        required: false,
    })
    @IsOptional()
    @Transform(({ value }) => value === '' ? undefined : Number(value))
    @IsNumber()
    @IsIn([30, 60, 90], { message: 'renewal_period must be one of: 30, 60, or 90' })
    renewal_period?: number;

    @ApiProperty({
        description: 'The display order of the banner',
        example: 1,
        required: false,
    })
    @IsOptional()
    @Transform(({ value }) => value === '' ? undefined : Number(value))
    @IsNumber()
    @Min(1)
    @Max(3)
    @IsPositive()
    display_order?: number;
}
