import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString, MinLength, IsLowercase, IsStrongPassword, IsArray, IsOptional } from "class-validator";

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @Transform(({ value }) =>
        value.toLowerCase().replaceAll(' ', '').replaceAll("'", '')
    )
    name: string;

    @IsEmail()
    @IsNotEmpty()
    @IsString()
    @IsLowercase()
    @Transform(({ value }) =>
        value.toLowerCase().replaceAll(' ', '').replaceAll("'", '')
    )
    email: string;

    @IsStrongPassword()
    @IsNotEmpty()
    @IsString()
    password: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    roles?: string[];
}
