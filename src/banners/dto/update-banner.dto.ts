import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateBannerDto } from './create-banner.dto';
import { AtLeastOneField } from 'src/validators/at-least-one-field';


export class UpdateBannerDto extends PartialType(CreateBannerDto) { }

AtLeastOneField(
    [
        'image_url',
        'destination_link',
        'start_date',
        'end_date',
        'position_id',
        'renewal_strategy',
        'renewal_period',
        'display_order',
    ],
    { message: 'You must provide at least one field to update.' },
)(UpdateBannerDto);
