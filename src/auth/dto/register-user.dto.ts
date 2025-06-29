import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString, MinLength, IsLowercase, IsStrongPassword, IsArray, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RegisterUserDto {
    @ApiProperty({
        description: 'The name of the user (optional)',
        example: 'John Doe',
        default: null,
    })
    @Transform(({ value }) =>
        typeof value === 'string'
            ? value.trim().toLowerCase()
            : value
    )
    @IsOptional()
    @IsString()
    @MinLength(3)
    name?: string;

    @ApiProperty({
        description: 'The email of the user',
        example: 'test@test.com',
        default: 'user@example.com',
    })
    @Transform(({ value }) =>
        typeof value === 'string'
            ? value.toLowerCase().replaceAll(' ', '').replaceAll("'", '')
            : value
    )
    @IsEmail()
    @IsNotEmpty()
    @IsString()
    @IsLowercase()

    email: string;

    @ApiProperty({
        description: 'The password of the user',
        example: 'Password123!',
        default: 'Password123!',
    })
    @IsStrongPassword()
    @IsNotEmpty()
    @IsString()
    password: string;
}
