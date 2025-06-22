import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class UserIdentifierDto {
    @IsString()
    @IsNotEmpty()
    @Transform(({ value }) =>
        value.toLowerCase().replaceAll(' ', '').replaceAll("'", '')
    )
    term: string;
}
