import { Transform } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, IsLowercase} from "class-validator";

export class LoginUserDto {

    @ApiProperty({
        description: 'The email of the user',
        example: 'user@example.com',
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
        example: 'user123',
    })
    @IsNotEmpty()
    @IsString()
    password: string;

}
