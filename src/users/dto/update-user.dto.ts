import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import {
    IsOptional,
    IsString,
    IsStrongPassword,
    IsEmail,
    MinLength,
    IsNotEmpty,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { AtLeastOneField } from 'src/validators/at-least-one-field';


@AtLeastOneField(['name', 'email', 'password', 'roles'], {
    message: 'You must provide at least one field to update.',
})
export class UpdateUserDto extends PartialType(CreateUserDto) {
    // @IsOptional()
    // @IsString()
    // @IsNotEmpty()
    // @MinLength(3)
    // @Transform(({ value }) =>
    //     value.toLowerCase().replaceAll(' ', '').replaceAll("'", '')
    // )
    // name?: string;

    // @IsOptional()
    // @IsEmail()
    // @IsString()
    // @IsNotEmpty()
    // @Transform(({ value }) =>
    //     value.toLowerCase().replaceAll(' ', '').replaceAll("'", '')
    // )
    // email?: string;

    // @IsOptional()
    // @IsStrongPassword()
    // @IsNotEmpty()
    // @IsString()
    // password?: string;

    // Recieve all from create user dto
}
