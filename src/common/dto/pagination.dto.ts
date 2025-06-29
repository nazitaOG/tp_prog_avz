import { IsNumber, IsOptional, IsPositive, Min } from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class PaginationDto {
    @ApiProperty({
        default:10,
        description: 'The number of items to return',
        required: false,
    })
    @IsOptional()
    @IsPositive()
    @IsNumber()
    @Type(() => Number)
    limit?: number;

    @ApiProperty({
        default:0,
        description: 'The number of items to skip',
        required: false,
    })
    @IsOptional()
    @Min(0)
    @IsNumber() 
    @Type(() => Number)
    offset?: number;
}