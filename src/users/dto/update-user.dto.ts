import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { AtLeastOneField } from 'src/validators/at-least-one-field';


@AtLeastOneField(['name', 'email', 'password', 'roles'], {
    message: 'You must provide at least one field to update.',
})
export class UpdateUserDto extends PartialType(CreateUserDto) {
    @ApiPropertyOptional({
        description: 'Only admins can change roles. Omit if you are not admin.',
        example: ['user'],
        type: [String],
    })
    roles?: string[];
}
