import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UserIdentifierDto {
    @ApiProperty({
        description: 'ONLY FOR ADMIN: The identifier of the user (id or email)',
        example: 'user@example.com',
    })
    @IsString()
    @IsNotEmpty()
    @Transform(({ value }) =>
        value.toLowerCase().replaceAll(' ', '').replaceAll("'", '')
    )
    term: string;
}
