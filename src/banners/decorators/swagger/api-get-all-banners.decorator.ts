import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

export function ApiGetAllBanners() {
    return applyDecorators(
        ApiResponse({ status: 200, description: 'Banners fetched successfully' }),
        ApiResponse({ status: 500, description: 'Internal server error' })
    );
}