// src/banners/dto/create-banner-request.dto.ts

import { OmitType } from '@nestjs/mapped-types';
import { CreateBannerDto } from './create-banner.dto';

export class CreateBannerRequestDto extends OmitType(
    CreateBannerDto,
    ['image_url'] as const,
) { }
