import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString, MinLength, IsLowercase, IsStrongPassword, IsArray, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateUserDto {
    @ApiProperty({
        description: 'The name of the user (optional)',
        example: 'John Doe',
        default: null,
        required: false,
    })
    @IsOptional()
    @IsString()
    @MinLength(3)
    @Transform(({ value }) =>
        value.toLowerCase().replaceAll(' ', '').replaceAll("'", '')
    )
    name?: string;

    @ApiProperty({
        description: 'The email of the user',
        example: 'test@test.com',
        default: '',
        required: true,
    })
    @IsEmail()
    @IsNotEmpty()
    @IsString()
    @IsLowercase()
    @Transform(({ value }) =>
        value.toLowerCase().replaceAll(' ', '').replaceAll("'", '')
    )
    email: string;

    @ApiProperty({
        description: 'The password of the user',
        example: 'Password123!',
        default: '',
        required: true,
    })
    @IsStrongPassword()
    @IsNotEmpty()
    @IsString()
    password: string;

    @ApiProperty({
        description: 'The roles of the user (admin, advertiser, user) (optional)',
        example: ['user'],
        default: ['user'],
        required: false,
    })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    roles?: string[];
}
