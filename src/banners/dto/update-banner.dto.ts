import { PartialType } from '@nestjs/mapped-types';
import { CreateBannerDto } from './create-banner.dto';
import { AtLeastOneField } from 'src/validators/at-least-one-field';


@AtLeastOneField(['image_url', 'destination_link', 'start_date', 'end_date', 'user_id', 'position_id', 'renewal_strategy', 'renewal_period', 'display_order'], {
    message: 'You must provide at least one field to update.',
})
export class UpdateBannerDto extends PartialType(CreateBannerDto) { }
